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

/**
 * Diagnostic: Check if any templates have incorrect types
 * @returns {Promise<Object>} Diagnostic results
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
        // Custom template created by user
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
 * @returns {Promise<Object>} Fix results
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
    return results

  } catch (error) {
    logger.error('Error during template type fix:', error)
    throw error
  }
}

/**
 * Check if templates need migration (quick check)
 * @returns {Promise<boolean>} True if migration is needed
 */
export async function needsTemplateMigration() {
  try {
    const diagnosis = await diagnoseTemplateTypes()
    return diagnosis.corrupted.length > 0
  } catch (error) {
    logger.error('Error checking if migration is needed:', error)
    return false
  }
}
