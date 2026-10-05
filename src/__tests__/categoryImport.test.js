import { normalizeImportedCategories } from '../utils/categoryImport'

describe('legacy category import', () => {
  it('assigns Unassigned to older tasks, subtasks, and notes without categories', () => {
    const imported = normalizeImportedCategories({
      tasks: [
        {
          id: 'task-1',
          text: 'Parent',
          subtasks: [{ id: 'subtask-1', text: 'Child' }]
        }
      ],
      dumps: [{ id: 'note-1', title: 'Note' }]
    })

    expect(imported.tasks[0].workspaceCategories).toEqual(['Unassigned'])
    expect(imported.tasks[0].subtasks[0].workspaceCategories).toEqual([
      'Unassigned'
    ])
    expect(imported.dumps[0].workspaceCategories).toEqual(['Unassigned'])
    expect(imported.categories).toContain('Unassigned')
  })

  it('preserves multiple categories and discovers missing category definitions', () => {
    const imported = normalizeImportedCategories({
      tasks: [
        {
          id: 'task-1',
          category: 'Work',
          workspaceCategories: ['Work', 'Personal']
        }
      ]
    })

    expect(imported.tasks[0].workspaceCategories).toEqual(['Work', 'Personal'])
    expect(imported.categories).toEqual(['Work', 'Personal'])
  })

  it('discovers categories only from workspace fields for each entity type', () => {
    const imported = normalizeImportedCategories({
      categories: ['Work'],
      habits: [
        { id: 'habit-1', category: 'green', workspaceCategory: 'Health' }
      ],
      templates: [{ id: 'template-1', category: 'morning' }],
      tasks: [{ id: 'task-1', category: 'Focus' }]
    })

    expect(imported.categories).toEqual(
      expect.arrayContaining(['Work', 'Health', 'Focus'])
    )
    expect(imported.categories).not.toContain('green')
    expect(imported.categories).not.toContain('morning')
  })
})
