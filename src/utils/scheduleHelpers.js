/**
 * Schedule Helpers - Utilities for searching and selecting routines/tasks for scheduling
 *
 * This module provides functions to:
 * - Fetch and filter tasks from localStorage (Eisenhower matrix format)
 * - Search through routines stored in IndexedDB
 * - Search through routine templates/libraries when no routines found
 * - Sort and prioritize items with Important tasks at the top
 *
 * @module scheduleHelpers
 */
import { v4 as generateSecureUUID } from 'uuid'
import { getRoutines, createRoutine } from './routinesManager'
import { getAllTemplates } from './templatesManager'
import { getPredefinedTemplates } from './predefinedTemplates'
import { createLogger } from './logger'

const logger = createLogger('ScheduleHelpers')

/**
 * Add a new task directly to localStorage storage (not_urgent_not_important quadrant).
 * Used when a user creates a brand-new task from the Schedule view so it also
 * appears in the Tasks tab without requiring a separate entry.
 *
 * @param {string} title - Task title/text
 * @returns {Object} The created task object
 * @throws {Error} If localStorage write fails
 */
export function addTaskToStorage(title) {
  const task = {
    id: generateSecureUUID(),
    text: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: null,
    completedAt: null
  }
  try {
    const savedStr = localStorage.getItem('aurorae_tasks')
    const tasks = savedStr
      ? JSON.parse(savedStr)
      : {
          urgent_important: [],
          not_urgent_important: [],
          urgent_not_important: [],
          not_urgent_not_important: []
        }
    if (!tasks.not_urgent_not_important) {
      tasks.not_urgent_not_important = []
    }
    tasks.not_urgent_not_important.push(task)
    localStorage.setItem('aurorae_tasks', JSON.stringify(tasks))
    return task
  } catch (e) {
    logger.error('Failed to add task to storage:', e)
    throw e
  }
}

/**
 * Sort items by importance, priority, type, and title
 * Sorting order:
 * 1. Important tasks first (urgent_important, not_urgent_important)
 * 2. Among important tasks, sort by priority number (lower = higher priority)
 * 3. Tasks before routines
 * 4. Alphabetically by title
 *
 * @param {Array<Object>} items - Array of items to sort
 * @param {boolean} items[].isImportant - Whether the item is important
 * @param {number} items[].priority - Priority number (1-4, lower is higher priority)
 * @param {string} items[].type - Type of item ('task' or 'routine')
 * @param {string} items[].title - Title of the item
 * @returns {Array<Object>} Sorted array (original array is mutated)
 */
function sortItemsByPriority(items) {
  return items.sort((a, b) => {
    // 1. Important tasks first
    if (a.isImportant !== b.isImportant) {
      return a.isImportant ? -1 : 1
    }

    // 2. Among important tasks, sort by priority
    if (a.isImportant && b.isImportant && a.priority !== b.priority) {
      return a.priority - b.priority
    }

    // 3. Then by type (tasks before routines for consistency)
    if (a.type !== b.type) {
      return a.type === 'task' ? -1 : 1
    }

    // 4. Finally alphabetically by title
    return a.title.localeCompare(b.title)
  })
}

/**
 * Get all available tasks from localStorage (Eisenhower matrix format)
 * Tasks are stored in four quadrants based on urgency and importance.
 *
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.includeCompleted=false] - Whether to include completed tasks
 * @returns {Array<Object>} Array of tasks with quadrant information and metadata
 * @returns {string} return[].id - Task ID
 * @returns {string} return[].text - Task text/description
 * @returns {string} return[].quadrant - Quadrant key (e.g., 'urgent_important')
 * @returns {string} return[].quadrantLabel - Human-readable quadrant label
 * @returns {number} return[].priority - Priority number (1-4, lower = higher)
 * @returns {boolean} return[].isImportant - Whether task is in an important quadrant
 * @returns {string} return[].type - Always 'task'
 * @returns {boolean} [return[].completed] - Whether task is completed (if includeCompleted=true)
 *
 * @example
 * // Get only incomplete tasks
 * const tasks = getAllTasks()
 *
 * @example
 * // Get all tasks including completed ones
 * const allTasks = getAllTasks({ includeCompleted: true })
 */
export function getAllTasks(options = {}) {
  const { includeCompleted = false } = options

  try {
    const tasksStr = localStorage.getItem('aurorae_tasks')
    if (!tasksStr) return []

    const tasksData = JSON.parse(tasksStr)
    const allTasks = []

    // Define quadrant priorities and labels
    const quadrants = [
      {
        key: 'urgent_important',
        label: 'Urgent & Important',
        priority: 1,
        isImportant: true
      },
      {
        key: 'not_urgent_important',
        label: 'Not Urgent & Important',
        priority: 2,
        isImportant: true
      },
      {
        key: 'urgent_not_important',
        label: 'Urgent & Not Important',
        priority: 3,
        isImportant: false
      },
      {
        key: 'not_urgent_not_important',
        label: 'Not Urgent & Not Important',
        priority: 4,
        isImportant: false
      }
    ]

    // Flatten tasks from all quadrants with metadata
    for (const quadrant of quadrants) {
      const tasks = tasksData[quadrant.key] || []
      tasks.forEach((task) => {
        if (includeCompleted || !task.completed) {
          allTasks.push({
            ...task,
            quadrant: quadrant.key,
            quadrantLabel: quadrant.label,
            priority: quadrant.priority,
            isImportant: quadrant.isImportant,
            type: 'task'
          })
        }
      })
    }

    return allTasks
  } catch (e) {
    logger.error('Failed to load tasks:', e)
    return []
  }
}

/**
 * Search routine templates (both custom and predefined)
 * @param {string} query - Search query (case-insensitive)
 * @returns {Promise<Array<Object>>} Array of matching template routines
 */
async function searchRoutineTemplates(query) {
  const results = []
  const normalizedQuery = query.toLowerCase().trim()

  try {
    // Search custom templates
    const customTemplates = await getAllTemplates()
    const routineTemplates = customTemplates.filter((t) => t.type === 'routine')

    routineTemplates.forEach((template) => {
      const title = (template.title || '').toLowerCase()
      if (title.includes(normalizedQuery)) {
        results.push({
          id: template.id,
          title: template.title,
          type: 'routine',
          sourceType: 'template',
          isTemplate: true,
          duration: template.estimatedDuration || 0,
          tags: template.tags || [],
          steps: template.steps || [],
          isImportant: false,
          priority: 0
        })
      }
    })

    // Search predefined templates
    const predefinedTemplates = getPredefinedTemplates()
    const predefinedRoutines = predefinedTemplates.filter(
      (t) => t.type === 'routine'
    )

    predefinedRoutines.forEach((template) => {
      const title = (template.title || '').toLowerCase()
      if (title.includes(normalizedQuery)) {
        results.push({
          id: template.id,
          title: template.title,
          type: 'routine',
          sourceType: 'predefined-template',
          isTemplate: true,
          isPredefined: true,
          duration: template.estimatedDuration || 0,
          tags: template.tags || [],
          steps: template.steps || [],
          isImportant: false,
          priority: 0
        })
      }
    })
  } catch (e) {
    logger.error('Failed to search routine templates:', e)
  }

  return results
}

/**
 * Create a routine from a template and add it to the routines tab
 * @param {Object} template - Template data
 * @returns {Promise<Object>} Created routine
 * @throws {Error} If routine creation fails due to invalid template data or underlying storage errors.
 * Callers should handle failures with try/catch when instantiating templates.
 */
export async function instantiateRoutineFromTemplate(template) {
  try {
    // Validate required template fields
    if (!template || typeof template !== 'object') {
      throw new Error('Invalid template: template must be an object')
    }

    if (
      !template.title ||
      typeof template.title !== 'string' ||
      template.title.trim() === ''
    ) {
      throw new Error(
        'Invalid template: title is required and must be a non-empty string'
      )
    }

    // Create the routine from the template
    const routineData = {
      title: template.title.trim(),
      steps: Array.isArray(template.steps) ? template.steps : [],
      tags: Array.isArray(template.tags) ? template.tags : [],
      energyTag: template.energyTag,
      estimatedDuration: template.duration || template.estimatedDuration || 0
    }

    const routineId = await createRoutine(routineData)
    logger.log(`Created routine from template: ${template.title}`)

    // Return the created routine with its new ID
    return {
      ...routineData,
      id: routineId
    }
  } catch (e) {
    logger.error('Failed to instantiate routine from template:', e)
    throw e
  }
}

/**
 * Search routines and tasks by query string
 * Performs case-insensitive substring matching on routine titles and task text.
 * Important tasks (urgent_important and not_urgent_important) are automatically prioritized.
 * If no routines found, also searches in routine templates/libraries.
 *
 * @param {string} query - Search query (case-insensitive)
 * @param {('routine'|'task'|null)} [eventType=null] - Filter by event type, or null for all
 * @returns {Promise<Array<Object>>} Array of matching items sorted by relevance and importance
 * @returns {string} return[].id - Item ID
 * @returns {string} return[].title - Item title/text
 * @returns {string} return[].type - Type ('routine' or 'task')
 * @returns {string} return[].sourceType - Original source type
 * @returns {boolean} return[].isImportant - Whether item is important (always false for routines)
 * @returns {number} return[].priority - Priority number (0 for routines, 1-4 for tasks)
 * @returns {number} [return[].duration] - Duration in minutes (routines only)
 * @returns {Array<string>} [return[].tags] - Tags array (routines only)
 * @returns {string} [return[].quadrant] - Quadrant key (tasks only)
 * @returns {string} [return[].quadrantLabel] - Quadrant label (tasks only)
 * @returns {boolean} [return[].isTemplate] - Whether item is from template library
 *
 * @example
 * // Search for tasks containing "email"
 * const results = await searchRoutinesAndTasks('email', 'task')
 *
 * @example
 * // Search all items containing "meeting"
 * const results = await searchRoutinesAndTasks('meeting')
 */
export async function searchRoutinesAndTasks(query, eventType = null) {
  const results = []

  // Fetch routines if needed
  if (!eventType || eventType === 'routine') {
    try {
      const routines = await getRoutines()
      const normalizedQuery = query.toLowerCase().trim()

      routines.forEach((routine) => {
        const title = (routine.title || routine.name || '').toLowerCase()
        if (title.includes(normalizedQuery)) {
          results.push({
            id: routine.id,
            title: routine.title || routine.name,
            type: 'routine',
            sourceType: 'routine',
            duration: routine.totalDuration || routine.estimatedDuration || 0,
            tags: routine.tags || [],
            isImportant: false,
            priority: 0
          })
        }
      })

      // If no routines found, search in templates
      if (results.length === 0) {
        const templateResults = await searchRoutineTemplates(query)
        results.push(...templateResults)
      }
    } catch (e) {
      logger.error('Failed to search routines:', e)
    }
  }

  // Fetch tasks if needed
  if (!eventType || eventType === 'task') {
    const tasks = getAllTasks()
    const normalizedQuery = query.toLowerCase().trim()

    tasks.forEach((task) => {
      const text = (task.text || '').toLowerCase()
      if (text.includes(normalizedQuery)) {
        results.push({
          id: task.id,
          title: task.text,
          type: 'task',
          sourceType: 'task',
          quadrant: task.quadrant,
          quadrantLabel: task.quadrantLabel,
          isImportant: task.isImportant,
          priority: task.priority
        })
      }
    })
  }

  // Sort results using shared sorting function
  return sortItemsByPriority(results)
}

/**
 * Get all routines and tasks for display in dropdown
 * Fetches all items from both routines (IndexedDB) and tasks (localStorage).
 * Important tasks are automatically prioritized at the top of results.
 * Useful for showing a complete list of schedulable items.
 * If no routines found, includes routine templates from library.
 *
 * @param {('routine'|'task'|null)} [eventType=null] - Filter by event type, or null for all
 * @returns {Promise<Array<Object>>} Array of all items sorted by priority and importance
 * @returns {string} return[].id - Item ID
 * @returns {string} return[].title - Item title/text
 * @returns {string} return[].type - Type ('routine' or 'task')
 * @returns {string} return[].sourceType - Original source type
 * @returns {boolean} return[].isImportant - Whether item is important (always false for routines)
 * @returns {number} return[].priority - Priority number (0 for routines, 1-4 for tasks)
 * @returns {number} [return[].duration] - Duration in minutes (routines only)
 * @returns {Array<string>} [return[].tags] - Tags array (routines only)
 * @returns {string} [return[].quadrant] - Quadrant key (tasks only)
 * @returns {string} [return[].quadrantLabel] - Quadrant label (tasks only)
 * @returns {boolean} [return[].isTemplate] - Whether item is from template library
 *
 * @example
 * // Get all tasks
 * const tasks = await getAllRoutinesAndTasks('task')
 *
 * @example
 * // Get all routines and tasks
 * const allItems = await getAllRoutinesAndTasks()
 */
export async function getAllRoutinesAndTasks(eventType = null) {
  const items = []

  // Fetch routines if needed
  if (!eventType || eventType === 'routine') {
    try {
      const routines = await getRoutines({ sortBy: 'title', order: 'asc' })
      routines.forEach((routine) => {
        items.push({
          id: routine.id,
          title: routine.title || routine.name,
          type: 'routine',
          sourceType: 'routine',
          duration: routine.totalDuration || routine.estimatedDuration || 0,
          tags: routine.tags || [],
          isImportant: false,
          priority: 0
        })
      })

      // If no routines found, include templates
      if (items.length === 0) {
        // Get custom templates
        const customTemplates = await getAllTemplates()
        const routineTemplates = customTemplates.filter(
          (t) => t.type === 'routine'
        )

        routineTemplates.forEach((template) => {
          items.push({
            id: template.id,
            title: template.title,
            type: 'routine',
            sourceType: 'template',
            isTemplate: true,
            duration: template.estimatedDuration || 0,
            tags: template.tags || [],
            steps: template.steps || [],
            isImportant: false,
            priority: 0
          })
        })

        // Get predefined templates
        const predefinedTemplates = getPredefinedTemplates()
        const predefinedRoutines = predefinedTemplates.filter(
          (t) => t.type === 'routine'
        )

        predefinedRoutines.forEach((template) => {
          items.push({
            id: template.id,
            title: template.title,
            type: 'routine',
            sourceType: 'predefined-template',
            isTemplate: true,
            isPredefined: true,
            duration: template.estimatedDuration || 0,
            tags: template.tags || [],
            steps: template.steps || [],
            isImportant: false,
            priority: 0
          })
        })
      }
    } catch (e) {
      logger.error('Failed to load routines:', e)
    }
  }

  // Fetch tasks if needed
  if (!eventType || eventType === 'task') {
    const tasks = getAllTasks()
    tasks.forEach((task) => {
      items.push({
        id: task.id,
        title: task.text,
        type: 'task',
        sourceType: 'task',
        quadrant: task.quadrant,
        quadrantLabel: task.quadrantLabel,
        isImportant: task.isImportant,
        priority: task.priority
      })
    })
  }

  // Sort using shared sorting function
  return sortItemsByPriority(items)
}

/**
 * Cluster overlapping events into groups.
 *
 * Two events overlap when A.start < B.end && A.end > B.start.
 * Touching at boundaries (A.end === B.start) is NOT overlap.
 * Events are sorted by start time before clustering so that each cluster is a
 * contiguous group of mutually-intersecting intervals.
 *
 * @param {Array<{start: number, end: number}>} events - Events with numeric
 *   start/end values (e.g. minutes from midnight). The array is not mutated.
 * @returns {Array<Array<{start: number, end: number}>>} Array of clusters,
 *   each cluster being an array of events that overlap with at least one other
 *   event in the same cluster.
 *
 * @example
 * const clusters = clusterEvents([
 *   { start: 60, end: 120 },   // 01:00–02:00
 *   { start: 90, end: 150 },   // 01:30–02:30  ← overlaps first
 *   { start: 180, end: 240 },  // 03:00–04:00  ← separate cluster
 * ])
 * // → [[event0, event1], [event2]]
 */
export function clusterEvents(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start)
  const clusters = []
  let cluster = []

  for (const event of sorted) {
    if (cluster.length === 0) {
      cluster.push(event)
      continue
    }

    const maxEnd = Math.max(...cluster.map((e) => e.end))

    if (event.start < maxEnd) {
      cluster.push(event)
    } else {
      clusters.push(cluster)
      cluster = [event]
    }
  }

  if (cluster.length > 0) clusters.push(cluster)
  return clusters
}

/**
 * Assign column indices to events within a cluster for side-by-side rendering.
 *
 * Each event receives two new properties (mutated in place):
 *   - `column`       {number} zero-based column index
 *   - `totalColumns` {number} total number of columns in this cluster
 *
 * The algorithm is greedy and deterministic: events are processed in start-time
 * order (assumed sorted) and placed in the first column whose last occupant has
 * ended (last.end <= event.start, so touching boundaries do not conflict).
 *
 * @param {Array<{start: number, end: number}>} cluster - A single cluster of
 *   potentially overlapping events (sorted by start time). Events are mutated
 *   in place to add `column` and `totalColumns`.
 * @returns {void}
 *
 * @example
 * const cluster = [
 *   { start: 60, end: 120 },
 *   { start: 90, end: 150 },
 * ]
 * assignColumns(cluster)
 * // cluster[0] → { ..., column: 0, totalColumns: 2 }
 * // cluster[1] → { ..., column: 1, totalColumns: 2 }
 */
export function assignColumns(cluster) {
  const columns = []

  cluster.forEach((event) => {
    let placed = false

    for (let i = 0; i < columns.length; i++) {
      const last = columns[i][columns[i].length - 1]
      if (last.end <= event.start) {
        columns[i].push(event)
        event.column = i
        placed = true
        break
      }
    }

    if (!placed) {
      columns.push([event])
      event.column = columns.length - 1
    }
  })

  const totalColumns = columns.length
  cluster.forEach((event) => {
    event.totalColumns = totalColumns
  })
}
