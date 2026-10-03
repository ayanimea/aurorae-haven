export const CATEGORY_STORAGE_KEY = 'aurorae_categories'
export const MAX_CATEGORY_COUNT = 6

export function normalizeCategory(category) {
  return typeof category === 'string' ? category.trim() : ''
}

function uniqueCategories(categories) {
  const byName = new Map()
  categories.forEach((category) => {
    const value = normalizeCategory(category)
    if (value && !byName.has(value.toLowerCase())) {
      byName.set(value.toLowerCase(), value)
    }
  })
  return [...byName.values()].sort((a, b) => a.localeCompare(b))
}

export function loadCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]')
    const categories = Array.isArray(stored) ? stored : []

    try {
      const notes = JSON.parse(localStorage.getItem('brainDumpEntries') || '[]')
      if (Array.isArray(notes)) {
        categories.push(
          ...notes.map((note) =>
            note && typeof note === 'object' ? note.category : ''
          )
        )
      }
    } catch {
      // Ignore malformed note data; the note store handles its own recovery.
    }

    try {
      const tasks = JSON.parse(localStorage.getItem('aurorae_tasks') || '{}')
      if (tasks && typeof tasks === 'object' && !Array.isArray(tasks)) {
        Object.values(tasks).forEach((quadrant) => {
          if (Array.isArray(quadrant)) {
            categories.push(...quadrant.map((task) => task?.category))
          }
        })
      }
    } catch {
      // Ignore malformed task data; the task store handles its own recovery.
    }

    return uniqueCategories(categories)
  } catch {
    return []
  }
}

export function saveCategories(categories) {
  const normalized = uniqueCategories(categories)
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // Category choices remain usable in memory when browser storage is unavailable.
  }
  return normalized
}
