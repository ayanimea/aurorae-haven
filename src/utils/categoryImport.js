import { getItemCategories } from './itemCategories'

const IMPORTED_DEFAULT_CATEGORY = 'Unassigned'

function assignItemCategory(item, primaryField) {
  if (!item || typeof item !== 'object') return { item, changed: false }
  let changed = false
  let normalized = item
  if (!getItemCategories(item, primaryField).length) {
    normalized = {
      ...item,
      workspaceCategories: [IMPORTED_DEFAULT_CATEGORY],
      [primaryField]: IMPORTED_DEFAULT_CATEGORY
    }
    changed = true
  }
  if (Array.isArray(normalized.subtasks)) {
    const subtasks = normalized.subtasks.map((subtask) => {
      const result = assignItemCategory(subtask, primaryField)
      changed ||= result.changed
      return result.item
    })
    if (changed) normalized = { ...normalized, subtasks }
  }
  return { item: normalized, changed }
}

function assignMissingCategories(items, primaryField) {
  if (!Array.isArray(items)) return { items, changed: false }
  let changed = false
  const normalized = items.map((item) => {
    const result = assignItemCategory(item, primaryField)
    changed ||= result.changed
    return result.item
  })
  return { items: normalized, changed }
}

function collectCategories(value, categories) {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectCategories(item, categories)
    })
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [key, item] of Object.entries(value)) {
    if (key === 'workspaceCategories' && Array.isArray(item)) {
      item.forEach((category) => {
        if (typeof category === 'string' && category.trim()) {
          categories.add(category.trim())
        }
      })
    } else if (
      (key === 'workspaceCategory' || key === 'category') &&
      typeof item === 'string' &&
      item.trim()
    ) {
      categories.add(item.trim())
    }
    if (item && typeof item === 'object') collectCategories(item, categories)
  }
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

  const categories = new Set(
    Array.isArray(result.categories)
      ? result.categories.filter((category) => typeof category === 'string')
      : []
  )
  collectCategories(result, categories)
  if (changed) categories.add(IMPORTED_DEFAULT_CATEGORY)
  const normalizedCategories = [...categories]
  if (
    JSON.stringify(normalizedCategories) !== JSON.stringify(result.categories)
  ) {
    result.categories = normalizedCategories
    changed = true
  }

  return changed ? result : data
}
