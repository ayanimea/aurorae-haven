/**
 * Template Migration Utility
 * Fixes corrupted template types in IndexedDB
 * 
 * Issue: Routine templates incorrectly stored with type: "task"
 * This utility diagnoses and fixes the corruption.
 */

import { getAllTemplates, updateTemplate } from './templatesManager'
import { getPredefinedTemplates } from './predefinedTemplates'
import { createLogger } from './logger'

const logger = createLogger('TemplateMigration')

// LocalStorage key for migration completion flag.
// NOTE:
// - This flag is versioned (v1) to represent the first template-type migration.
// - If you introduce a new template migration in the future, DO NOT change or
//   reuse this key. Instead, create a new, versioned flag, e.g.:
//     const NEW_MIGRATION_FLAG_KEY = 'aurorae_templates_migrated_v2'
// - Older flags must remain stable so that users who already completed v1
//   are not incorrectly treated as having completed later migrations.
// LocalStorage key for migration completion flag.
// NOTE: This flag is versioned (v1) to represent the first template-type migration.
// If you introduce a new template migration in the future, DO NOT change or reuse this key.
// Instead, create a new versioned flag (e.g., 'aurorae_templates_migrated_v2').
// Older flags must remain stable so users who completed v1 aren't treated as needing later migrations.
const MIGRATION_FLAG_KEY = 'aurorae_templates_migrated_v1'

/**
 * Diagnostic: Check if any templates have incorrect types
 * 
 * Note: This only checks predefined templates. Custom user-created templates
 * (those not in the predefined list) are considered correct and excluded from
 * migration. Only predefined templates with mismatched types are flagged as corrupted.
 * 
 * @returns {Promise<Object>} Diagnostic results with counts and details
 */
export async function diagnoseTemplateTypes() {
  const results = {
    total: 0,
    correct: 0,
    corrupted: [],
    missing: []
  }

  try {
    // Get templates from storage
    const storedTemplates = await getAllTemplates()
    results.total = storedTemplates.length

    // Get predefined templates for comparison
    const predefinedTemplates = getPredefinedTemplates()
    const predefinedMap = new Map(predefinedTemplates.map(t => [t.id, t]))

    logger.log(`Diagnosing ${storedTemplates.length} templates...`)

    for (const stored of storedTemplates) {
      const predefined = predefinedMap.get(stored.id)
      
      if (!predefined) {
        // Custom template created by user - not part of migration
        // These are considered correct since they're user-defined
        results.correct++
        continue
      }

      // Compare stored vs predefined type
      if (stored.type !== predefined.type) {
        results.corrupted.push({
          id: stored.id,
          title: stored.title || stored.id,
          storedType: stored.type,
          correctType: predefined.type
        })
        logger.warn(`Corrupted: ${stored.id} - stored as "${stored.type}", should be "${predefined.type}"`)
      } else {
        results.correct++
      }
    }

    // Check for missing predefined templates
    const storedIds = new Set(storedTemplates.map(t => t.id))
    for (const predefined of predefinedTemplates) {
      if (!storedIds.has(predefined.id)) {
        results.missing.push({
          id: predefined.id,
          title: predefined.title || predefined.id,
          type: predefined.type
        })
      }
    }

    logger.log(`Diagnostic complete: ${results.correct} correct, ${results.corrupted.length} corrupted, ${results.missing.length} missing`)
    return results

  } catch (error) {
    logger.error('Error during template type diagnosis:', error)
    throw error
  }
}

/**
 * Fix corrupted template types by comparing with predefined templates
 * 
 * Note: This only fixes predefined templates. Custom user templates are not modified.
 * After successful fix, sets a localStorage flag to skip future checks.
 * 
 * @returns {Promise<Object>} Fix results with count of fixed templates and any errors
 */
export async function fixCorruptedTemplateTypes() {
  const results = {
    fixed: 0,
    errors: [],
    details: []
  }

  try {
    // First diagnose the issue
    const diagnosis = await diagnoseTemplateTypes()

    if (diagnosis.corrupted.length === 0) {
      logger.log('No corrupted templates found. Nothing to fix.')
      // Set flag to avoid future checks
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
      return results
    }

    logger.log(`Fixing ${diagnosis.corrupted.length} corrupted templates...`)

    // Get predefined templates for correct type info
    const predefinedTemplates = getPredefinedTemplates()
    const predefinedMap = new Map(predefinedTemplates.map(t => [t.id, t]))

    // Fix each corrupted template
    for (const corrupted of diagnosis.corrupted) {
      try {
        const predefined = predefinedMap.get(corrupted.id)
        if (!predefined) {
          logger.error(`Cannot fix ${corrupted.id}: predefined template not found`)
          results.errors.push({
            id: corrupted.id,
            error: 'Predefined template not found'
          })
          continue
        }

        // Update the template with correct type
        await updateTemplate(corrupted.id, {
          type: predefined.type
        })

        results.fixed++
        results.details.push({
          id: corrupted.id,
          title: corrupted.title,
          oldType: corrupted.storedType,
          newType: predefined.type
        })

        logger.log(`Fixed: ${corrupted.title} (${corrupted.storedType} → ${predefined.type})`)

      } catch (error) {
        logger.error(`Error fixing template ${corrupted.id}:`, error)
        results.errors.push({
          id: corrupted.id,
          error: error.message
        })
      }
    }

    logger.log(`Fix complete: ${results.fixed} fixed, ${results.errors.length} errors`)
    
    // Set flag to avoid future checks if all fixes succeeded
    if (results.errors.length === 0) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
    }
    
    return results

  } catch (error) {
    logger.error('Error during template type fix:', error)
    throw error
  }
}

/**
 * Check if templates need migration (quick check with caching)
 * 
 * Performance optimization: Checks localStorage flag first. If migration was
 * already completed, returns false immediately without querying IndexedDB.
 * This avoids unnecessary work on every Library page load.
 * 
 * @returns {Promise<boolean>} True if migration is needed
 */
export async function needsTemplateMigration() {
  try {
    // Quick check: if migration was already done, skip
    const migrationComplete = localStorage.getItem(MIGRATION_FLAG_KEY)
    if (migrationComplete === 'true') {
      return false
    }
    
    // Otherwise, perform full diagnostic
    const diagnosis = await diagnoseTemplateTypes()
    return diagnosis.corrupted.length > 0
  } catch (error) {
    logger.error('Error checking if migration is needed:', error)
    return false
  }
}

/**
 * Reset migration flag (for testing or forcing re-check)
 * @internal
 */
export function resetMigrationFlag() {
  localStorage.removeItem(MIGRATION_FLAG_KEY)
}
