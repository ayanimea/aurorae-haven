// Data validation utilities
// Centralized validation logic for import/export data structures

// Validation types for field definitions
const VALIDATION_TYPES = {
  STRING: 'string',
  ARRAY: 'array'
}

// Valid template types
const VALID_TEMPLATE_TYPES = ['task', 'routine']

// BrainDump field type definitions for validation
const BRAIN_DUMP_FIELDS = {
  content: VALIDATION_TYPES.STRING,
  tags: VALIDATION_TYPES.STRING,
  versions: VALIDATION_TYPES.ARRAY,
  entries: VALIDATION_TYPES.ARRAY
}

// Array of field names that should be arrays in export/import data
const ARRAY_FIELDS = ['tasks', 'routines', 'habits', 'dumps', 'schedule']

/**
 * Check if value matches expected type
 * @param {*} value - Value to check
 * @param {string} expectedType - Expected type (from VALIDATION_TYPES)
 * @returns {boolean}
 */
function isValidFieldType(value, expectedType) {
  if (value === undefined || value === null) {
    return true // Optional fields are valid if missing
  }

  if (expectedType === VALIDATION_TYPES.STRING) {
    return typeof value === 'string'
  }
  if (expectedType === VALIDATION_TYPES.ARRAY) {
    return Array.isArray(value)
  }
  return false
}

/**
 * Validate object fields against configuration
 * @param {object} obj - Object to validate
 * @param {object} fieldsConfig - Field configuration {fieldName: expectedType}
 * @param {string} prefix - Prefix for error messages
 * @returns {string[]} - Array of error messages (empty if valid)
 */
function validateObjectFields(obj, fieldsConfig, prefix = '') {
  const errors = []

  for (const [fieldName, expectedType] of Object.entries(fieldsConfig)) {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
      if (!isValidFieldType(obj[fieldName], expectedType)) {
        errors.push(
          `${prefix}${fieldName} must be a ${expectedType} (found: ${typeof obj[fieldName]})`
        )
      }
    }
  }

  return errors
}

/**
 * Validate array fields in object
 * @param {object} obj - Object to validate
 * @param {string[]} fieldNames - Array of field names to check
 * @param {string} expectedType - Expected type for each field
 * @param {string} prefix - Prefix for error messages
 * @returns {string[]} - Array of error messages (empty if valid)
 */
function validateArrayFields(obj, fieldNames, expectedType, prefix = '') {
  const errors = []

  for (const fieldName of fieldNames) {
    if (
      obj[fieldName] !== undefined &&
      !isValidFieldType(obj[fieldName], expectedType)
    ) {
      errors.push(
        `${prefix}${fieldName} must be an ${expectedType} (found: ${typeof obj[fieldName]})`
      )
    }
  }

  return errors
}

/**
 * @typedef {Object} ValidateExportResult
 * @property {boolean} valid - Whether the data is valid for export
 * @property {string[]} errors - List of validation error messages
 * @property {string|null} stringified - JSON string if serialization successful
 */

/**
 * Validate export data structure and test JSON serialization
 * @param {object} data - Data object to validate
 * @returns {ValidateExportResult}
 */
export function validateExportData(data) {
  const errors = []

  // Check required fields exist and are arrays
  errors.push(
    ...validateArrayFields(data, ARRAY_FIELDS, VALIDATION_TYPES.ARRAY)
  )

  // Validate BrainDump structure if dumps exist
  if (data.dumps && Array.isArray(data.dumps)) {
    data.dumps.forEach((dump, index) => {
      errors.push(
        ...validateObjectFields(dump, BRAIN_DUMP_FIELDS, `dumps[${index}].`)
      )
    })
  }

  // Test JSON serialization (circular reference, non-serializable data)
  let stringified = null
  try {
    stringified = JSON.stringify(data)
  } catch (e) {
    errors.push(`Data serialization failed: ${e.message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    stringified
  }
}

/**
 * @typedef {Object} ValidateImportResult
 * @property {boolean} valid - Whether the import data is valid
 * @property {string[]} errors - List of validation error messages
 */

/**
 * Validate import data structure
 * @param {object} obj - Parsed JSON object
 * @returns {ValidateImportResult}
 */
export function validateImportData(obj) {
  const errors = []

  // Check required fields
  errors.push(...validateArrayFields(obj, ARRAY_FIELDS, VALIDATION_TYPES.ARRAY))

  // Validate BrainDump structure if dumps exist
  if (obj.dumps && Array.isArray(obj.dumps)) {
    obj.dumps.forEach((dump, index) => {
      errors.push(
        ...validateObjectFields(dump, BRAIN_DUMP_FIELDS, `dumps[${index}].`)
      )
    })
  }

  // Basic structure validation
  if (!obj || typeof obj !== 'object') {
    errors.push('Import data must be an object')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * @typedef {Object} ValidateTemplateResult
 * @property {boolean} valid - Whether the template data is valid
 * @property {string[]} errors - List of validation error messages
 */

/**
 * Validate template data structure
 * @param {object} template - Template data to validate
 * @returns {ValidateTemplateResult}
 */
export function validateTemplateData(template) {
  const errors = []

  // Check if template is an object
  if (!template || typeof template !== 'object') {
    errors.push('Template must be an object')
    return { valid: false, errors }
  }

  // Normalize type once for use throughout validation
  const normalizedType =
    template.type && typeof template.type === 'string'
      ? template.type.trim().toLowerCase()
      : ''

  // Validate required field: type
  if (template.type === undefined || template.type === null) {
    errors.push('Template type is required')
  } else if (typeof template.type !== 'string') {
    errors.push('Template type must be a string')
  } else if (!VALID_TEMPLATE_TYPES.includes(normalizedType)) {
    errors.push(
      `Template type must be one of: ${VALID_TEMPLATE_TYPES.join(', ')} (found: ${template.type})`
    )
  }

  // Validate required field: title
  if (template.title === undefined || template.title === null) {
    errors.push('Template title is required')
  } else if (typeof template.title !== 'string') {
    errors.push(
      `Template title must be a string (found: ${typeof template.title})`
    )
  } else if (template.title.trim() === '') {
    errors.push('Template title cannot be empty')
  }

  // Type-specific validation - use normalized type
  if (normalizedType === 'routine') {
    // Validate steps for routine templates
    if (template.steps !== undefined && template.steps !== null) {
      if (!Array.isArray(template.steps)) {
        errors.push(
          `Routine template steps must be an array (found: ${typeof template.steps})`
        )
      } else {
        // Validate each step structure
        template.steps.forEach((step, index) => {
          if (!step || typeof step !== 'object') {
            errors.push(`Template step ${index} must be an object`)
          } else {
            if (typeof step.label !== 'string') {
              errors.push(
                `Template step ${index} must have a label (string) property`
              )
            }
            if (
              step.duration !== undefined &&
              typeof step.duration !== 'number'
            ) {
              errors.push(
                `Template step ${index} duration must be a number (found: ${typeof step.duration})`
              )
            }
          }
        })
      }
    }

    // Validate estimatedDuration if present
    if (
      template.estimatedDuration !== undefined &&
      template.estimatedDuration !== null
    ) {
      if (typeof template.estimatedDuration !== 'number') {
        errors.push(
          `Routine estimatedDuration must be a number (found: ${typeof template.estimatedDuration})`
        )
      } else if (template.estimatedDuration < 0) {
        errors.push('Template estimatedDuration must be non-negative')
      }
    }
  }

  // Validate tags if present
  if (template.tags !== undefined && template.tags !== null) {
    if (!Array.isArray(template.tags)) {
      errors.push(
        `Template tags must be an array (found: ${typeof template.tags})`
      )
    } else {
      template.tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(
            `Template tag ${index} must be a string (found: ${typeof tag})`
          )
        }
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
