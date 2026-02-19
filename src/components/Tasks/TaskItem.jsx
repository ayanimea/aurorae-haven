import { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * Component for displaying and editing a single task
 */
function TaskItem({
  task,
  quadrant,
  isEditing,
  editText,
  onToggle,
  onEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDragStart
}) {
  const editInputRef = useRef(null)

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [isEditing])

  const handleKeyDown = (e) => {
    // Keyboard shortcuts for moving tasks between quadrants
    if (e.altKey && !isEditing) {
      e.preventDefault()
      switch (e.key) {
        case 'ArrowUp':
          // Move to previous quadrant
          onDragStart(quadrant, task)
          // Trigger drop in previous quadrant - handled by parent
          break
        case 'ArrowDown':
          // Move to next quadrant
          onDragStart(quadrant, task)
          break
        case 'ArrowLeft':
        case 'ArrowRight':
          // Move to adjacent quadrant
          onDragStart(quadrant, task)
          break
        default:
          break
      }
    }
  }

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''}`}
      draggable={!isEditing}
      onDragStart={() => onDragStart(quadrant, task)}
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? -1 : 0}
      role='button'
      aria-label={`Task: ${task.text}. Press Alt + Arrow keys to move between quadrants.`}
      onClick={(e) => {
        // Allow click to propagate to child elements (checkbox, edit, delete)
        if (e.target.classList.contains('task-item')) {
          // Handle task item click if needed
        }
      }}
    >
      <input
        type='checkbox'
        checked={task.completed}
        onChange={() => onToggle(quadrant, task.id)}
        disabled={isEditing}
        aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      {isEditing ? (
        <input
          ref={editInputRef}
          type='text'
          value={editText}
          onChange={(e) => onEditTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveEdit()
            } else if (e.key === 'Escape') {
              onCancelEdit()
            }
          }}
          className='task-edit-input'
          aria-label='Edit task text'
        />
      ) : (
        <span
          className='task-text'
          role='button'
          tabIndex={0}
          onDoubleClick={() => onEdit(quadrant, task)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(quadrant, task) }}
        >
          {task.text}
        </span>
      )}
      <div className='task-actions'>
        {isEditing ? (
          <>
            <button type="button"
              className='btn-save'
              onClick={onSaveEdit}
              aria-label='Save task'
            >
              <Icon name='check' />
            </button>
            <button type="button"
              className='btn-cancel'
              onClick={onCancelEdit}
              aria-label='Cancel editing'
            >
              <Icon name='x' />
            </button>
          </>
        ) : (
          <>
            <button type="button"
              className='btn-edit'
              onClick={() => onEdit(quadrant, task)}
              aria-label={`Edit task "${task.text}"`}
            >
              <Icon name='edit' />
            </button>
            <button type="button"
              className='btn-delete'
              onClick={() => onDelete(quadrant, task.id)}
              aria-label={`Delete task "${task.text}"`}
            >
              <Icon name='trash' />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired
  }).isRequired,
  quadrant: PropTypes.string.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editText: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onEditTextChange: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired
}

export default TaskItem
