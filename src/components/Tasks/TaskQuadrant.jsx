
import PropTypes from 'prop-types'
import TaskItem from './TaskItem'

/**
 * Component for displaying a quadrant of the Eisenhower Matrix
 */
function TaskQuadrant({
  quadrant,
  tasks,
  editingTask,
  editText,
  onToggle,
  onEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop
}) {
  const isEditing = (task) => {
    return (
      editingTask?.quadrant === quadrant.key && editingTask?.taskId === task.id
    )
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop drop target zone
    <div
      className={`matrix-quadrant ${quadrant.colorClass}`}
      onDragOver={onDragOver}
      onDrop={() => onDrop(quadrant.key)}
    >
      <div className='quadrant-header'>
        <h3>{quadrant.title}</h3>
        <span className='subtitle'>{quadrant.subtitle}</span>
      </div>
      <div className='task-list'>
        {tasks.length === 0 ? (
          <p className='empty-state'>No tasks in this quadrant</p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              quadrant={quadrant.key}
              isEditing={isEditing(task)}
              editText={editText}
              onToggle={onToggle}
              onEdit={onEdit}
              onEditTextChange={onEditTextChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  )
}

TaskQuadrant.propTypes = {
  quadrant: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    colorClass: PropTypes.string.isRequired
  }).isRequired,
  tasks: PropTypes.array.isRequired,
  editingTask: PropTypes.shape({
    quadrant: PropTypes.string,
    taskId: PropTypes.string
  }),
  editText: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onEditTextChange: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired
}

export default TaskQuadrant
