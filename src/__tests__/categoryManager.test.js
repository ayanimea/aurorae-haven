import { vi } from 'vitest'

vi.mock('../utils/indexedDBManager', async (importOriginal) => {
  const indexedDBManager = await importOriginal()
  return {
    ...indexedDBManager,
    isIndexedDBAvailable: () => false
  }
})

import { renameCategory } from '../utils/categoryManager'
import {
  DEFAULT_CATEGORY_STORAGE_KEY,
  getDefaultCategory
} from '../utils/categoryStorage'

describe('category renaming', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renames categories in every local item collection and nested items', async () => {
    localStorage.setItem('aurorae_categories', JSON.stringify(['Uncategorised', 'Work']))
    localStorage.setItem(
      'aurorae_tasks',
      JSON.stringify({
        urgent_important: [
          {
            id: 'task-1',
            category: 'Work',
            subtasks: [{ id: 'subtask-1', category: 'Work' }]
          }
        ]
      })
    )
    localStorage.setItem(
      'aurorae_saved_tasks',
      JSON.stringify([{ id: 'saved-1', category: 'Work' }])
    )
    localStorage.setItem(
      'brainDumpEntries',
      JSON.stringify([{ id: 'note-1', category: 'Work' }])
    )
    localStorage.setItem('tasks', JSON.stringify([{ id: 'task-2', category: 'Work' }]))
    localStorage.setItem(
      'routines',
      JSON.stringify([{ id: 'routine-1', workspaceCategories: ['Work'] }])
    )
    localStorage.setItem(
      'habits',
      JSON.stringify([{ id: 'habit-1', workspaceCategory: 'Work' }])
    )
    localStorage.setItem('dumps', JSON.stringify([{ id: 'note-2', category: 'Work' }]))
    localStorage.setItem('schedule', JSON.stringify([{ id: 'event-1', category: 'Work' }]))
    localStorage.setItem('stats', JSON.stringify([{ id: 'stat-1', workspaceCategory: 'Work' }]))
    localStorage.setItem('templates', JSON.stringify([{ id: 'template-1', workspaceCategory: 'Work' }]))

    await renameCategory('Work', 'Projects')

    expect(JSON.parse(localStorage.getItem('aurorae_tasks')).urgent_important[0]).toMatchObject({
      category: 'Projects',
      subtasks: [{ id: 'subtask-1', category: 'Projects' }]
    })
    for (const key of [
      'aurorae_saved_tasks',
      'brainDumpEntries',
      'tasks',
      'routines',
      'habits',
      'dumps',
      'schedule',
      'stats',
      'templates'
    ]) {
      const item = JSON.parse(localStorage.getItem(key))[0]
      expect(JSON.stringify(item)).toContain('Projects')
      expect(JSON.stringify(item)).not.toContain('"Work"')
    }
  })

  it('allows renaming the default category and updates its stored default', async () => {
    localStorage.setItem(
      'aurorae_tasks',
      JSON.stringify({
        urgent_important: [{ id: 'task-1', category: 'Uncategorised' }]
      })
    )

    await renameCategory('Uncategorised', 'Inbox')

    expect(getDefaultCategory()).toBe('Inbox')
    expect(localStorage.getItem(DEFAULT_CATEGORY_STORAGE_KEY)).toBe('Inbox')
    expect(
      JSON.parse(localStorage.getItem('aurorae_tasks')).urgent_important[0]
        .category
    ).toBe('Inbox')
  })
})
