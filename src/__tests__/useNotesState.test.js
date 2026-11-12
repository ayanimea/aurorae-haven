import { act, renderHook } from '@testing-library/react'
import { useNotesState } from '../hooks/useNotesState'
import { publishCrossTabEvent } from '../utils/crossTabSync'

describe('useNotesState category synchronization', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('refreshes note categories after a rename in another tab', () => {
    localStorage.setItem(
      'brainDumpEntries',
      JSON.stringify([
        {
          id: 'note-1',
          title: 'Review',
          content: '',
          category: 'Work',
          workspaceCategories: ['Work']
        }
      ])
    )
    const { result } = renderHook(() => useNotesState())
    act(() => result.current.loadNote(result.current.notes[0]))
    localStorage.setItem(
      'brainDumpEntries',
      JSON.stringify([
        {
          id: 'note-1',
          title: 'Review',
          content: '',
          category: 'Projects',
          workspaceCategories: ['Projects']
        }
      ])
    )

    act(() => {
      publishCrossTabEvent({
        domain: 'notes',
        action: 'categories-renamed',
        sourceTabId: 'another-tab'
      })
    })

    expect(result.current.notes[0].workspaceCategories).toEqual(['Projects'])
    expect(result.current.assignedCategories).toEqual(['Projects'])
  })
})
