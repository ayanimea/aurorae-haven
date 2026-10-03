import { useCallback, useEffect, useState } from 'react'
import { loadCategories, saveCategories } from '../utils/categoryStorage'

export function useCategories() {
  const [categories, setCategories] = useState(() => loadCategories())

  const addCategory = useCallback((category) => {
    const value = typeof category === 'string' ? category.trim() : ''
    if (!value) return
    setCategories((current) => {
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return current
      }
      return [...current, value].sort((a, b) => a.localeCompare(b))
    })
  }, [])

  useEffect(() => {
    saveCategories(categories)
  }, [categories])

  useEffect(() => {
    const syncCategories = (event) => {
      if (event.key === 'aurorae_categories') {
        setCategories(loadCategories())
      }
    }
    window.addEventListener('storage', syncCategories)
    return () => window.removeEventListener('storage', syncCategories)
  }, [])

  return { categories, addCategory }
}
