import { useState } from 'react'
import { useTasksState } from '../hooks/useTasksState'
import { useCategories } from '../hooks/useCategories'
import { useSavedTasks } from '../hooks/useSavedTasks'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import { useCategoryWorkspace } from '../contexts/CategoryWorkspaceContext'
import Icon from '../components/common/Icon'
import TaskForm from '../components/Tasks/TaskForm'
import TaskQuadrant from '../components/Tasks/TaskQuadrant'
import { getPredefinedTasks } from '../utils/predefinedTemplates'
import { getItemCategories, normalizeCategorySelection } from '../utils/itemCategories'

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
    nestSubtask,
    promoteSubtask,
    moveTask,
    getTaskLimitMessage
  } = useTasksState()
  const { categories } = useCategories()
  const { activeCategory, defaultCategory, matchesCategory } =
    useCategoryWorkspace()
  const { savedTasks, saveTask } = useSavedTasks()

  // Form state
  const [newTask, setNewTask] = useState('')
  const [selectedQuadrant, setSelectedQuadrant] = useState('urgent_important')
  const [taskCategories, setTaskCategories] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [taskLimitMessage, setTaskLimitMessage] = useState('')
  const [taskSortMode, setTaskSortMode] = useState('priority')

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

    addTask(
      selectedQuadrant,
      newTask,
      taskCategories ?? [activeCategory || defaultCategory]
    )
    setTaskLimitMessage('')
    setNewTask('')
    setTaskCategories(null)
  }

  const taskTemplates = getPredefinedTasks()
  const availableTasks = Object.entries(tasks).flatMap(
    ([quadrant, quadrantTasks]) =>
      quadrantTasks.map((task) => ({ ...task, quadrant }))
  )
  const visibleSavedTasks = savedTasks.filter((task) => matchesCategory(task))
  const selectedTemplate =
    taskTemplates.find((template) => `template:${template.id}` === selectedTemplateId) ||
    visibleSavedTasks.find((task) => `saved:${task.id}` === selectedTemplateId)

  const handleAddFromTemplate = () => {
    if (!selectedTemplate) return
    const selectedTemplateCategories = selectedTemplateId.startsWith('template:')
      ? getItemCategories(
          {
            workspaceCategories: selectedTemplate.workspaceCategories,
            workspaceCategory: selectedTemplate.workspaceCategory
          },
          'workspaceCategory'
        )
      : getItemCategories(selectedTemplate)
    const templateCategory = normalizeCategorySelection(
      selectedTemplateCategories.length
        ? selectedTemplateCategories
        : [activeCategory || defaultCategory],
      defaultCategory
    )
    const quadrant =
      selectedTemplate.quadrant || selectedQuadrant || 'urgent_important'
    const limitMessage = getTaskLimitMessage(quadrant)
    if (limitMessage) {
      setTaskLimitMessage(limitMessage)
      return
    }

    addTask(quadrant, selectedTemplate.title || selectedTemplate.text, templateCategory)
    setTaskLimitMessage('')
    setTaskCategories(templateCategory)
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

  const handleNestTask = (fromQuadrant, parentQuadrant, parentId, task) => {
    nestTask(fromQuadrant, parentQuadrant, parentId, task)
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
    handleSubtaskPromotion,
    (fromQuadrant, sourceParentId, subtaskId, toQuadrant, targetParentId) =>
      nestSubtask(
        fromQuadrant,
        sourceParentId,
        subtaskId,
        toQuadrant,
        targetParentId
      )
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
          <label>
            Sort tasks
            <select
              value={taskSortMode}
              onChange={(event) => setTaskSortMode(event.target.value)}
              aria-label='Sort tasks'
            >
              <option value='priority'>Priority</option>
              <option value='alphabetical'>A–Z</option>
            </select>
          </label>
        </div>
        <div className='card-b'>
          <TaskForm
            newTask={newTask}
            selectedQuadrant={selectedQuadrant}
            categoriesValue={
              taskCategories ?? [activeCategory || defaultCategory]
            }
            categories={categories}
            defaultCategory={defaultCategory}
            onTaskChange={setNewTask}
            onQuadrantChange={setSelectedQuadrant}
            onCategoryChange={setTaskCategories}
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
              {visibleSavedTasks.length > 0 && (
                <optgroup label='Saved tasks'>
                  {visibleSavedTasks.map((task) => (
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

      <div className='eisenhower-matrix'>
        {quadrants.map((quadrant) => (
          <TaskQuadrant
            key={quadrant.key}
            quadrant={quadrant}
            tasks={tasks[quadrant.key]
              .filter((task) => matchesCategory(task))
              .sort((a, b) => {
                if (taskSortMode === 'alphabetical') {
                  return (a.text || '').localeCompare(b.text || '', undefined, {
                    sensitivity: 'base'
                  })
                }
                const aPriority = Number.isFinite(a.priority)
                  ? a.priority
                  : Number.POSITIVE_INFINITY
                const bPriority = Number.isFinite(b.priority)
                  ? b.priority
                  : Number.POSITIVE_INFINITY
                return aPriority === bPriority ? 0 : aPriority - bPriority
              })}
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
            onMoveTask={handleTaskMove}
            availableTasks={availableTasks}
            onNestTask={handleNestTask}
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
