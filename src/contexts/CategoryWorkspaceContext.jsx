import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useCategories } from '../hooks/useCategories'
import { matchesItemCategories } from '../utils/itemCategories'
import { INITIAL_DEFAULT_CATEGORY } from '../utils/categoryStorage'
import {
  CATEGORY_THEME_STORAGE_KEY,
  loadCategoryThemes,
  saveCategoryThemes
} from '../utils/categoryThemes'

const WORKSPACE_STORAGE_KEY = 'aurorae_workspace_category'
const CategoryWorkspaceContext = createContext(null)
const DEFAULT_WORKSPACE_CONTEXT = {
  categories: [],
  activeCategory: null,
  categoryThemes: {},
  defaultCategory: INITIAL_DEFAULT_CATEGORY,
  setActiveCategory: () => {},
  setCategoryTheme: () => {},
  matchesCategory: () => true
}

function loadWorkspaceCategory() {
  try {
    return localStorage.getItem(WORKSPACE_STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function CategoryWorkspaceProvider({ children }) {
  const { categories, defaultCategory } = useCategories()
  const [activeCategory, setActiveCategoryState] = useState(loadWorkspaceCategory)
  const [categoryThemes, setCategoryThemes] = useState(loadCategoryThemes)

  const setCategoryTheme = useCallback((category, themeId) => {
    const current = loadCategoryThemes()
    const updated = { ...current }
    if (themeId === 'default') delete updated[category]
    else updated[category] = themeId
    setCategoryThemes(saveCategoryThemes(updated))
  }, [])

  const setActiveCategory = useCallback((category) => {
    const value = typeof category === 'string' && category.trim()
      ? category.trim()
      : null
    setActiveCategoryState(value)
    try {
      if (value) localStorage.setItem(WORKSPACE_STORAGE_KEY, value)
      else localStorage.removeItem(WORKSPACE_STORAGE_KEY)
    } catch {
      // The selected workspace remains usable in memory if storage is unavailable.
    }
  }, [])

  useEffect(() => {
    const syncWorkspace = (event) => {
      if (event.key === WORKSPACE_STORAGE_KEY) {
        setActiveCategoryState(event.newValue || null)
      } else if (event.key === CATEGORY_THEME_STORAGE_KEY) {
        setCategoryThemes(loadCategoryThemes())
      }
    }
    const renameWorkspace = (event) => {
      const oldCategory = event.detail?.oldCategory
      const newCategory = event.detail?.newCategory
      if (!oldCategory || !newCategory) return
      if (
        activeCategory?.toLowerCase() ===
        oldCategory.toLowerCase()
      ) {
        setActiveCategoryState(newCategory)
        try {
          localStorage.setItem(WORKSPACE_STORAGE_KEY, newCategory)
        } catch {
          // The workspace remains selected in memory if storage is unavailable.
        }
      }
      setCategoryThemes(loadCategoryThemes())
    }
    window.addEventListener('storage', syncWorkspace)
    window.addEventListener('aurorae:category-renamed', renameWorkspace)
    return () => {
      window.removeEventListener('storage', syncWorkspace)
      window.removeEventListener('aurorae:category-renamed', renameWorkspace)
    }
  }, [activeCategory])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const themeId = activeCategory
      ? categoryThemes[activeCategory]
      : undefined
    if (themeId) root.dataset.categoryTheme = themeId
    else delete root.dataset.categoryTheme
  }, [activeCategory, categoryThemes])

  useEffect(() => {
    if (
      activeCategory &&
      !categories.some((category) => category.toLowerCase() === activeCategory.toLowerCase())
    ) {
      setActiveCategory(null)
    }
  }, [activeCategory, categories, setActiveCategory])

  const matchesCategory = useCallback(
    (item, field = 'category') =>
      matchesItemCategories(item, activeCategory, defaultCategory, field),
    [activeCategory, defaultCategory]
  )

  const value = useMemo(
    () => ({
      categories,
      activeCategory,
      defaultCategory,
      setActiveCategory,
      categoryThemes,
      setCategoryTheme,
      matchesCategory
    }),
    [categories, activeCategory, defaultCategory, setActiveCategory, categoryThemes, setCategoryTheme, matchesCategory]
  )

  return (
    <CategoryWorkspaceContext.Provider value={value}>
      {children}
    </CategoryWorkspaceContext.Provider>
  )
}

CategoryWorkspaceProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useCategoryWorkspace() {
  return useContext(CategoryWorkspaceContext) || DEFAULT_WORKSPACE_CONTEXT
}

export function CategoryWorkspaceNav() {
  const { categories, activeCategory, setActiveCategory } = useCategoryWorkspace()

  return (
    <nav className='category-workspace-nav' aria-label='Category workspaces'>
      <strong>Workspace</strong>
      <button
        type='button'
        className={!activeCategory ? 'active' : ''}
        aria-current={!activeCategory ? 'page' : undefined}
        onClick={() => setActiveCategory(null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          type='button'
          key={category}
          className={activeCategory === category ? 'active' : ''}
          aria-current={activeCategory === category ? 'page' : undefined}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </button>
      ))}
    </nav>
  )
}
