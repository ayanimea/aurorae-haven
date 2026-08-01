import { publishCrossTabEvent } from './crossTabSync'
import { createLogger } from './logger'

const logger = createLogger('TasksStorage')

export const TASK_STORAGE_KEY = 'aurorae_tasks'
export const TASK_STORAGE_QUADRANTS = [
  'urgent_important',
  'not_urgent_important',
  'urgent_not_important',
  'not_urgent_not_important'
]

export function createDefaultTasksState() {
  return {
    urgent_important: [],
    not_urgent_important: [],
    urgent_not_important: [],
    not_urgent_not_important: []
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeTasksState(value) {
  const normalized = createDefaultTasksState()

  if (!isPlainObject(value)) {
    return normalized
  }

  TASK_STORAGE_QUADRANTS.forEach((quadrant) => {
    normalized[quadrant] = Array.isArray(value[quadrant]) ? value[quadrant] : []
  })

  return normalized
}

export function loadTasksState() {
  try {
    const stored = localStorage.getItem(TASK_STORAGE_KEY)
    if (!stored) {
      return createDefaultTasksState()
    }

    return normalizeTasksState(JSON.parse(stored))
  } catch (error) {
    logger.warn('Failed to parse aurorae_tasks; using default structure.', error)
    return createDefaultTasksState()
  }
}

export function saveTasksState(tasks, metadata = {}) {
  const normalized = normalizeTasksState(tasks)
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(normalized))

  publishCrossTabEvent({
    domain: 'tasks',
    action: metadata.action || 'updated',
    payload: {
      changedQuadrants: metadata.changedQuadrants || [],
      source: metadata.source || 'tasksStorage'
    }
  })

  return normalized
}

export function mutateTasksState(mutator, metadata = {}) {
  if (typeof mutator !== 'function') {
    throw new Error('mutateTasksState requires a mutator function')
  }

  const current = loadTasksState()
  const candidate = mutator(current)
  const nextState = typeof candidate === 'undefined' ? current : candidate

  return saveTasksState(nextState, metadata)
}
