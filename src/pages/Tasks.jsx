import React, { useState } from 'react'
import { useTasksState } from '../hooks/useTasksState'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import TaskForm from '../components/Tasks/TaskForm'
import TaskQuadrant from '../components/Tasks/TaskQuadrant'

function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, editTask, moveTask } =
    useTasksState()

  // Form state
  const [newTask, setNewTask] = useState('')
  const [selectedQuadrant, setSelectedQuadrant] = useState('urgent_important')

  // Editing state
  const [editingTask, setEditingTask] = useState(null)
  const [editText, setEditText] = useState('')

  // Drag and drop
  const { handleDragStart, handleDragOver, handleDrop } =
    useDragAndDrop(moveTask)

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    addTask(selectedQuadrant, newTask)
    setNewTask('')
  }

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
        </div>
        <div className='card-b'>
          <TaskForm
            newTask={newTask}
            selectedQuadrant={selectedQuadrant}
            onTaskChange={setNewTask}
            onQuadrantChange={setSelectedQuadrant}
            onSubmit={handleAddTask}
          />
        </div>
      </div>

      <div className='eisenhower-matrix'>
        {quadrants.map((quadrant) => (
          <TaskQuadrant
            key={quadrant.key}
            quadrant={quadrant}
            tasks={tasks[quadrant.key]}
            editingTask={editingTask}
            editText={editText}
            onToggle={toggleTask}
            onEdit={startEditTask}
            onEditTextChange={setEditText}
            onSaveEdit={saveEditTask}
            onCancelEdit={cancelEditTask}
            onDelete={deleteTask}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <div className='tasks-info'>
        <p className='small'>
          <strong>Tip:</strong> Drag tasks between quadrants to reorganize them.
          The Eisenhower Matrix helps prioritize tasks by urgency and
          importance.
        </p>
      </div>
    </div>
  )
}

export default Tasks
