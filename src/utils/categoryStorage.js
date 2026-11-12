import { isUnassignedCategory } from './itemCategories'

export const CATEGORY_STORAGE_KEY = 'aurorae_categories'
export const DEFAULT_CATEGORY_STORAGE_KEY = 'aurorae_default_category'
export const INITIAL_DEFAULT_CATEGORY = 'Uncategorised'
export const MAX_CATEGORY_COUNT = 6
const CATEGORY_DATA_STORAGE_KEYS = [
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

export function normalizeCategory(category) {
  return typeof category === 'string' ? category.trim() : ''
}

export function getDefaultCategory() {
  try {
    return (
      normalizeCategory(localStorage.getItem(DEFAULT_CATEGORY_STORAGE_KEY)) ||
      INITIAL_DEFAULT_CATEGORY
    )
  } catch {
    return INITIAL_DEFAULT_CATEGORY
  }
}

export function setDefaultCategory(category) {
  const value = normalizeCategory(category) || INITIAL_DEFAULT_CATEGORY
  try {
    localStorage.setItem(DEFAULT_CATEGORY_STORAGE_KEY, value)
  } catch {
    // The in-memory default remains usable when browser storage is unavailable.
  }
  return value
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

function collectItemCategories(value, categories, includeLegacyCategory) {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectItemCategories(item, categories, includeLegacyCategory)
    })
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [key, item] of Object.entries(value)) {
    if (
      (key === 'category' && includeLegacyCategory) ||
      key === 'workspaceCategory' ||
      key === 'workspaceCategories'
    ) {
      if (Array.isArray(item)) categories.push(...item)
      else categories.push(item)
    } else if (item && typeof item === 'object') {
      collectItemCategories(item, categories, includeLegacyCategory)
    }
  }
}

export function loadCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]')
    const categories = Array.isArray(stored) ? [...stored] : []

    CATEGORY_DATA_STORAGE_KEYS.forEach(([key, includeLegacyCategory]) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || 'null')
        collectItemCategories(data, categories, includeLegacyCategory)
      } catch {
        // Ignore malformed item data; its own storage layer handles recovery.
      }
    })

    const defaultCategory = getDefaultCategory()
    return [
      defaultCategory,
      ...uniqueCategories(categories).filter(
        (category) =>
          !isUnassignedCategory(category, defaultCategory)
      )
    ]
  } catch {
    const defaultCategory = getDefaultCategory()
    return [defaultCategory]
  }
}

export function saveCategories(categories) {
  const defaultCategory = getDefaultCategory()
  const normalized = [
    defaultCategory,
    ...uniqueCategories(categories).filter(
      (category) =>
        !isUnassignedCategory(category, defaultCategory)
    )
  ]
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // Category choices remain usable in memory when browser storage is unavailable.
  }
  return normalized
}
