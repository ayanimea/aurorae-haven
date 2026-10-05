export const IMPORTED_UNASSIGNED_CATEGORY = 'Unassigned'
const DEFAULT_CATEGORY = 'Uncategorised'

export function isUnassignedCategory(category, defaultCategory) {
  if (typeof category !== 'string') return false
  const key = category.trim().toLowerCase()
  const defaultKey = (defaultCategory || DEFAULT_CATEGORY).trim().toLowerCase()
  return (
    key === defaultKey ||
    key === IMPORTED_UNASSIGNED_CATEGORY.toLowerCase()
  )
}

export function getItemCategories(item, legacyField = 'category') {
  if (!item || typeof item !== 'object') return []

  const values = Array.isArray(item.workspaceCategories) &&
    item.workspaceCategories.length
    ? item.workspaceCategories
    : Array.isArray(item.categories) && item.categories.length
      ? item.categories
      : [item[legacyField]]

  const seen = new Set()
  return values.reduce((categories, value) => {
    if (typeof value !== 'string' || !value.trim()) return categories
    const category = value.trim()
    const key = category.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      categories.push(category)
    }
    return categories
  }, [])
}

export function normalizeCategorySelection(values, defaultCategory) {
  const fallbackCategory = defaultCategory || DEFAULT_CATEGORY
  const categories = getItemCategories({
    workspaceCategories: Array.isArray(values) ? values : [values]
  })
  if (categories.some((category) => isUnassignedCategory(category, defaultCategory))) {
    return [fallbackCategory]
  }
  return categories.length ? categories : [fallbackCategory]
}

export function assignItemCategories(
  item,
  values,
  defaultCategory,
  primaryField = 'category'
) {
  const workspaceCategories = normalizeCategorySelection(
    values,
    defaultCategory
  )
  return {
    ...item,
    workspaceCategories,
    [primaryField]: workspaceCategories[0]
  }
}

export function matchesItemCategories(
  item,
  activeCategory,
  defaultCategory,
  legacyField = 'category'
) {
  if (!activeCategory) return true

  const categories = getItemCategories(item, legacyField)
  const activeKey = activeCategory.toLowerCase()
  const isUncategorised =
    categories.length === 0 ||
    categories.some((category) => isUnassignedCategory(category, defaultCategory))

  if (isUnassignedCategory(activeCategory, defaultCategory)) return isUncategorised
  return (
    isUncategorised ||
    categories.some((category) => category.toLowerCase() === activeKey)
  )
}
