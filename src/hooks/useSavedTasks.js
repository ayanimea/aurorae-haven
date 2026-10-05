import { useCallback, useState } from 'react'
import { v4 as generateSecureUUID } from 'uuid'
import { loadSavedTasks, saveSavedTasks } from '../utils/savedTasks'
import {
  getItemCategories,
  normalizeCategorySelection
} from '../utils/itemCategories'
import { getDefaultCategory } from '../utils/categoryStorage'

export function useSavedTasks() {
  const [savedTasks, setSavedTasks] = useState(() => loadSavedTasks())

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
