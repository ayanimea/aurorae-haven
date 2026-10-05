import {
  getDefaultCategory,
  loadCategories,
  normalizeCategory,
  saveCategories,
  setDefaultCategory
} from './categoryStorage'
import {
  getAll,
  isIndexedDBAvailable,
  put,
  STORES
} from './indexedDBManager'

const LOCAL_DATA_KEYS = [
  ['aurorae_tasks', true],
  ['aurorae_saved_tasks', true],
  ['brainDumpEntries', true],
  ['tasks', true],
  ['routines', false],
  ['habits', false],
  ['dumps', true],
  ['schedule', true],
  ['stats', false],
  ['templates', false]
]

const INDEXED_DB_STORES = [
  [STORES.TASKS, true],
  [STORES.ROUTINES, false],
  [STORES.HABITS, false],
  [STORES.DUMPS, true],
  [STORES.SCHEDULE, true],
  [STORES.STATS, false],
  [STORES.TEMPLATES, false]
]

function renameValues(value, oldKey, newCategory, includeLegacyCategory) {
  if (Array.isArray(value)) {
    let changed = false
    const result = value.map((item) => {
      const renamed = renameValues(
        item,
        oldKey,
        newCategory,
        includeLegacyCategory
      )
      changed ||= renamed.changed
      return renamed.value
    })
    return { value: changed ? result : value, changed }
  }
  if (!value || typeof value !== 'object') {
    return { value, changed: false }
  }

  let changed = false
  const result = { ...value }
  for (const [key, item] of Object.entries(value)) {
    if (
      (key === 'category' && includeLegacyCategory) ||
      key === 'workspaceCategory'
    ) {
      if (
        typeof item === 'string' &&
        item.trim().toLowerCase() === oldKey
      ) {
        result[key] = newCategory
        changed = true
      } else if (Array.isArray(item)) {
        const renamed = item.map((category) =>
          typeof category === 'string' &&
          category.trim().toLowerCase() === oldKey
            ? newCategory
            : category
        )
        if (renamed.some((category, index) => category !== item[index])) {
          result[key] = renamed
          changed = true
        }
      }
    } else if (
      (key === 'workspaceCategories' || key === 'categories') &&
      Array.isArray(item)
    ) {
      const renamed = item.map((category) =>
        typeof category === 'string' &&
        category.trim().toLowerCase() === oldKey
          ? newCategory
          : category
      )
      if (renamed.some((category, index) => category !== item[index])) {
        result[key] = renamed
        changed = true
      }
    } else if (item && typeof item === 'object') {
      const renamed = renameValues(
        item,
        oldKey,
        newCategory,
        includeLegacyCategory
      )
      if (renamed.changed) {
        result[key] = renamed.value
        changed = true
      }
    }
  }
  return { value: changed ? result : value, changed }
}

function renameLocalData(key, oldKey, newCategory, includeLegacyCategory) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const renamed = renameValues(
      JSON.parse(raw),
      oldKey,
      newCategory,
      includeLegacyCategory
    )
    if (renamed.changed) {
      localStorage.setItem(key, JSON.stringify(renamed.value))
    }
  } catch {
    // Ignore invalid legacy entries; valid records are still renamed elsewhere.
  }
}

export async function renameCategory(oldName, newName) {
  const oldCategory = normalizeCategory(oldName)
  const newCategory = normalizeCategory(newName)
  if (!oldCategory || !newCategory) {
    throw new Error('Category names cannot be empty')
  }

  const oldKey = oldCategory.toLowerCase()
  const categories = loadCategories()
  const existingCategory = categories.find(
    (category) => category.toLowerCase() === oldKey
  )
  if (!existingCategory) {
    throw new Error('Category no longer exists')
  }
  if (oldKey === newCategory.toLowerCase()) {
    return existingCategory
  }
  if (
    categories.some(
      (category) => category.toLowerCase() === newCategory.toLowerCase()
    )
  ) {
    throw new Error('A category with that name already exists')
  }

  if (isIndexedDBAvailable()) {
    for (const [store, includeLegacyCategory] of INDEXED_DB_STORES) {
      const items = await getAll(store)
      for (const item of items) {
        const renamed = renameValues(
          item,
          oldKey,
          newCategory,
          includeLegacyCategory
        )
        if (renamed.changed) await put(store, renamed.value)
      }
    }
  }

  LOCAL_DATA_KEYS.forEach(([key, includeLegacyCategory]) => {
    renameLocalData(key, oldKey, newCategory, includeLegacyCategory)
  })

  const updatedCategories = categories.map((category) =>
    category.toLowerCase() === oldKey ? newCategory : category
  )
  if (getDefaultCategory().toLowerCase() === oldKey) {
    setDefaultCategory(newCategory)
  }
  saveCategories(updatedCategories)

  try {
    if (
      localStorage.getItem('aurorae_workspace_category')?.toLowerCase() ===
      oldKey
    ) {
      localStorage.setItem('aurorae_workspace_category', newCategory)
    }
  } catch {
    // The active workspace remains unchanged in memory if storage is unavailable.
  }

  return newCategory
}
