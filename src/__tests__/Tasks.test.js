import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Tasks from '../pages/Tasks'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const createTask = (id, category) => ({
  id,
  text: id,
  category,
  completed: false,
  subtasks: []
})

describe('Tasks Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('renders Tasks component', () => {
    render(<Tasks />)
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  test('renders all four quadrants', () => {
    render(<Tasks />)
    const quadrantHeaders = screen.getAllByText('Urgent & Important')
    expect(quadrantHeaders.length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Not Urgent & Important').length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Urgent & Not Important').length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Not Urgent & Not Important').length
    ).toBeGreaterThan(0)
  })

  test('displays quadrant subtitles', () => {
    render(<Tasks />)
    expect(screen.getByText('Do First')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Delegate')).toBeInTheDocument()
    expect(screen.getByText('Eliminate')).toBeInTheDocument()
  })

  test('adds a new task to selected quadrant', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Test task' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Test task')).toBeInTheDocument()
    })
  })

  test('does not create a category while creating a task', async () => {
    render(<Tasks />)

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Uncategorized task' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    await waitFor(() => {
      expect(screen.getByText('Uncategorized task')).toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem('aurorae_categories'))).toEqual([])
    })
  })

  test('does not add empty task', () => {
    render(<Tasks />)

    const addButton = screen.getByText('Add Task')
    const initialEmptyStates = screen.getAllByText('No tasks in this quadrant')

    fireEvent.click(addButton)

    const finalEmptyStates = screen.getAllByText('No tasks in this quadrant')
    expect(finalEmptyStates.length).toBe(initialEmptyStates.length)
  })

  test('limits urgent and important tasks to four across categories', async () => {
    localStorage.setItem('aurorae_categories', JSON.stringify(['Work', 'Personal']))
    localStorage.setItem(
      'aurorae_tasks',
      JSON.stringify({
        urgent_important: [
          createTask('Work task 1', 'Work'),
          createTask('Work task 2', 'Work'),
          createTask('Personal task 1', 'Personal'),
          createTask('Personal task 2', 'Personal')
        ],
        not_urgent_important: [],
        urgent_not_important: [],
        not_urgent_not_important: []
      })
    )
    render(<Tasks />)

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Fifth important task' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    expect(
      screen.getByText('You can have at most 4 Urgent & Important tasks.')
    ).toHaveAttribute('role', 'status')
    expect(JSON.parse(localStorage.getItem('aurorae_tasks')).urgent_important)
      .toHaveLength(4)
  })

  test('limits important tasks to ten across categories and quadrants', () => {
    localStorage.setItem('aurorae_categories', JSON.stringify(['Work', 'Personal']))
    localStorage.setItem(
      'aurorae_tasks',
      JSON.stringify({
        urgent_important: [
          createTask('Urgent Work 1', 'Work'),
          createTask('Urgent Work 2', 'Work'),
          createTask('Urgent Personal 1', 'Personal'),
          createTask('Urgent Personal 2', 'Personal')
        ],
        not_urgent_important: [
          createTask('Scheduled Work 1', 'Work'),
          createTask('Scheduled Work 2', 'Work'),
          createTask('Scheduled Work 3', 'Work'),
          createTask('Scheduled Personal 1', 'Personal'),
          createTask('Scheduled Personal 2', 'Personal'),
          createTask('Scheduled Personal 3', 'Personal')
        ],
        urgent_not_important: [],
        not_urgent_not_important: []
      })
    )
    render(<Tasks />)

    fireEvent.change(screen.getByLabelText('Select quadrant'), {
      target: { value: 'not_urgent_important' }
    })
    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Eleventh important task' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    expect(
      screen.getByText('You can have at most 10 Important tasks across all categories.')
    ).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('aurorae_tasks')).not_urgent_important)
      .toHaveLength(6)
  })

  test('limits urgent tasks to ten across categories and quadrants', () => {
    localStorage.setItem('aurorae_categories', JSON.stringify(['Work', 'Personal']))
    localStorage.setItem(
      'aurorae_tasks',
      JSON.stringify({
        urgent_important: [
          createTask('Urgent Important 1', 'Work'),
          createTask('Urgent Important 2', 'Work'),
          createTask('Urgent Important 3', 'Personal'),
          createTask('Urgent Important 4', 'Personal')
        ],
        not_urgent_important: [],
        urgent_not_important: [
          createTask('Urgent Delegate 1', 'Work'),
          createTask('Urgent Delegate 2', 'Work'),
          createTask('Urgent Delegate 3', 'Work'),
          createTask('Urgent Delegate 4', 'Personal'),
          createTask('Urgent Delegate 5', 'Personal'),
          createTask('Urgent Delegate 6', 'Personal')
        ],
        not_urgent_not_important: []
      })
    )
    render(<Tasks />)

    fireEvent.change(screen.getByLabelText('Select quadrant'), {
      target: { value: 'urgent_not_important' }
    })
    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Eleventh urgent task' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    expect(
      screen.getByText('You can have at most 10 Urgent tasks across all categories.')
    ).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('aurorae_tasks')).urgent_not_important)
      .toHaveLength(6)
  })

  test('prevents moving a task into a full quadrant', () => {
    localStorage.setItem(
      'aurorae_tasks',
      JSON.stringify({
        urgent_important: [
          createTask('Urgent task 1', ''),
          createTask('Urgent task 2', ''),
          createTask('Urgent task 3', ''),
          createTask('Urgent task 4', '')
        ],
        not_urgent_important: [createTask('Scheduled task', '')],
        urgent_not_important: [],
        not_urgent_not_important: []
      })
    )
    const { container } = render(<Tasks />)
    const taskCards = container.querySelectorAll('.task-item')
    const targetQuadrant = container.querySelector('.matrix-quadrant')

    fireEvent.dragStart(taskCards[4])
    fireEvent.dragOver(targetQuadrant)
    fireEvent.drop(targetQuadrant)

    expect(
      screen.getByText('You can have at most 4 Urgent & Important tasks.')
    ).toBeInTheDocument()
    const savedTasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
    expect(savedTasks.urgent_important).toHaveLength(4)
    expect(savedTasks.not_urgent_important).toHaveLength(1)
  })

  test('can change quadrant selection', () => {
    render(<Tasks />)

    const select = screen.getByLabelText('Select quadrant')
    fireEvent.change(select, { target: { value: 'not_urgent_important' } })

    expect(select.value).toBe('not_urgent_important')
  })

  test('can create and complete subtasks', async () => {
    render(<Tasks />)

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Parent task' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    fireEvent.click(
      screen.getByRole('button', { name: 'More actions for task "Parent task"' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add subtask to Parent task' }))
    const subtaskInput = screen.getByRole('textbox', {
      name: 'New subtask for Parent task'
    })
    fireEvent.change(subtaskInput, { target: { value: 'Child task' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save subtask' }))

    const checkbox = await screen.findByRole('checkbox', {
      name: 'Mark "Child task" as complete'
    })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'Mark "Child task" as incomplete' })
      ).toBeChecked()
      const savedTask = JSON.parse(localStorage.getItem('aurorae_tasks'))
        .urgent_important[0]
      expect(savedTask.subtasks[0].text).toBe('Child task')
      expect(savedTask.subtasks[0].completed).toBe(true)
    })
  })

  test('category tabs filter tasks in each Eisenhower quadrant', async () => {
    localStorage.setItem('aurorae_categories', JSON.stringify(['Work']))
    render(<Tasks />)

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Work task' }
    })
    fireEvent.change(screen.getByLabelText('Select category'), {
      target: { value: 'Work' }
    })
    fireEvent.click(screen.getByText('Add Task'))
    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Uncategorized task' }
    })
    fireEvent.change(screen.getByLabelText('Select category'), {
      target: { value: '' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    fireEvent.click(screen.getByRole('tab', { name: 'Work' }))
    expect(screen.getByText('Work task')).toBeInTheDocument()
    expect(screen.queryByText('Uncategorized task')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'All' }))
    expect(screen.getByText('Work task')).toBeInTheDocument()
    expect(screen.getByText('Uncategorized task')).toBeInTheDocument()
  })

  test('assigns an existing category to a task after creation', async () => {
    localStorage.setItem('aurorae_categories', JSON.stringify(['Work']))
    render(<Tasks />)

    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Categorize later' }
    })
    fireEvent.click(screen.getByText('Add Task'))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'More actions for task "Categorize later"'
      })
    )
    fireEvent.change(
      screen.getByRole('combobox', {
        name: 'Category for task "Categorize later"'
      }),
      { target: { value: 'Work' } }
    )

    await waitFor(() => {
      const task = JSON.parse(localStorage.getItem('aurorae_tasks'))
        .urgent_important[0]
      expect(task.category).toBe('Work')
    })
    expect(
      screen.queryByRole('button', { name: 'Add category' })
    ).not.toBeInTheDocument()
  })

  test('dropping a task onto a subtask makes it a sibling subtask', async () => {
    const { container } = render(<Tasks />)
    const taskInput = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(taskInput, { target: { value: 'Parent task' } })
    fireEvent.click(screen.getByText('Add Task'))
    fireEvent.click(
      screen.getByRole('button', { name: 'More actions for task "Parent task"' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add subtask to Parent task' }))
    fireEvent.change(
      screen.getByRole('textbox', { name: 'New subtask for Parent task' }),
      { target: { value: 'Existing subtask' } }
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save subtask' }))

    fireEvent.change(taskInput, { target: { value: 'Dropped task' } })
    fireEvent.click(screen.getByText('Add Task'))

    const taskCards = container.querySelectorAll('.task-item')
    const subtask = container.querySelector('.task-subtask')
    fireEvent.dragStart(taskCards[1])
    fireEvent.dragOver(subtask)
    fireEvent.drop(subtask)

    await waitFor(() => {
      const tasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(tasks.urgent_important).toHaveLength(1)
      expect(tasks.urgent_important[0].subtasks.map((item) => item.text)).toEqual(
        ['Existing subtask', 'Dropped task']
      )
    })
  })

  test('dragging a subtask into another quadrant promotes it to a task', async () => {
    const { container } = render(<Tasks />)
    const taskInput = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(taskInput, { target: { value: 'Parent task' } })
    fireEvent.click(screen.getByText('Add Task'))
    fireEvent.click(
      screen.getByRole('button', { name: 'More actions for task "Parent task"' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add subtask to Parent task' }))
    fireEvent.change(
      screen.getByRole('textbox', { name: 'New subtask for Parent task' }),
      { target: { value: 'Promoted subtask' } }
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save subtask' }))

    const subtask = container.querySelector('.task-subtask')
    const targetQuadrant = container.querySelectorAll('.matrix-quadrant')[1]
    fireEvent.dragStart(subtask)
    fireEvent.dragOver(targetQuadrant)
    fireEvent.drop(targetQuadrant)

    await waitFor(() => {
      const tasks = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(tasks.urgent_important[0].subtasks).toHaveLength(0)
      expect(tasks.not_urgent_important[0].text).toBe('Promoted subtask')
      expect(tasks.not_urgent_important[0].subtasks).toEqual([])
    })
  })

  test('dragging a task onto another nests and removes it from its quadrant', async () => {
    const { container } = render(<Tasks />)
    const taskInput = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(taskInput, { target: { value: 'Parent task' } })
    fireEvent.click(screen.getByText('Add Task'))
    fireEvent.change(taskInput, { target: { value: 'Child task' } })
    fireEvent.change(screen.getByLabelText('Select quadrant'), {
      target: { value: 'not_urgent_important' }
    })
    fireEvent.click(screen.getByText('Add Task'))

    const taskCards = container.querySelectorAll('.task-item')
    fireEvent.dragStart(taskCards[1])
    fireEvent.dragOver(taskCards[0])
    fireEvent.drop(taskCards[0])

    await waitFor(() => {
      expect(screen.getByText('Child task')).toBeInTheDocument()
      const saved = JSON.parse(localStorage.getItem('aurorae_tasks'))
      expect(saved.not_urgent_important).toHaveLength(0)
      expect(saved.urgent_important[0].subtasks[0].text).toBe('Child task')
    })
  })

  test('saves a task for reuse and adds it from saved tasks', async () => {
    const { container } = render(<Tasks />)
    const taskInput = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(taskInput, { target: { value: 'Recurring task' } })
    fireEvent.click(screen.getByText('Add Task'))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Save task "Recurring task" for later'
      })
    )

    fireEvent.change(screen.getByLabelText('Add task from template:'), {
      target: { value: `saved:${JSON.parse(localStorage.getItem('aurorae_saved_tasks'))[0].id}` }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    await waitFor(() => {
      expect(
        container.querySelectorAll('.task-item .task-text')
      ).toHaveLength(2)
      expect(JSON.parse(localStorage.getItem('aurorae_tasks')).urgent_important)
        .toHaveLength(2)
    })
  })

  test('adds a built-in task template', async () => {
    const { container } = render(<Tasks />)
    fireEvent.change(screen.getByLabelText('Add task from template:'), {
      target: { value: 'template:task-water-plants' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    await waitFor(() => {
      expect(
        container.querySelector('.task-item .task-text')
      ).toHaveTextContent('Water Indoor Plants')
      expect(JSON.parse(localStorage.getItem('aurorae_categories'))).toEqual([])
    })
  })

  test('uses note categories in the shared task tabs and form', () => {
    localStorage.setItem(
      'brainDumpEntries',
      JSON.stringify([{ id: 'note-1', category: 'Personal' }])
    )
    render(<Tasks />)

    expect(screen.getByRole('tab', { name: 'Personal' })).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Personal' })
    ).toBeInTheDocument()
  })

  test('toggles task completion', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Complete me' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const checkbox = screen.getByLabelText('Mark "Complete me" as complete')
      expect(checkbox).not.toBeChecked()

      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })
  })

  test('deletes a task', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Delete me' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Delete me')).toBeInTheDocument()
    })

    const deleteButton = screen.getByLabelText('Delete task "Delete me"')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
    })
  })

  test('persists tasks to localStorage', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Persistent task' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const savedData = localStorage.getItem('aurorae_tasks')
      expect(savedData).toBeTruthy()

      const parsed = JSON.parse(savedData)
      expect(parsed.urgent_important).toHaveLength(1)
      expect(parsed.urgent_important[0].text).toBe('Persistent task')
    })
  })

  test('loads tasks from localStorage on mount', () => {
    const mockTasks = {
      urgent_important: [
        {
          id: 'test-uuid-1',
          text: 'Loaded task',
          completed: false,
          createdAt: Date.now()
        }
      ],
      not_urgent_important: [],
      urgent_not_important: [],
      not_urgent_not_important: []
    }

    localStorage.setItem('aurorae_tasks', JSON.stringify(mockTasks))

    render(<Tasks />)

    expect(screen.getByText('Loaded task')).toBeInTheDocument()
  })

  test('displays empty state for quadrants with no tasks', () => {
    render(<Tasks />)

    const emptyStates = screen.getAllByText('No tasks in this quadrant')
    expect(emptyStates.length).toBe(4) // All quadrants empty initially
  })

  test('displays tip information', () => {
    const { container } = render(<Tasks />)

    const infoText = container.textContent
    expect(infoText).toMatch(/Drag tasks between quadrants/i)
    expect(infoText).toMatch(/Eisenhower Matrix/i)
  })

  test('adds task with Enter key', async () => {
    const { container } = render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const form = container.querySelector('form')

    fireEvent.change(input, { target: { value: 'Enter key task' } })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Enter key task')).toBeInTheDocument()
    })
  })

  test('clears input after adding task', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Clear input test' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  test('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('aurorae_tasks', 'invalid json')

    // Should render without crashing
    const { container } = render(<Tasks />)
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  test('task items have draggable attribute', async () => {
    const { container } = render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Draggable task' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const taskItem = container.querySelector('.task-item')
      expect(taskItem).toHaveAttribute('draggable')
    })
  })

  // Tests for inline editing functionality
  test('can enter edit mode by clicking edit button', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Editable task' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Editable task"')
      fireEvent.click(editButton)

      // Should show edit input
      const editInput = screen.getByDisplayValue('Editable task')
      expect(editInput).toBeInTheDocument()
    })
  })

  test('can save edited task', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Original text' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Original text"')
      fireEvent.click(editButton)
    })

    const editInput = screen.getByDisplayValue('Original text')
    fireEvent.change(editInput, { target: { value: 'Updated text' } })

    const saveButton = screen.getByLabelText('Save task')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Updated text')).toBeInTheDocument()
      expect(screen.queryByText('Original text')).not.toBeInTheDocument()
    })
  })

  test('can cancel editing', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Unchanged task' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Unchanged task"')
      fireEvent.click(editButton)
    })

    const editInput = screen.getByDisplayValue('Unchanged task')
    fireEvent.change(editInput, { target: { value: 'Modified text' } })

    const cancelButton = screen.getByLabelText('Cancel editing')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('Unchanged task')).toBeInTheDocument()
      expect(screen.queryByText('Modified text')).not.toBeInTheDocument()
    })
  })

  test('can save edit with Enter key', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Keyboard edit' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Keyboard edit"')
      fireEvent.click(editButton)
    })

    const editInput = screen.getByDisplayValue('Keyboard edit')
    fireEvent.change(editInput, { target: { value: 'Updated via Enter' } })
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Updated via Enter')).toBeInTheDocument()
    })
  })

  test('can cancel edit with Escape key', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Escape test' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Escape test"')
      fireEvent.click(editButton)
    })

    const editInput = screen.getByDisplayValue('Escape test')
    fireEvent.change(editInput, { target: { value: 'Should not save' } })
    fireEvent.keyDown(editInput, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.getByText('Escape test')).toBeInTheDocument()
      expect(screen.queryByText('Should not save')).not.toBeInTheDocument()
    })
  })

  test('checkbox disabled during edit mode', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Checkbox test' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Checkbox test"')
      fireEvent.click(editButton)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })
  })

  test('drag functionality disabled during edit mode', async () => {
    const { container } = render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Drag test' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Drag test"')
      fireEvent.click(editButton)

      const taskItem = container.querySelector('.task-item')
      expect(taskItem).toHaveAttribute('draggable', 'false')
    })
  })

  test('can enter edit mode by double-clicking task text', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Double click me' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const taskText = screen.getByText('Double click me')
      fireEvent.doubleClick(taskText)

      // Should show edit input
      const editInput = screen.getByDisplayValue('Double click me')
      expect(editInput).toBeInTheDocument()
    })
  })

  // Test for focus management
  test('edit input receives focus when edit mode starts', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Focus test' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Focus test"')
      fireEvent.click(editButton)
    })

    await waitFor(() => {
      const editInput = screen.getByDisplayValue('Focus test')
      expect(editInput).toHaveFocus()
    })
  })

  // Test for empty edit cancellation
  test('cancels edit if text is empty when saving', async () => {
    render(<Tasks />)

    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Delete all text' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit task "Delete all text"')
      fireEvent.click(editButton)
    })

    const editInput = screen.getByDisplayValue('Delete all text')
    fireEvent.change(editInput, { target: { value: '   ' } }) // Whitespace only

    const saveButton = screen.getByLabelText('Save task')
    fireEvent.click(saveButton)

    await waitFor(() => {
      // Original text should remain since whitespace-only text was rejected
      expect(screen.getByText('Delete all text')).toBeInTheDocument()
      // Edit mode should be cancelled
      expect(screen.queryByLabelText('Save task')).not.toBeInTheDocument()
    })
  })
})
