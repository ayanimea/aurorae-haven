import {
  CATEGORY_THEME_TEMPLATES,
  loadCategoryThemes,
  normalizeCategoryThemes,
  renameCategoryTheme,
  saveCategoryThemes
} from '../utils/categoryThemes'

describe('category themes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides all requested built-in themes and a default', () => {
    expect(CATEGORY_THEME_TEMPLATES.map(({ name }) => name)).toEqual([
      'Default color scheme',
      'Red Nebula',
      'Green Aurora',
      'Yellow Quasar',
      'Black Planetary Nebula',
      'White/Purple Galaxy',
      'Black/White Clusters of Galaxies'
    ])
  })

  it('persists only valid non-default category theme IDs', () => {
    saveCategoryThemes({
      Work: 'red-nebula',
      Personal: 'default',
      Unknown: 'not-a-theme'
    })

    expect(loadCategoryThemes()).toEqual({ Work: 'red-nebula' })
  })

  it('moves an assignment when its category is renamed', () => {
    expect(
      renameCategoryTheme({ Work: 'green-aurora' }, 'work', 'Career')
    ).toEqual({ Career: 'green-aurora' })
  })

  it('safely ignores malformed assignments', () => {
    expect(normalizeCategoryThemes(['red-nebula'])).toEqual({})
    expect(normalizeCategoryThemes({ '  ': 'red-nebula' })).toEqual({})
  })
})
