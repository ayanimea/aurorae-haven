
import PropTypes from 'prop-types'
import Icon from '../common/Icon'
import CategoryMultiSelect from '../common/CategoryMultiSelect'

/**
 * Component for adding new tasks
 */
function TaskForm({
  newTask,
  selectedQuadrant,
  categoriesValue,
  categories,
  defaultCategory,
  onTaskChange,
  onQuadrantChange,
  onCategoryChange,
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
      <CategoryMultiSelect
        value={categoriesValue}
        categories={categories}
        defaultCategory={defaultCategory}
        onChange={onCategoryChange}
        label='Categories'
        className='task-form-categories'
      />
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
  categoriesValue: PropTypes.arrayOf(PropTypes.string).isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  defaultCategory: PropTypes.string.isRequired,
  onTaskChange: PropTypes.func.isRequired,
  onQuadrantChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
}

export default TaskForm
