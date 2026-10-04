import { useState } from 'react'
import { useTasksState } from '../hooks/useTasksState'
import { useCategories } from '../hooks/useCategories'
import { useSavedTasks } from '../hooks/useSavedTasks'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import CategoryTabs from '../components/common/CategoryTabs'
import Icon from '../components/common/Icon'
import TaskForm from '../components/Tasks/TaskForm'
import TaskQuadrant from '../components/Tasks/TaskQuadrant'
import { getPredefinedTasks } from '../utils/predefinedTemplates'

function Tasks() {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    updateTaskCategory,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    nestTask,
    promoteSubtask,
    moveTask,
    getTaskLimitMessage
  } = useTasksState()
  const { categories } = useCategories()
  const { savedTasks, saveTask } = useSavedTasks()

  // Form state
  const [newTask, setNewTask] = useState('')
  const [selectedQuadrant, setSelectedQuadrant] = useState('urgent_important')
  const [taskCategory, setTaskCategory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [taskLimitMessage, setTaskLimitMessage] = useState('')

  // Editing state
  const [editingTask, setEditingTask] = useState(null)
  const [editText, setEditText] = useState('')

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    const limitMessage = getTaskLimitMessage(selectedQuadrant)
    if (limitMessage) {
      setTaskLimitMessage(limitMessage)
      return
    }

    addTask(selectedQuadrant, newTask, taskCategory)
    setTaskLimitMessage('')
    setNewTask('')
  }

  const taskTemplates = getPredefinedTasks()
  const selectedTemplate =
    taskTemplates.find((template) => `template:${template.id}` === selectedTemplateId) ||
    savedTasks.find((task) => `saved:${task.id}` === selectedTemplateId)

  const handleAddFromTemplate = () => {
    if (!selectedTemplate) return
    const templateCategory =
      categories.find(
        (category) =>
          category.toLowerCase() ===
          (selectedTemplate.category || '').trim().toLowerCase()
      ) || ''
    const quadrant =
      selectedTemplate.quadrant || selectedQuadrant || 'urgent_important'
    const limitMessage = getTaskLimitMessage(quadrant)
    if (limitMessage) {
      setTaskLimitMessage(limitMessage)
      return
    }

    addTask(quadrant, selectedTemplate.title || selectedTemplate.text, templateCategory)
    setTaskLimitMessage('')
    if (templateCategory) {
      setSelectedCategory(templateCategory)
    } else {
      setSelectedCategory(null)
    }
    setTaskCategory(templateCategory)
    setSelectedQuadrant(quadrant)
  }

  const handleTaskMove = (fromQuadrant, toQuadrant, task) => {
    const limitMessage = getTaskLimitMessage(toQuadrant, fromQuadrant)
    if (limitMessage) {
      setTaskLimitMessage(limitMessage)
      return
    }

    moveTask(fromQuadrant, toQuadrant, task)
    setTaskLimitMessage('')
  }

  const handleSubtaskPromotion = (fromQuadrant, parentId, subtaskId, toQuadrant) => {
    const limitMessage = getTaskLimitMessage(toQuadrant)
    if (limitMessage) {
      setTaskLimitMessage(limitMessage)
      return
    }

    promoteSubtask(fromQuadrant, parentId, subtaskId, toQuadrant)
    setTaskLimitMessage('')
  }

  // Drag and drop
  const {
    handleDragStart,
    handleSubtaskDragStart,
    handleDragOver,
    handleDrop,
    handleNestDrop,
    handleNestSubtaskDrop,
    handleDragEnd
  } = useDragAndDrop(
    handleTaskMove,
    (fromQuadrant, toQuadrant, parentId, task) =>
      nestTask(fromQuadrant, toQuadrant, parentId, task),
    handleSubtaskPromotion
  )

  const startEditTask = (quadrant, task) => {
    setEditingTask({ quadrant, taskId: task.id })
    setEditText(task.text)
  }

  const saveEditTask = () => {
    if (!editText.trim()) {
      cancelEditTask()
      return
    }

    editTask(editingTask.quadrant, editingTask.taskId, editText)
    setEditingTask(null)
    setEditText('')
  }

  const cancelEditTask = () => {
    setEditingTask(null)
    setEditText('')
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setTaskCategory(category || '')
  }

  const quadrants = [
    {
      key: 'urgent_important',
      title: 'Urgent & Important',
      subtitle: 'Do First',
      colorClass: 'quadrant-red'
    },
    {
      key: 'not_urgent_important',
      title: 'Not Urgent & Important',
      subtitle: 'Schedule',
      colorClass: 'quadrant-blue'
    },
    {
      key: 'urgent_not_important',
      title: 'Urgent & Not Important',
      subtitle: 'Delegate',
      colorClass: 'quadrant-yellow'
    },
    {
      key: 'not_urgent_not_important',
      title: 'Not Urgent & Not Important',
      subtitle: 'Eliminate',
      colorClass: 'quadrant-green'
    }
  ]
  return (
    <div className='tasks-container'>
      <div className='card'>
        <div className='card-h'>
          <strong>Tasks</strong>
        </div>
        <div className='card-b'>
          <TaskForm
            newTask={newTask}
            selectedQuadrant={selectedQuadrant}
            category={taskCategory}
            categories={categories}
            onTaskChange={setNewTask}
            onQuadrantChange={setSelectedQuadrant}
            onCategoryChange={setTaskCategory}
            onSubmit={handleAddTask}
          />
          {taskLimitMessage && (
            <p className='task-limit-message' role='status'>
              {taskLimitMessage}
            </p>
          )}
          <div className='task-template-picker'>
            <label htmlFor='task-template'>Add task from template:</label>
            <select
              id='task-template'
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className='quadrant-select'
            >
              <option value=''>Choose a saved or built-in task</option>
              {savedTasks.length > 0 && (
                <optgroup label='Saved tasks'>
                  {savedTasks.map((task) => (
                    <option key={task.id} value={`saved:${task.id}`}>
                      {task.text}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label='Task templates'>
                {taskTemplates.map((template) => (
                  <option key={template.id} value={`template:${template.id}`}>
                    {template.title}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              type='button'
              className='btn btn-primary'
              onClick={handleAddFromTemplate}
              disabled={!selectedTemplate}
            >
              <Icon name='plus' />
              Add task
            </button>
          </div>
        </div>
      </div>

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={handleCategorySelect}
      />

      <div className='eisenhower-matrix'>
        {quadrants.map((quadrant) => (
          <TaskQuadrant
            key={quadrant.key}
            quadrant={quadrant}
            tasks={tasks[quadrant.key].filter(
              (task) =>
                selectedCategory === null ||
                (typeof task.category === 'string'
                  ? task.category.toLowerCase()
                  : '') ===
                  selectedCategory.toLowerCase()
            )}
            editingTask={editingTask}
            editText={editText}
            categories={categories}
            onCategoryChange={updateTaskCategory}
            onToggle={toggleTask}
            onEdit={startEditTask}
            onEditTextChange={setEditText}
            onSaveEdit={saveEditTask}
            onCancelEdit={cancelEditTask}
            onDelete={deleteTask}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onDeleteSubtask={deleteSubtask}
            onDragStart={handleDragStart}
            onSubtaskDragStart={handleSubtaskDragStart}
            onNestDrop={handleNestDrop}
            onNestSubtaskDrop={handleNestSubtaskDrop}
            onPromoteSubtask={handleSubtaskPromotion}
            savedTasks={savedTasks}
            onSaveTask={saveTask}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <div className='tasks-info'>
        <p className='small'>
          <strong>Tip:</strong> Drag tasks between quadrants to reorganize them,
          drop a task onto a subtask to nest it, or drag a subtask to a quadrant
          to make it a task. Use each task’s More menu to add subtasks or change
          categories.
          The Eisenhower Matrix helps prioritize tasks by urgency and
          importance.
        </p>
        <p className='small'>
          Limits apply across all categories: 4 Urgent &amp; Important tasks,
          10 Important tasks, and 10 Urgent tasks.
        </p>
      </div>
    </div>
  )
}

export default Tasks
