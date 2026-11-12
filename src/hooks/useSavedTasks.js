import { useCallback, useEffect, useState } from 'react'
import { v4 as generateSecureUUID } from 'uuid'
import { loadSavedTasks, saveSavedTasks } from '../utils/savedTasks'
import {
  getItemCategories,
  normalizeCategorySelection
} from '../utils/itemCategories'
import { getDefaultCategory } from '../utils/categoryStorage'
import { useCrossTabSync } from './useCrossTabSync'

export function useSavedTasks() {
  const [savedTasks, setSavedTasks] = useState(() => loadSavedTasks())
  const syncSavedTasks = useCallback(() => {
    setSavedTasks(loadSavedTasks())
  }, [])

  useCrossTabSync(syncSavedTasks, {
    filter: (event) => event.domain === 'savedTasks',
    includeSelf: false
  })

  useEffect(() => {
    window.addEventListener('aurorae:category-renamed', syncSavedTasks)
    return () =>
      window.removeEventListener('aurorae:category-renamed', syncSavedTasks)
  }, [syncSavedTasks])

  const saveTask = useCallback((task) => {
    const workspaceCategories = normalizeCategorySelection(
      getItemCategories(task),
      getDefaultCategory()
    )
    const duplicate = savedTasks.some(
      (item) =>
        item.text === task.text &&
        item.quadrant === task.quadrant &&
        JSON.stringify(getItemCategories(item)) ===
          JSON.stringify(workspaceCategories)
    )
    if (duplicate) return
    const next = [
      ...savedTasks,
      {
        id: generateSecureUUID(),
        text: task.text,
        quadrant: task.quadrant,
        category: workspaceCategories[0],
        workspaceCategories
      }
    ]
    saveSavedTasks(next)
    setSavedTasks(next)
  }, [savedTasks])

  return { savedTasks, saveTask }
}
