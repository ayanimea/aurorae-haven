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

  it('preserves pending note edits and renames their selected categories', () => {
    vi.useFakeTimers()
    try {
      localStorage.setItem(
        'brainDumpEntries',
        JSON.stringify([
          {
            id: 'note-1',
            title: 'Review',
            content: 'Original',
            category: 'Work',
            workspaceCategories: ['Work']
          }
        ])
      )
      const { result } = renderHook(() => useNotesState())
      act(() => {
        result.current.setTitle('Draft')
        result.current.setContent('Draft content')
        result.current.setAssignedCategories(['Work', 'Personal'])
      })
      const stored = JSON.parse(localStorage.getItem('brainDumpEntries'))
      stored[0].category = 'Projects'
      stored[0].workspaceCategories = ['Projects']
      localStorage.setItem('brainDumpEntries', JSON.stringify(stored))

      act(() => {
        publishCrossTabEvent({
          domain: 'notes',
          action: 'categories-renamed',
          sourceTabId: 'another-tab',
          payload: { oldCategory: 'Work', newCategory: 'Projects' }
        })

        it('preserves pending category edits after a same-tab rename', () => {
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
          act(() => result.current.setAssignedCategories(['Work', 'Personal']))
          const stored = JSON.parse(localStorage.getItem('brainDumpEntries'))
          stored[0].category = 'Projects'
          stored[0].workspaceCategories = ['Projects']
          localStorage.setItem('brainDumpEntries', JSON.stringify(stored))

          act(() => {
            window.dispatchEvent(
              new CustomEvent('aurorae:category-renamed', {
                detail: { oldCategory: 'Work', newCategory: 'Projects' }
              })
            )
          })
          expect(result.current.assignedCategories).toEqual([
            'Projects',
            'Personal'
          ])
        })
      })
      expect(result.current.assignedCategories).toEqual([
        'Projects',
        'Personal'
      ])
      act(() => vi.advanceTimersByTime(500))
      expect(
        JSON.parse(localStorage.getItem('brainDumpEntries'))[0]
      ).toMatchObject({
        title: 'Draft',
        content: 'Draft content',
        category: 'Projects',
        workspaceCategories: ['Projects', 'Personal']
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
