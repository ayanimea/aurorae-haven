export const SAVED_TASKS_STORAGE_KEY = 'aurorae_saved_tasks'

export function loadSavedTasks() {
  try {
    const savedTasks = JSON.parse(
      localStorage.getItem(SAVED_TASKS_STORAGE_KEY) || '[]'
    )
    return Array.isArray(savedTasks)
      ? savedTasks.filter(
          (task) =>
            task &&
            typeof task.id === 'string' &&
            typeof task.text === 'string' &&
            typeof task.quadrant === 'string'
        )
      : []
  } catch {
    return []
  }
}

export function saveSavedTasks(tasks) {
  localStorage.setItem(SAVED_TASKS_STORAGE_KEY, JSON.stringify(tasks))
}
