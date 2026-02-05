/**
 * Centralized ID Generation Utilities
 * Consolidates various ID generation patterns used throughout the codebase
 */

import { v4 as generateSecureUUID } from 'uuid'

/**
 * Generate a timestamp-based ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string|number} Timestamp ID (string if prefix provided, number otherwise)
 * @example
 * generateTimestampId() // 1697234567890
 * generateTimestampId('routine') // 'routine_1697234567890'
 */
export function generateTimestampId(prefix = '') {
  const timestamp = Date.now()
  return prefix ? `${prefix}_${timestamp}` : timestamp
}

/**
 * Generate a unique UUID-based ID with optional prefix
 * Uses cryptographically secure random generation
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} UUID-based ID
 * @example
 * generateUniqueId() // '550e8400-e29b-41d4-a716-446655440000'
 * generateUniqueId('template') // 'template_550e8400-e29b-41d4-a716-446655440000'
 */
export function generateUniqueId(prefix = '') {
  const uuid = generateSecureUUID()
  return prefix ? `${prefix}_${uuid}` : uuid
}

/**
 * Generate a routine ID
 * Uses timestamp for simplicity and natural ordering
 * Includes counter to prevent same-millisecond collisions
 * @returns {string} Routine ID in format 'routine_timestamp' or 'routine_timestamp_counter'
 */
export function generateRoutineId() {
  return generateTimestampIdWithCollisionPrevention('routine')
}

/**
 * Generate a step ID
 * Uses timestamp for simplicity and natural ordering
 * Includes counter to prevent same-millisecond collisions
 * @returns {string} Step ID in format 'step_timestamp' or 'step_timestamp_counter'
 */
export function generateStepId() {
  return generateTimestampIdWithCollisionPrevention('step')
}

/**
 * Generate a habit ID
 * Uses timestamp for simplicity and natural ordering
 * @returns {number} Numeric timestamp ID
 */
export function generateHabitId() {
  return Date.now()
}

/**
 * Generate a schedule event ID
 * Uses timestamp for simplicity and natural ordering
 * @returns {number} Numeric timestamp ID
 */
export function generateScheduleId() {
  return Date.now()
}

/**
 * Generate a template ID
 * Uses timestamp for simplicity and natural ordering
 * @returns {number} Numeric timestamp ID
 */
export function generateTemplateId() {
  return Date.now()
}

/**
 * Generate a note/dump ID
 * Uses timestamp for simplicity and natural ordering
 * @returns {number} Numeric timestamp ID
 */
export function generateNoteId() {
  return Date.now()
}

/**
 * Check if an ID needs regeneration (for collision handling)
 * @param {*} id - The ID to check
 * @returns {boolean} True if ID should be regenerated
 */
export function shouldRegenerateId(id) {
  return !id || id === '' || id === null || id === undefined
}

/**
 * Ensure an entity has a valid ID, generating one if needed
 * @param {Object} entity - Entity that may need an ID
 * @param {Function} idGenerator - Function to generate ID if needed
 * @returns {Object} Entity with guaranteed valid ID
 */
export function ensureId(entity, idGenerator = generateSecureUUID) {
  return {
    ...entity,
    id: shouldRegenerateId(entity.id) ? idGenerator() : entity.id
  }
}

/**
 * Generate standard metadata for new entities
 * Creates consistent timestamp and ISO date fields
 * @returns {Object} Metadata object with timestamp, createdAt, and updatedAt
 * @example
 * generateMetadata()
 * // Returns: { timestamp: 1697234567890, createdAt: '2023-10-13T12:34:56.789Z', updatedAt: '2023-10-13T12:34:56.789Z' }
 */
export function generateMetadata() {
  const now = Date.now()
  const isoNow = new Date(now).toISOString()
  return {
    timestamp: now,
    createdAt: isoNow,
    updatedAt: isoNow
  }
}

// Counters to ensure unique IDs even within the same millisecond
let idCounter = 0
let lastTimestamp = 0

// Separate counter for prefixed IDs (e.g., step_123, routine_123)
let prefixCounters = {}
let lastPrefixTimestamp = 0

/**
 * Generate a timestamp-based ID with collision prevention
 * Ensures uniqueness even for same-millisecond operations by using counters
 * @param {string} prefix - Optional prefix for the ID
 * @param {number} providedTimestamp - Optional timestamp to use (for consistency with metadata)
 * @returns {string|number} Unique timestamp ID (prefixed string or numeric)
 * @private
 */
function generateTimestampIdWithCollisionPrevention(prefix = '', providedTimestamp = null) {
  const timestamp = providedTimestamp !== null ? providedTimestamp : Date.now()

  if (prefix) {
    // Handle prefixed IDs with per-prefix counter
    if (timestamp === lastPrefixTimestamp) {
      if (!prefixCounters[prefix]) {
        prefixCounters[prefix] = 0
      }
      prefixCounters[prefix]++
      return `${prefix}_${timestamp}_${prefixCounters[prefix]}`
    } else {
      // Reset all prefix counters when timestamp changes to prevent memory accumulation
      prefixCounters = {}
      lastPrefixTimestamp = timestamp
      return `${prefix}_${timestamp}`
    }
  } else {
    // Handle numeric IDs with global counter
    if (timestamp === lastTimestamp) {
      idCounter++
      // When multiple IDs are generated in the same millisecond, use a string format
      // with zero-padded counter to ensure uniqueness without numeric collisions.
      // Format: "timestamp.001", "timestamp.002", "timestamp.003", etc.
      // This prevents collisions with the next millisecond's timestamp and maintains
      // clear distinction between base timestamp IDs and collision-prevented IDs.
      return `${timestamp}.${String(idCounter).padStart(3, '0')}`
    } else {
      idCounter = 0
      lastTimestamp = timestamp
      return timestamp
    }
  }
}

/**
 * Normalize entity with ID and metadata
 * Combines entity data with generated ID and metadata fields
 * @param {Object} entity - Entity to normalize
 * @param {Object} options - Normalization options
 * @param {string} options.idPrefix - Optional prefix for timestamp-based IDs
 * @returns {Object} Normalized entity with ID and metadata
 * @example
 * normalizeEntity({ name: 'Test' }, { idPrefix: 'routine' })
 * // Returns: { name: 'Test', id: 'routine_1697234567890', timestamp: 1697234567890, createdAt: '...', updatedAt: '...' }
 */
export function normalizeEntity(entity, options = {}) {
  const metadata = generateMetadata()

  // Generate unique ID - add counter to handle same-millisecond creates
  // Pass metadata.timestamp to ensure ID generation uses the same timestamp value
  // This prevents timing issues where Date.now() is called multiple times
  let id
  if (entity.id) {
    id = entity.id
  } else {
    id = generateTimestampIdWithCollisionPrevention(options.idPrefix, metadata.timestamp)
  }

  return {
    ...entity,
    id,
    ...metadata
  }
}

/**
 * Update entity metadata on modification
 * Updates only the updatedAt and timestamp fields while preserving createdAt
 * @param {Object} entity - Entity to update
 * @returns {Object} Entity with updated metadata
 * @example
 * updateMetadata({ id: 1, name: 'Test', createdAt: '2023-10-13T12:00:00.000Z' })
 * // Returns: { id: 1, name: 'Test', createdAt: '2023-10-13T12:00:00.000Z', updatedAt: '2023-10-13T12:34:56.789Z', timestamp: 1697234567890 }
 */
export function updateMetadata(entity) {
  const now = Date.now()
  return {
    ...entity,
    updatedAt: new Date(now).toISOString(),
    timestamp: now
  }
}

/**
 * Get current timestamp as ISO string
 * Utility for cases where only the current timestamp is needed
 * @returns {string} Current timestamp in ISO 8601 format
 * @example
 * getCurrentTimestamp()
 * // Returns: '2023-10-13T12:34:56.789Z'
 */
export function getCurrentTimestamp() {
  return new Date().toISOString()
}
