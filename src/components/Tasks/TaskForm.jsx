
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * Component for adding new tasks
 */
function TaskForm({
  newTask,
  selectedQuadrant,
  onTaskChange,
  onQuadrantChange,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} className='add-task-form'>
      <input
        type='text'
        placeholder='Add a new task...'
        value={newTask}
        onChange={(e) => onTaskChange(e.target.value)}
        className='task-input'
        aria-label='New task text'
      />
      <select
        value={selectedQuadrant}
        onChange={(e) => onQuadrantChange(e.target.value)}
        className='quadrant-select'
        aria-label='Select quadrant'
      >
        <option value='urgent_important'>Urgent & Important</option>
        <option value='not_urgent_important'>Not Urgent & Important</option>
        <option value='urgent_not_important'>Urgent & Not Important</option>
        <option value='not_urgent_not_important'>
          Not Urgent & Not Important
        </option>
      </select>
      <button type='submit' className='btn btn-primary'>
        <Icon name='plus' />
        Add Task
      </button>
    </form>
  )
}

TaskForm.propTypes = {
  newTask: PropTypes.string.isRequired,
  selectedQuadrant: PropTypes.string.isRequired,
  onTaskChange: PropTypes.func.isRequired,
  onQuadrantChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
}

export default TaskForm
