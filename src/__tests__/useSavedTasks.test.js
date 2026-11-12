import { act, renderHook } from '@testing-library/react'
import { useSavedTasks } from '../hooks/useSavedTasks'
import { publishCrossTabEvent } from '../utils/crossTabSync'

describe('useSavedTasks', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('preserves every assigned category in a saved task template', () => {
    const { result } = renderHook(() => useSavedTasks())

    act(() => {
      result.current.saveTask({
        text: 'Review roadmap',
        quadrant: 'not_urgent_important',
        category: 'Work',
        workspaceCategories: ['Work', 'Personal']
      })
    })

    expect(result.current.savedTasks[0]).toMatchObject({
      category: 'Work',
      workspaceCategories: ['Work', 'Personal']
    })
  })

  it('refreshes saved tasks after a category rename in another tab', () => {
    localStorage.setItem(
      'aurorae_saved_tasks',
      JSON.stringify([
        {
          id: 'saved-1',
          text: 'Review roadmap',
          quadrant: 'not_urgent_important',
          category: 'Work',
          workspaceCategories: ['Work']
        }
      ])
    )
    const { result } = renderHook(() => useSavedTasks())
    localStorage.setItem(
      'aurorae_saved_tasks',
      JSON.stringify([
        {
          id: 'saved-1',
          text: 'Review roadmap',
          quadrant: 'not_urgent_important',
          category: 'Projects',
          workspaceCategories: ['Projects']
        }
      ])
    )

    act(() => {
      publishCrossTabEvent({
        domain: 'savedTasks',
        action: 'categories-renamed',
        sourceTabId: 'another-tab'
      })
    })

    expect(result.current.savedTasks[0].workspaceCategories).toEqual([
      'Projects'
    ])
  })
})
