import { useState } from 'react'

/**
 * Custom hook for managing drag and drop functionality
 */
export function useDragAndDrop(onDrop, onNest) {
  const [draggedTask, setDraggedTask] = useState(null)

  const handleDragStart = (quadrant, task) => {
    setDraggedTask({ quadrant, task })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (targetQuadrant) => {
    if (!draggedTask) return

    if (draggedTask.quadrant !== targetQuadrant) {
      onDrop(draggedTask.quadrant, targetQuadrant, draggedTask.task)
    }
    setDraggedTask(null)
  }

  const handleNestDrop = (targetQuadrant, targetId) => {
    if (draggedTask && targetId && draggedTask.task.id !== targetId) {
      onNest?.(
        draggedTask.quadrant,
        targetQuadrant,
        targetId,
        draggedTask.task
      )
    }
    setDraggedTask(null)
  }

  return {
    draggedTask,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleNestDrop,
    handleDragEnd: () => setDraggedTask(null)
  }
}
