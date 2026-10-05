import { act, renderHook } from '@testing-library/react'
import { useSavedTasks } from '../hooks/useSavedTasks'

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
})
