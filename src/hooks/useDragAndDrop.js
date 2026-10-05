import { useState } from 'react'

/**
 * Custom hook for managing drag and drop functionality
 */
export function useDragAndDrop(onDrop, onNest, onPromoteSubtask, onNestSubtask) {
  const [draggedTask, setDraggedTask] = useState(null)

  const handleDragStart = (quadrant, task) => {
    setDraggedTask({ quadrant, task })
  }

  const handleSubtaskDragStart = (quadrant, parentId, task) => {
    setDraggedTask({ quadrant, parentId, task })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (targetQuadrant) => {
    if (!draggedTask) return

    if (draggedTask.parentId) {
      onPromoteSubtask?.(
        draggedTask.quadrant,
        draggedTask.parentId,
        draggedTask.task.id,
        targetQuadrant
      )
    } else if (draggedTask.quadrant !== targetQuadrant) {
      onDrop(draggedTask.quadrant, targetQuadrant, draggedTask.task)
    }
    setDraggedTask(null)
  }

  const handleNestDrop = (targetQuadrant, targetId) => {
    if (draggedTask && targetId) {
      if (draggedTask.parentId) {
        if (draggedTask.parentId !== targetId) {
          onNestSubtask?.(
            draggedTask.quadrant,
            draggedTask.parentId,
            draggedTask.task.id,
            targetQuadrant,
            targetId
          )
        }
      } else if (draggedTask.task.id !== targetId) {
        onNest?.(
          draggedTask.quadrant,
          targetQuadrant,
          targetId,
          draggedTask.task
        )
      }
    }
    setDraggedTask(null)
  }

  const handleNestSubtaskDrop = (targetQuadrant, parentId) => {
    handleNestDrop(targetQuadrant, parentId)
  }

  return {
    draggedTask,
    handleDragStart,
    handleSubtaskDragStart,
    handleDragOver,
    handleDrop,
    handleNestDrop,
    handleNestSubtaskDrop,
    handleDragEnd: () => setDraggedTask(null)
  }
}
