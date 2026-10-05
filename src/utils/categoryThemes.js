export const CATEGORY_THEME_STORAGE_KEY = 'aurorae_category_themes'

export const CATEGORY_THEME_TEMPLATES = Object.freeze([
  { id: 'default', name: 'Default color scheme' },
  { id: 'red-nebula', name: 'Red Nebula' },
  { id: 'green-aurora', name: 'Green Aurora' },
  { id: 'yellow-quasar', name: 'Yellow Quasar' },
  { id: 'planetary-nebula', name: 'Black Planetary Nebula' },
  { id: 'white-purple-galaxy', name: 'White/Purple Galaxy' },
  { id: 'galaxy-clusters', name: 'Black/White Clusters of Galaxies' }
])

const validThemeIds = new Set(CATEGORY_THEME_TEMPLATES.map(({ id }) => id))

export function normalizeCategoryThemes(assignments) {
  if (
    !assignments ||
    typeof assignments !== 'object' ||
    Array.isArray(assignments)
  ) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(assignments).flatMap(([category, themeId]) => {
      const name = category.trim()
      return name && validThemeIds.has(themeId) && themeId !== 'default'
        ? [[name, themeId]]
        : []
    })
  )
}

export function loadCategoryThemes() {
  try {
    return normalizeCategoryThemes(
      JSON.parse(localStorage.getItem(CATEGORY_THEME_STORAGE_KEY) || '{}')
    )
  } catch {
    return {}
  }
}

export function saveCategoryThemes(assignments) {
  const normalized = normalizeCategoryThemes(assignments)
  try {
    localStorage.setItem(CATEGORY_THEME_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // Keep the in-memory assignment usable when storage is unavailable.
  }
  return normalized
}

export function renameCategoryTheme(assignments, oldCategory, newCategory) {
  const normalized = normalizeCategoryThemes(assignments)
  const match = Object.keys(normalized).find(
    (category) => category.toLowerCase() === oldCategory.toLowerCase()
  )
  if (!match) return normalized
  normalized[newCategory] = normalized[match]
  delete normalized[match]
  return normalized
}
