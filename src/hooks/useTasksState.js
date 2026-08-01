import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as generateSecureUUID } from 'uuid'
import { createLogger } from '../utils/logger'
import {
  createDefaultTasksState,
  loadTasksState,
  saveTasksState
} from '../utils/tasksStorage'
import { useCrossTabSync } from './useCrossTabSync'

const logger = createLogger('useTasksState')

/**
 * Custom hook for managing tasks state in Eisenhower Matrix
 * Handles CRUD operations and localStorage persistence
 */
export function useTasksState() {
  // Initialize tasks from localStorage with lazy initialization
  const [tasks, setTasks] = useState(() => loadTasksState())
  const skipPersistRef = useRef(false)

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }

    try {
      saveTasksState(tasks, {
        action: 'updated',
        source: 'useTasksState'
      })
    } catch (e) {
      logger.error('Failed to save tasks:', e)
      // Note: Errors are logged but don't throw to avoid breaking the component
      // The parent component should handle showing error messages to users
    }
  }, [tasks])

  const syncFromStorage = useCallback(() => {
    const storageTasks = loadTasksState()
    skipPersistRef.current = true
    setTasks(storageTasks)
  }, [])

  useCrossTabSync(syncFromStorage, {
    filter: (event) => event.domain === 'tasks',
    includeSelf: false
  })

  // Add new task
  const addTask = (quadrant, text) => {
    const task = {
      id: generateSecureUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: null,
      completedAt: null
    }

    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: [...(prev?.[quadrant] || []), task]
    }))

    return task
  }

  // Toggle task completion
  const toggleTask = (quadrant, taskId) => {
    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? Date.now() : null
            }
          : task
      )
    }))
  }

  // Delete task
  const deleteTask = (quadrant, taskId) => {
    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).filter((task) => task.id !== taskId)
    }))
  }

  // Edit task text
  const editTask = (quadrant, taskId, newText) => {
    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).map((task) =>
        task.id === taskId ? { ...task, text: newText.trim() } : task
      )
    }))
  }

  // Move task between quadrants
  const moveTask = (fromQuadrant, toQuadrant, task) => {
    if (fromQuadrant === toQuadrant) return

    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [fromQuadrant]: (prev?.[fromQuadrant] || []).filter((t) => t.id !== task.id),
      [toQuadrant]: [...(prev?.[toQuadrant] || []), task]
    }))
  }

  return {
    tasks,
    setTasks,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    moveTask
  }
}
