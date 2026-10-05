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
})
