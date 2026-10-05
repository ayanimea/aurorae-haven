export function getItemCategories(item, legacyField = 'category') {
  if (!item || typeof item !== 'object') return []

  const values = Array.isArray(item.workspaceCategories)
    ? item.workspaceCategories
    : Array.isArray(item.categories)
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
  const categories = getItemCategories({
    workspaceCategories: Array.isArray(values) ? values : [values]
  })
  const defaultKey = defaultCategory.trim().toLowerCase()
  if (categories.some((category) => category.toLowerCase() === defaultKey)) {
    return [defaultCategory]
  }
  return categories.length ? categories : [defaultCategory]
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
  const defaultKey = defaultCategory.toLowerCase()
  const isUncategorised =
    categories.length === 0 ||
    categories.some((category) => category.toLowerCase() === defaultKey)

  if (activeKey === defaultKey) return isUncategorised
  return (
    isUncategorised ||
    categories.some((category) => category.toLowerCase() === activeKey)
  )
}
