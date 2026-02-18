/**
 * Template Instantiation Utility
 * Implements TAB-LIB-13: Spawn new Tasks or Routines from templates
 */

import { v4 as generateSecureUUID } from 'uuid'
import { createRoutine, createRoutineBatch } from './routinesManager'
import { validateTemplateData } from './validation'
import { MS_PER_DAY } from './timeConstants'
import { createLogger } from './logger'
import { tryCatch, isQuotaExceededError } from './errorHandler'

const logger = createLogger('TemplateInstantiation')

// Default Eisenhower tasks structure
// Factory function for default Eisenhower tasks structure to prevent mutation
const createDefaultEisenhowerTasks = () => ({
  urgent_important: [],
  not_urgent_important: [],
  urgent_not_important: [],
  not_urgent_not_important: []
})

/**
 * Create a task object from template data
 * @param {Object} template - Task template object
 * @param {string} quadrant - Optional quadrant (uses template.quadrant if not provided)
 * @returns {Object} Task object
 * @private
 */
function createTaskFromTemplate(template, quadrant = null) {
  const taskQuadrant = quadrant || template.quadrant || 'urgent_important'
  const dueDate = template.dueOffset
    ? new Date(Date.now() + template.dueOffset * MS_PER_DAY).toISOString()
    : null

  return {
    id: generateSecureUUID(),
    text: template.title,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate,
    completedAt: null,
    quadrant: taskQuadrant
  }
}

/**
 * Instantiate a task from a task template
 * Creates a new independent task in localStorage (aurorae_tasks) from template data
 * @param {Object} template - Task template object
 * @returns {Object} Created task object with id and quadrant
 */
export function instantiateTaskFromTemplate(template) {
  if (!template) {
    throw new Error('Invalid task template')
  }

  // Normalize template type for comparison
  const normalizedType =
    typeof template.type === 'string'
      ? template.type.trim().toLowerCase()
      : ''

  if (normalizedType !== 'task') {
    throw new Error(
      `Invalid task template: expected type 'task', found '${template.type}'`
    )
  }

  // Validate template data
  const validation = validateTemplateData(template)
  if (!validation.valid) {
    throw new Error(`Invalid template data: ${validation.errors.join('; ')}`)
  }

  // Validate dueOffset if present
  if (template.dueOffset !== undefined && template.dueOffset !== null) {
    if (typeof template.dueOffset !== 'number') {
      throw new Error('Template dueOffset must be a number')
    }
    if (template.dueOffset <= 0) {
      throw new Error('Template dueOffset must be a positive number')
    }
  }

  // Determine target quadrant (default to urgent_important if not specified)
  const quadrant = template.quadrant || 'urgent_important'

  // Create new independent task
  const task = createTaskFromTemplate(template, quadrant)

  // Log task creation for debugging
  logger.log(
    `Creating task in localStorage: ${task.text} in quadrant ${quadrant}`
  )

  // Load existing tasks from localStorage
  const tasks =
    tryCatch(
      () => {
        const savedTasks = localStorage.getItem('aurorae_tasks')
        return savedTasks
          ? JSON.parse(savedTasks)
          : createDefaultEisenhowerTasks()
      },
      `Loading tasks for template "${template.title || '[unknown title]'}"`,
      {
        showToast: false
      }
    ) || createDefaultEisenhowerTasks()

  // Add task to appropriate quadrant
  if (!tasks[quadrant]) {
    tasks[quadrant] = []
  }
  tasks[quadrant].push(task)

  // Save back to localStorage
  try {
    localStorage.setItem('aurorae_tasks', JSON.stringify(tasks))
    logger.log(`Task saved successfully to localStorage in ${quadrant} quadrant`)
  } catch (err) {
    logger.error('Failed to save task:', err)
    // Check for quota exceeded error
    if (isQuotaExceededError(err)) {
      throw new Error(
        'Storage quota exceeded. Please free up space by deleting old tasks.'
      )
    }
    throw new Error('Failed to save task to storage')
  }

  return {
    task,
    quadrant
  }
}

/**
 * Instantiate a routine from a routine template
 * Creates a new independent routine in IndexedDB from template data
 * @param {Object} template - Routine template object
 * @returns {Promise<string>} Created routine ID
 */
export async function instantiateRoutineFromTemplate(template) {
  if (!template) {
    throw new Error('Invalid routine template')
  }

  // Normalize template type for comparison
  const normalizedType =
    typeof template.type === 'string'
      ? template.type.trim().toLowerCase()
      : ''

  if (normalizedType !== 'routine') {
    throw new Error(
      `Invalid routine template: expected type 'routine', found '${template.type}'`
    )
  }

  // Validate template data
  const validation = validateTemplateData(template)
  if (!validation.valid) {
    throw new Error(`Invalid template data: ${validation.errors.join('; ')}`)
  }

  // Additional validation for routine-specific fields
  if (template.steps && template.steps.length > 0) {
    // Validate each step has required fields
    for (let i = 0; i < template.steps.length; i++) {
      const step = template.steps[i]
      if (!step || typeof step !== 'object') {
        throw new Error(`Step ${i} must be an object`)
      }
      if (typeof step.label !== 'string' || step.label.trim() === '') {
        throw new Error(`Step ${i} must have a non-empty label`)
      }
      if (
        step.duration !== undefined &&
        (typeof step.duration !== 'number' || step.duration < 0)
      ) {
        throw new Error(`Step ${i} duration must be a non-negative number`)
      }
    }
  }

  // Validate tags are strings
  if (template.tags && template.tags.length > 0) {
    for (let i = 0; i < template.tags.length; i++) {
      if (typeof template.tags[i] !== 'string') {
        throw new Error(`Tag ${i} must be a string`)
      }
    }
  }

  // Validate estimatedDuration
  if (
    template.estimatedDuration !== undefined &&
    template.estimatedDuration !== null &&
    (typeof template.estimatedDuration !== 'number' ||
      template.estimatedDuration < 0)
  ) {
    throw new Error('estimatedDuration must be a non-negative number')
  }

  // Create new independent routine
  const routine = {
    name: template.title,
    steps: template.steps || [],
    tags: template.tags || [],
    energyTag: template.energyTag || null,
    estimatedDuration: template.estimatedDuration || null,
    createdAt: new Date().toISOString()
  }

  // Log routine creation for debugging
  logger.log(
    `Creating routine in IndexedDB: ${routine.name} with ${routine.steps.length} steps`
  )

  // Use existing createRoutine function from routinesManager
  const routineId = await createRoutine(routine)

  logger.log(`Routine created successfully with ID: ${routineId}`)

  return routineId
}

/**
 * Instantiate a template (task or routine)
 * Main entry point that routes to appropriate instantiation function
 * @param {Object} template - Template object (task or routine)
 * @returns {Promise<Object>} Created entity details
 */
export async function instantiateTemplate(template) {
  if (!template) {
    throw new Error('Template is required')
  }

  // Enhanced logging to diagnose template type issues
  logger.log(
    `Instantiating template: ${template.title || '[untitled]'} (type: ${template.type})`
  )

  // Defensive check: ensure template.type is valid before routing
  // Sub-functions will validate the specific type match (task vs routine)
  if (!template.type || typeof template.type !== 'string') {
    logger.error('Invalid template type:', template.type)
    throw new Error('Template must have a valid type field')
  }

  // Normalize template type (trim whitespace, lowercase)
  const normalizedType = template.type.trim().toLowerCase()

  if (normalizedType === 'task') {
    logger.log(`Creating task from template: ${template.title}`)
    const result = instantiateTaskFromTemplate(template)
    return {
      type: 'task',
      id: result.task.id,
      quadrant: result.quadrant,
      task: result.task
    }
  } else if (normalizedType === 'routine') {
    logger.log(`Creating routine from template: ${template.title}`)
    const routineId = await instantiateRoutineFromTemplate(template)
    return {
      type: 'routine',
      id: routineId
    }
  } else {
    logger.error(`Unknown template type: ${template.type}`)
    throw new Error(
      `Unknown template type: ${template.type}. Expected 'task' or 'routine'.`
    )
  }
}

/**
 * Instantiate multiple templates in a batch operation
 * More efficient than calling instantiateTemplate() multiple times
 * @param {Array<Object>} templates - Array of template objects
 * @returns {Promise<Array<Object>>} Array of created entity details
 */
export async function instantiateTemplatesBatch(templates) {
  if (!Array.isArray(templates)) {
    throw new Error('Templates must be an array')
  }

  if (templates.length === 0) {
    return []
  }

  // Separate task and routine templates
  const taskTemplates = []
  const routineTemplates = []

  for (const template of templates) {
    if (!template) {
      throw new Error('Template is required')
    }

    if (template.type === 'task') {
      taskTemplates.push(template)
    } else if (template.type === 'routine') {
      routineTemplates.push(template)
    } else {
      throw new Error(`Unknown template type: ${template.type}`)
    }
  }

  const results = []

  // Process task templates (synchronous, but batched in localStorage)
  if (taskTemplates.length > 0) {
    // Validate all task templates upfront before processing
    for (const template of taskTemplates) {
      const validation = validateTemplateData(template)
      if (!validation.valid) {
        throw new Error(
          `Invalid template data: ${validation.errors.join('; ')}`
        )
      }

      // Validate dueOffset if present
      if (template.dueOffset !== undefined && template.dueOffset !== null) {
        if (typeof template.dueOffset !== 'number') {
          throw new Error('Template dueOffset must be a number')
        }
        if (template.dueOffset <= 0) {
          throw new Error('Template dueOffset must be a positive number')
        }
      }
    }

    // Load existing tasks once
    const tasks =
      tryCatch(
        () => {
          const savedTasks = localStorage.getItem('aurorae_tasks')
          return savedTasks
            ? JSON.parse(savedTasks)
            : createDefaultEisenhowerTasks()
        },
        'Loading tasks for batch template instantiation',
        {
          showToast: false
        }
      ) || createDefaultEisenhowerTasks()

    // Create all tasks after validation passes
    for (const template of taskTemplates) {
      const quadrant = template.quadrant || 'urgent_important'
      const task = createTaskFromTemplate(template, quadrant)

      if (!tasks[quadrant]) {
        tasks[quadrant] = []
      }
      tasks[quadrant].push(task)

      results.push({
        type: 'task',
        id: task.id,
        quadrant,
        task
      })
    }

    // Save all tasks once
    try {
      localStorage.setItem('aurorae_tasks', JSON.stringify(tasks))
    } catch (err) {
      logger.error('Failed to save tasks:', err)
      if (isQuotaExceededError(err)) {
        throw new Error(
          'Storage quota exceeded. Please free up space by deleting old tasks.'
        )
      }
      throw new Error('Failed to save tasks to storage')
    }
  }

  // Process routine templates using batch operation
  if (routineTemplates.length > 0) {
    // Validate all routine templates first
    const routines = []
    for (const template of routineTemplates) {
      // Validate template data
      const validation = validateTemplateData(template)
      if (!validation.valid) {
        throw new Error(
          `Invalid template data: ${validation.errors.join('; ')}`
        )
      }

      // Additional validation for routine-specific fields
      if (template.steps && template.steps.length > 0) {
        for (let i = 0; i < template.steps.length; i++) {
          const step = template.steps[i]
          if (!step || typeof step !== 'object') {
            throw new Error(`Step ${i} must be an object`)
          }
          if (typeof step.label !== 'string' || step.label.trim() === '') {
            throw new Error(`Step ${i} must have a non-empty label`)
          }
          if (
            step.duration !== undefined &&
            (typeof step.duration !== 'number' || step.duration < 0)
          ) {
            throw new Error(`Step ${i} duration must be a non-negative number`)
          }
        }
      }

      if (template.tags && template.tags.length > 0) {
        for (let i = 0; i < template.tags.length; i++) {
          if (typeof template.tags[i] !== 'string') {
            throw new Error(`Tag ${i} must be a string`)
          }
        }
      }

      if (
        template.estimatedDuration !== undefined &&
        template.estimatedDuration !== null &&
        (typeof template.estimatedDuration !== 'number' ||
          template.estimatedDuration < 0)
      ) {
        throw new Error('estimatedDuration must be a non-negative number')
      }

      routines.push({
        name: template.title,
        steps: template.steps || [],
        tags: template.tags || [],
        energyTag: template.energyTag || null,
        estimatedDuration: template.estimatedDuration || null,
        createdAt: new Date().toISOString()
      })
    }

    // Create all routines in a single batch
    const routineIds = await createRoutineBatch(routines)

    // Add results
    routineIds.forEach((id) => {
      results.push({
        type: 'routine',
        id
      })
    })
  }

  return results
}
