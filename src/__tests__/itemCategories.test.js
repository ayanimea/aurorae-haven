import {
  assignItemCategories,
  getItemCategories,
  matchesItemCategories,
  normalizeCategorySelection
} from '../utils/itemCategories'

describe('item category assignment', () => {
  const defaultCategory = 'Uncategorised'

  it('supports several named categories on one item', () => {
    const item = assignItemCategories(
      { id: 'task-1' },
      ['Work', 'Personal', 'Work'],
      defaultCategory
    )

    expect(item.workspaceCategories).toEqual(['Work', 'Personal'])
    expect(item.category).toBe('Work')
  })

  it('keeps the default category exclusive, including imported Unassigned', () => {
    expect(
      normalizeCategorySelection(
        ['Work', 'Unassigned', 'Personal'],
        defaultCategory
      )
    ).toEqual([defaultCategory])
    expect(
      normalizeCategorySelection([defaultCategory, 'Work'], defaultCategory)
    ).toEqual([defaultCategory])
  })

  it('falls back to legacy category fields when newer arrays are empty', () => {
    expect(
      getItemCategories({
        workspaceCategories: [],
        category: 'Personal'
      })
    ).toEqual(['Personal'])
  })

  it('shows unassigned items in every category workspace', () => {
    const importedItem = { workspaceCategories: ['Unassigned'] }

    expect(
      matchesItemCategories(importedItem, 'Work', defaultCategory)
    ).toBe(true)
    expect(
      matchesItemCategories(importedItem, defaultCategory, defaultCategory)
    ).toBe(true)
  })

  it('matches an item with multiple assigned categories', () => {
    const item = { workspaceCategories: ['Work', 'Personal'] }

    expect(matchesItemCategories(item, 'Work', defaultCategory)).toBe(true)
    expect(matchesItemCategories(item, 'Personal', defaultCategory)).toBe(true)
    expect(matchesItemCategories(item, 'Health', defaultCategory)).toBe(false)
  })
})
