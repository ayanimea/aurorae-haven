import { getItemCategories } from './itemCategories'

const IMPORTED_DEFAULT_CATEGORY = 'Unassigned'

function assignMissingCategories(items, primaryField) {
  if (!Array.isArray(items)) return { items, changed: false }
  let changed = false
  const normalized = items.map((item) => {
    if (!item || typeof item !== 'object') return item
    if (getItemCategories(item, primaryField).length) return item
    changed = true
    return {
      ...item,
      workspaceCategories: [IMPORTED_DEFAULT_CATEGORY],
      [primaryField]: IMPORTED_DEFAULT_CATEGORY
    }
  })
  return { items: normalized, changed }
}

export function normalizeImportedCategories(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  let changed = false
  const result = { ...data }
  const normalize = (items, field, primaryField) => {
    const normalized = assignMissingCategories(items, primaryField)
    if (normalized.changed) {
      result[field] = normalized.items
      changed = true
    }
  }

  normalize(data.tasks, 'tasks', 'category')
  normalize(data.dumps, 'dumps', 'category')
  normalize(data.habits, 'habits', 'workspaceCategory')
  normalize(data.routines, 'routines', 'workspaceCategory')
  normalize(data.schedule, 'schedule', 'category')
  normalize(data.stats, 'stats', 'workspaceCategory')
  normalize(data.savedTasks, 'savedTasks', 'category')

  if (data.brainDump && typeof data.brainDump === 'object') {
    const normalized = assignMissingCategories(data.brainDump.entries, 'category')
    if (normalized.changed) {
      result.brainDump = { ...data.brainDump, entries: normalized.items }
      if (!Array.isArray(data.dumps)) result.dumps = normalized.items
      changed = true
    }
  }

  if (data.auroraeTasksData && typeof data.auroraeTasksData === 'object') {
    let taskDataChanged = false
    const taskData = Object.fromEntries(
      Object.entries(data.auroraeTasksData).map(([quadrant, tasks]) => {
        const normalized = assignMissingCategories(tasks, 'category')
        taskDataChanged ||= normalized.changed
        return [quadrant, normalized.items]
      })
    )
    if (taskDataChanged) {
      result.auroraeTasksData = taskData
      changed = true
    }
  }

  if (changed) {
    const categories = Array.isArray(result.categories)
      ? result.categories
      : []
    if (!categories.some((category) => category === IMPORTED_DEFAULT_CATEGORY)) {
      result.categories = [...categories, IMPORTED_DEFAULT_CATEGORY]
    }
  }

  return result
}
