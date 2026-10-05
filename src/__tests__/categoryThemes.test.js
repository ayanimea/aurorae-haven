import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  CATEGORY_THEME_TEMPLATES,
  loadCategoryThemes,
  normalizeCategoryThemes,
  renameCategoryTheme,
  saveCategoryThemes
} from '../utils/categoryThemes'
import { saveCategories } from '../utils/categoryStorage'
import {
  CategoryWorkspaceProvider,
  useCategoryWorkspace
} from '../contexts/CategoryWorkspaceContext'

function WorkspaceThemeHarness() {
  const { setActiveCategory, setCategoryTheme, categoryThemes } =
    useCategoryWorkspace()
  return React.createElement(
    'div',
    null,
    React.createElement(
      'output',
      null,
      categoryThemes.Career ? `Career: ${categoryThemes.Career}` : ''
    ),
    React.createElement(
      'button',
      { onClick: () => setActiveCategory('Work') },
      'Work'
    ),
    React.createElement(
      'button',
      { onClick: () => setCategoryTheme('Work', 'red-nebula') },
      'Apply theme'
    ),
    React.createElement(
      'button',
      { onClick: () => setActiveCategory(null) },
      'All'
    )
  )
}

describe('category themes', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.categoryTheme
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

  it('applies the selected category theme and restores the default for All', async () => {
    saveCategories(['Uncategorised', 'Work'])
    render(
      React.createElement(
        CategoryWorkspaceProvider,
        null,
        React.createElement(WorkspaceThemeHarness)
      )
    )

    fireEvent.click(screen.getByRole('button', { name: 'Work' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply theme' }))
    await waitFor(() => {
      expect(document.documentElement.dataset.categoryTheme).toBe('red-nebula')
    })

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => {
      expect(document.documentElement.dataset.categoryTheme).toBeUndefined()
    })
  })

  it('refreshes theme assignments when another category is renamed', async () => {
    saveCategories(['Uncategorised', 'Work'])
    saveCategoryThemes({ Work: 'green-aurora' })
    render(
      React.createElement(
        CategoryWorkspaceProvider,
        null,
        React.createElement(WorkspaceThemeHarness)
      )
    )

    saveCategoryThemes({ Career: 'green-aurora' })
    window.dispatchEvent(
      new CustomEvent('aurorae:category-renamed', {
        detail: { oldCategory: 'Work', newCategory: 'Career' }
      })
    )

    await waitFor(() => {
      expect(screen.getByText('Career: green-aurora')).toBeInTheDocument()
    })
  })
})
