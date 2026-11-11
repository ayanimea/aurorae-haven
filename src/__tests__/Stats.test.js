import React from 'react'
import { vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Stats from '../pages/Stats'
import { getStatsByType, isIndexedDBAvailable } from '../utils/indexedDBManager'

vi.mock('../hooks/useCrossTabSync', () => ({
  useCrossTabSync: vi.fn()
}))

vi.mock('../utils/indexedDBManager', () => ({
  getStatsByType: vi.fn(),
  isIndexedDBAvailable: vi.fn()
}))

vi.mock('../contexts/CategoryWorkspaceContext', () => ({
  useCategoryWorkspace: () => ({
    matchesCategory: (stat, field) =>
      (stat.workspaceCategories || [stat[field]]).includes('Work')
  })
}))

describe('Stats page category filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isIndexedDBAvailable.mockReturnValue(true)
    getStatsByType.mockImplementation((type) =>
      Promise.resolve(
        type === 'task_completion'
          ? [{ count: 1, workspaceCategories: ['Personal', 'Work'] }]
          : []
      )
    )
  })

  test('matches statistics assigned to multiple workspaces', async () => {
    render(<Stats />)

    await waitFor(() => {
      expect(screen.getByText('Total recorded: 1')).toBeInTheDocument()
    })
  })
})
