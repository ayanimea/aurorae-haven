
import PropTypes from 'prop-types'
import TaskItem from './TaskItem'
import { getItemCategories } from '../../utils/itemCategories'

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
  savedTasks,
  onSaveTask,
  onDrop,
  onMoveTask,
  availableTasks,
  onNestTask
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
              categories={categories}
              onCategoryChange={onCategoryChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onDragStart={onDragStart}
              onSubtaskDragStart={onSubtaskDragStart}
              onNestDrop={onNestDrop}
              onNestSubtaskDrop={onNestSubtaskDrop}
              onPromoteSubtask={onPromoteSubtask}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onMoveTask={onMoveTask}
              availableTasks={availableTasks}
              onNestTask={onNestTask}
              isSaved={savedTasks.some(
                (saved) =>
                  saved.text === task.text &&
                  saved.quadrant === quadrant.key &&
                  JSON.stringify(getItemCategories(saved)) ===
                    JSON.stringify(getItemCategories(task))
              )}
              onSaveTask={onSaveTask}
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
  savedTasks: PropTypes.array.isRequired,
  onSaveTask: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onMoveTask: PropTypes.func.isRequired,
  availableTasks: PropTypes.array.isRequired,
  onNestTask: PropTypes.func.isRequired
}

export default TaskQuadrant
