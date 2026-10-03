import { useCallback, useState } from 'react'
import { v4 as generateSecureUUID } from 'uuid'
import { loadSavedTasks, saveSavedTasks } from '../utils/savedTasks'

export function useSavedTasks() {
  const [savedTasks, setSavedTasks] = useState(() => loadSavedTasks())

  const saveTask = useCallback((task) => {
    const duplicate = savedTasks.some(
      (item) =>
        item.text === task.text &&
        item.quadrant === task.quadrant &&
        item.category === (task.category || '')
    )
    if (duplicate) return
    const next = [
      ...savedTasks,
      {
        id: generateSecureUUID(),
        text: task.text,
        quadrant: task.quadrant,
        category: task.category || ''
      }
    ]
    saveSavedTasks(next)
    setSavedTasks(next)
  }, [savedTasks])

  return { savedTasks, saveTask }
}
