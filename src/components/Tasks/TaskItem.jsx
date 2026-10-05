import { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'
import CategoryMultiSelect from '../common/CategoryMultiSelect'
import { getDefaultCategory } from '../../utils/categoryStorage'
import { getItemCategories } from '../../utils/itemCategories'

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
  onSubtaskDragStart,
  onNestDrop,
  onNestSubtaskDrop,
  onPromoteSubtask,
  onDragOver,
  onDragEnd,
  isSaved,
  onSaveTask,
  onMoveTask
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
    if (
      !e.altKey ||
      isEditing ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
      e.target.isContentEditable
    ) {
      return
    }
    const adjacentQuadrants = {
      urgent_important: {
        ArrowDown: 'not_urgent_important',
        ArrowRight: 'urgent_not_important'
      },
      not_urgent_important: {
        ArrowUp: 'urgent_important',
        ArrowRight: 'not_urgent_not_important'
      },
      urgent_not_important: {
        ArrowDown: 'not_urgent_not_important',
        ArrowLeft: 'urgent_important'
      },
      not_urgent_not_important: {
        ArrowUp: 'urgent_not_important',
        ArrowLeft: 'not_urgent_important'
      }
    }
    const targetQuadrant = adjacentQuadrants[quadrant]?.[e.key]
    if (targetQuadrant) {
      e.preventDefault()
      onMoveTask(quadrant, targetQuadrant, task)
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
      onDragOver={onDragOver}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onNestDrop(quadrant, task.id)
      }}
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? -1 : 0}
      role='group'
      aria-label={`Task: ${task.text}. Press Alt + Arrow keys to move between quadrants.`}
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
            draggable
            onDragStart={() => onDragStart(quadrant, task)}
            onDragEnd={onDragEnd}
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
              onClick={() => onSaveTask({ ...task, quadrant })}
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
            <details
              className='task-context-menu'
              onDragStart={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
            >
              <summary
                role='button'
                tabIndex={0}
                aria-label={`More actions for task "${task.text}"`}
                onKeyDown={(event) => {
                  const menu = event.currentTarget.parentElement
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    menu.open = !menu.open
                  } else if (event.key === 'Escape') {
                    menu.open = false
                  }
                }}
              >
                More
              </summary>
              <div className='task-context-menu-panel'>
                <button
                  type='button'
                  className='task-context-menu-action'
                  onClick={() => setIsAddingSubtask(true)}
                  aria-label={`Add subtask to ${task.text}`}
                >
                  Add subtask
                </button>
                <div className='task-context-menu-label'>
                  Category
                  <CategoryMultiSelect
                    value={
                      getItemCategories(task).length
                        ? getItemCategories(task)
                        : [getDefaultCategory()]
                    }
                    categories={categories}
                    defaultCategory={getDefaultCategory()}
                    onChange={(value) =>
                      onCategoryChange(quadrant, task.id, value)
                    }
                    label={`Categories for "${task.text}"`}
                    className='task-context-category-select'
                  />
                </div>
              </div>
            </details>
          </>
        )}
      </div>
      <div className='task-subtasks'>
        {subtasks.map((subtask) => (
          <div
            className='task-subtask'
            key={subtask.id}
            data-subtask-id={subtask.id}
            draggable
            onDragStart={(event) => {
              event.stopPropagation()
              onSubtaskDragStart(quadrant, task.id, subtask)
            }}
            onDragOver={onDragOver}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onNestSubtaskDrop(quadrant, task.id)
            }}
            onDragEnd={(event) => {
              event.stopPropagation()
              onDragEnd()
            }}
            role='group'
            aria-label={`Subtask: ${subtask.text}. Drag to a quadrant to make it a task.`}
          >
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
            <button
              type='button'
              className='task-promote-subtask'
              onClick={() =>
                onPromoteSubtask(quadrant, task.id, subtask.id, quadrant)
              }
              aria-label={`Make "${subtask.text}" a task`}
              title='Make task'
            >
              Make task
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
        ) : null}
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
  onSubtaskDragStart: PropTypes.func.isRequired,
  onNestDrop: PropTypes.func.isRequired,
  onNestSubtaskDrop: PropTypes.func.isRequired,
  onPromoteSubtask: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  isSaved: PropTypes.bool.isRequired,
  onSaveTask: PropTypes.func.isRequired,
  onMoveTask: PropTypes.func.isRequired
}

export default TaskItem
