import { useCallback, useEffect, useState } from 'react'
import {
  loadCategories,
  getDefaultCategory,
  MAX_CATEGORY_COUNT,
  saveCategories
} from '../utils/categoryStorage'
import { renameCategory as renameCategoryInStorage } from '../utils/categoryManager'

export function useCategories() {
  const [categories, setCategories] = useState(() => loadCategories())
  const defaultCategory = getDefaultCategory()

  const addCategory = useCallback((category) => {
    const value = typeof category === 'string' ? category.trim() : ''
    if (!value) return
    setCategories((current) => {
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return current
      }
      const userCategories = current.filter(
        (item) => item.toLowerCase() !== getDefaultCategory().toLowerCase()
      )
      if (userCategories.length >= MAX_CATEGORY_COUNT) return current
      return [
        getDefaultCategory(),
        ...[...userCategories, value].sort((a, b) => a.localeCompare(b))
      ]
    })
  }, [])

  const renameCategory = useCallback(async (oldName, newName) => {
    const renamed = await renameCategoryInStorage(oldName, newName)
    setCategories(loadCategories())
    window.dispatchEvent(
      new CustomEvent('aurorae:category-renamed', {
        detail: { oldCategory: oldName, newCategory: renamed }
      })
    )
    return renamed
  }, [])

  useEffect(() => {
    saveCategories(categories)
    window.dispatchEvent(new Event('aurorae:categories-changed'))
  }, [categories])

  useEffect(() => {
    const syncCategories = (event) => {
      if (
        event.key !== 'aurorae_categories' &&
        event.type !== 'aurorae:categories-changed'
      ) return
      const storedCategories = loadCategories()
      setCategories((current) =>
        JSON.stringify(current) === JSON.stringify(storedCategories)
          ? current
          : storedCategories
      )
    }
    window.addEventListener('storage', syncCategories)
    window.addEventListener('aurorae:categories-changed', syncCategories)
    return () => {
      window.removeEventListener('storage', syncCategories)
      window.removeEventListener('aurorae:categories-changed', syncCategories)
    }
  }, [])

  return { categories, addCategory, renameCategory, defaultCategory }
}
