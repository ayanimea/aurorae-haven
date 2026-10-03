import { useRef, useEffect, useState } from 'react'
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
  categories,
  onCategoryChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onDragStart,
  onNestDrop,
  onDragOver,
  onDragEnd,
  isSaved,
  onSaveTask
}) {
  const editInputRef = useRef(null)
  const subtaskInputRef = useRef(null)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [subtaskText, setSubtaskText] = useState('')
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
    }
    if (isAddingSubtask && subtaskInputRef.current) {
      subtaskInputRef.current.focus()
    }
  }, [isEditing, isAddingSubtask])

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

  const handleAddSubtask = (e) => {
    e.preventDefault()
    if (!subtaskText.trim()) return
    onAddSubtask(quadrant, task.id, subtaskText)
    setSubtaskText('')
    setIsAddingSubtask(false)
  }

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''}`}
      draggable={!isEditing}
      onDragStart={() => onDragStart(quadrant, task)}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onNestDrop(quadrant, task.id)
      }}
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? -1 : 0}
      role='group'
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
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: onDoubleClick is a power-user shortcut; primary edit interaction is via the accessible Edit button */}
          <span
            className='task-text'
            onDoubleClick={() => onEdit(quadrant, task)}
          >
            {task.text}
          </span>
        </>
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
            <button
              type='button'
              className='btn-edit'
              onClick={() => onSaveTask(task)}
              aria-label={isSaved ? `Task "${task.text}" is saved` : `Save task "${task.text}" for later`}
              title={isSaved ? 'Saved for reuse' : 'Save for reuse'}
              disabled={isSaved}
            >
              <Icon name='check' />
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
      {!isEditing && (
        <select
          className='task-category-select quadrant-select'
          value={task.category || ''}
          onChange={(event) =>
            onCategoryChange(quadrant, task.id, event.target.value)
          }
          aria-label={`Category for task "${task.text}"`}
        >
          <option value=''>No category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      )}
      <div className='task-subtasks'>
        {subtasks.map((subtask) => (
          <div className='task-subtask' key={subtask.id}>
            <input
              type='checkbox'
              checked={subtask.completed}
              onChange={() =>
                onToggleSubtask(quadrant, task.id, subtask.id)
              }
              aria-label={`Mark "${subtask.text}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
            />
            <span className={subtask.completed ? 'completed' : ''}>
              {subtask.text}
            </span>
            <button
              type='button'
              className='btn-delete'
              onClick={() => onDeleteSubtask(quadrant, task.id, subtask.id)}
              aria-label={`Delete subtask "${subtask.text}"`}
            >
              <Icon name='trash' />
            </button>
          </div>
        ))}
        {isAddingSubtask ? (
          <form className='task-subtask-form' onSubmit={handleAddSubtask}>
            <input
              ref={subtaskInputRef}
              type='text'
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              aria-label={`New subtask for ${task.text}`}
            />
            <button type='submit' className='btn' aria-label='Save subtask'>
              <Icon name='check' />
            </button>
            <button
              type='button'
              className='btn'
              onClick={() => {
                setSubtaskText('')
                setIsAddingSubtask(false)
              }}
              aria-label='Cancel subtask'
            >
              <Icon name='x' />
            </button>
          </form>
        ) : (
          <button
            type='button'
            className='task-add-subtask'
            onClick={() => setIsAddingSubtask(true)}
            aria-label={`Add subtask to ${task.text}`}
          >
            <Icon name='plus' />
            Add subtask
          </button>
        )}
      </div>
    </div>
  )
}

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
    category: PropTypes.string
  }).isRequired,
  quadrant: PropTypes.string.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editText: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onEditTextChange: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSubtask: PropTypes.func.isRequired,
  onToggleSubtask: PropTypes.func.isRequired,
  onDeleteSubtask: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onNestDrop: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  isSaved: PropTypes.bool.isRequired,
  onSaveTask: PropTypes.func.isRequired
}

export default TaskItem
