import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as generateSecureUUID } from 'uuid'
import { createLogger } from '../utils/logger'
import {
  createDefaultTasksState,
  loadTasksState,
  saveTasksState
} from '../utils/tasksStorage'
import { getDefaultCategory } from '../utils/categoryStorage'
import { assignItemCategories, getItemCategories } from '../utils/itemCategories'
import { useCrossTabSync } from './useCrossTabSync'

const logger = createLogger('useTasksState')

const IMPORTANT_QUADRANTS = ['urgent_important', 'not_urgent_important']
const URGENT_QUADRANTS = ['urgent_important', 'urgent_not_important']

function getTaskLimitMessage(state, quadrant, sourceQuadrant = null) {
  const counts = Object.fromEntries(
    [
      ...IMPORTANT_QUADRANTS,
      'urgent_not_important',
      'not_urgent_not_important'
    ].map((key) => [key, (state?.[key] || []).length])
  )

  if (sourceQuadrant && sourceQuadrant !== quadrant) {
    counts[sourceQuadrant] = Math.max(0, (counts[sourceQuadrant] || 0) - 1)
  }

  if (
    quadrant === 'urgent_important' &&
    counts.urgent_important >= 4
  ) {
    return 'You can have at most 4 Urgent & Important tasks.'
  }

  if (
    IMPORTANT_QUADRANTS.includes(quadrant) &&
    IMPORTANT_QUADRANTS.reduce((total, key) => total + counts[key], 0) >= 10
  ) {
    return 'You can have at most 10 Important tasks across all categories.'
  }

  if (
    URGENT_QUADRANTS.includes(quadrant) &&
    URGENT_QUADRANTS.reduce((total, key) => total + counts[key], 0) >= 10
  ) {
    return 'You can have at most 10 Urgent tasks across all categories.'
  }

  return ''
}

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
  const addTask = (quadrant, text, category = getDefaultCategory()) => {
    if (getTaskLimitMessage(tasks, quadrant)) return null

    const task = assignItemCategories({
      id: generateSecureUUID(),
      text: text.trim(),
      completed: false,
      subtasks: [],
      createdAt: new Date().toISOString(),
      dueDate: null,
      completedAt: null
    }, category, getDefaultCategory())

    setTasks((prev) => {
      const state = prev || createDefaultTasksState()
      if (getTaskLimitMessage(state, quadrant)) return state
      return {
        ...state,
        [quadrant]: [...(state[quadrant] || []), task]
      }
    })

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

  const updateTaskCategory = (quadrant, taskId, categories) => {
    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).map((task) =>
        task.id === taskId
          ? assignItemCategories(task, categories, getDefaultCategory())
          : task
      )
    }))
  }

  const addSubtask = (quadrant, taskId, text) => {
    const subtask = {
      id: generateSecureUUID(),
      text: text.trim(),
      completed: false
    }

    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...(Array.isArray(task.subtasks) ? task.subtasks : []),
                assignItemCategories(
                  subtask,
                  getItemCategories(task),
                  getDefaultCategory()
                )
              ]
            }
          : task
      )
    }))

    return subtask
  }

  const toggleSubtask = (quadrant, taskId, subtaskId) => {
    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (Array.isArray(task.subtasks) ? task.subtasks : []).map(
                (subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              )
            }
          : task
      )
    }))
  }

  const deleteSubtask = (quadrant, taskId, subtaskId) => {
    setTasks((prev) => ({
      ...(prev || createDefaultTasksState()),
      [quadrant]: (prev?.[quadrant] || []).map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (Array.isArray(task.subtasks) ? task.subtasks : []).filter(
                (subtask) => subtask.id !== subtaskId
              )
            }
          : task
      )
    }))
  }

  const nestTask = (fromQuadrant, parentQuadrant, parentId, task) => {
    if (task.id === parentId || (task.subtasks || []).length > 0) return false
    let moved = false

    setTasks((prev) => {
      const state = prev || createDefaultTasksState()
      const parentTasks = state[parentQuadrant] || []
      const parentExists = parentTasks.some((item) => item.id === parentId)
      const sourceTasks = state[fromQuadrant] || []
      const sourceExists = sourceTasks.some((item) => item.id === task.id)
      if (!parentExists || !sourceExists) return state
      moved = true

      const remainingSourceTasks = sourceTasks.filter(
        (item) => item.id !== task.id
      )
      const nextParentTasks =
        fromQuadrant === parentQuadrant
          ? remainingSourceTasks
          : parentTasks

      return {
        ...state,
        [fromQuadrant]: remainingSourceTasks,
        [parentQuadrant]: nextParentTasks.map((item) =>
          item.id === parentId
            ? {
                ...item,
                subtasks: [
                  ...(Array.isArray(item.subtasks) ? item.subtasks : []),
                  {
                    id: task.id,
                    text: task.text,
                    completed: task.completed
                  }
                ]
              }
            : item
        )
      }
    })
    return moved
  }

  const nestSubtask = (
    fromQuadrant,
    sourceParentId,
    subtaskId,
    toQuadrant,
    targetParentId
  ) => {
    if (sourceParentId === targetParentId) return false
    let moved = false

    setTasks((prev) => {
      const state = prev || createDefaultTasksState()
      const sourceTasks = state[fromQuadrant] || []
      const targetTasks = state[toQuadrant] || []
      const sourceParent = sourceTasks.find((task) => task.id === sourceParentId)
      const targetParent = targetTasks.find((task) => task.id === targetParentId)
      const sourceSubtasks = Array.isArray(sourceParent?.subtasks)
        ? sourceParent.subtasks
        : []
      const subtask = sourceSubtasks.find((item) => item.id === subtaskId)
      if (!sourceParent || !targetParent || !subtask) return state
      moved = true

      const updatedSourceTasks = sourceTasks.map((task) =>
        task.id === sourceParentId
          ? {
              ...task,
              subtasks: (Array.isArray(task.subtasks) ? task.subtasks : []).filter(
                (item) => item.id !== subtaskId
              )
            }
          : task
      )
      const targetTasksAfterRemoval =
        fromQuadrant === toQuadrant ? updatedSourceTasks : targetTasks
      const updatedTargetTasks = targetTasksAfterRemoval.map((task) =>
        task.id === targetParentId
          ? {
              ...task,
              subtasks: [
                ...(task.subtasks || []),
                assignItemCategories(
                  subtask,
                  getItemCategories(task),
                  getDefaultCategory()
                )
              ]
            }
          : task
      )

      return {
        ...state,
        [fromQuadrant]: updatedSourceTasks,
        [toQuadrant]: updatedTargetTasks
      }
    })
    return moved
  }

  const promoteSubtask = (fromQuadrant, parentId, subtaskId, toQuadrant) => {
    setTasks((prev) => {
      const state = prev || createDefaultTasksState()
      if (getTaskLimitMessage(state, toQuadrant)) return state
      const sourceTasks = state[fromQuadrant] || []
      const parent = sourceTasks.find((item) => item.id === parentId)
      const parentSubtasks = Array.isArray(parent?.subtasks)
        ? parent.subtasks
        : []
      const subtask = parentSubtasks.find((item) => item.id === subtaskId)
      if (!parent || !subtask) return state

      const promotedTask = {
        ...assignItemCategories(
          subtask,
          getItemCategories(parent),
          getDefaultCategory()
        ),
        subtasks: [],
        createdAt: new Date().toISOString(),
        dueDate: null,
        completedAt: subtask.completed ? Date.now() : null
      }
      const remainingSourceTasks = sourceTasks.map((item) =>
        item.id === parentId
          ? {
              ...item,
              subtasks: parentSubtasks.filter(
                (child) => child.id !== subtaskId
              )
            }
          : item
      )

      return {
        ...state,
        [fromQuadrant]:
          fromQuadrant === toQuadrant
            ? [...remainingSourceTasks, promotedTask]
            : remainingSourceTasks,
        ...(fromQuadrant !== toQuadrant && {
          [toQuadrant]: [...(state[toQuadrant] || []), promotedTask]
        })
      }
    })
  }

  // Move task between quadrants
  const moveTask = (fromQuadrant, toQuadrant, task) => {
    if (fromQuadrant === toQuadrant) return

    if (getTaskLimitMessage(tasks, toQuadrant, fromQuadrant)) return

    setTasks((prev) => {
      const state = prev || createDefaultTasksState()
      if (getTaskLimitMessage(state, toQuadrant, fromQuadrant)) return state
      return {
        ...state,
        [fromQuadrant]: (state[fromQuadrant] || []).filter(
          (item) => item.id !== task.id
        ),
        [toQuadrant]: [...(state[toQuadrant] || []), task]
      }
    })
  }

  return {
    tasks,
    setTasks,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    updateTaskCategory,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    nestTask,
    nestSubtask,
    promoteSubtask,
    moveTask,
    getTaskLimitMessage: (quadrant, sourceQuadrant = null) =>
      getTaskLimitMessage(tasks, quadrant, sourceQuadrant)
  }
}
