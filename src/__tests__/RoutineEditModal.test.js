/**
 * @vitest-environment jsdom
 *
 * Tests for RoutineEditModal component
 * Validates the editing workflow for existing routines
 */

import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Modal component
vi.mock('../components/common/Modal', () => ({
  default: function MockModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null
    return (
      <div data-testid='modal'>
        <h2>{title}</h2>
        <button data-testid='modal-close' onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    )
  }
}))

// Mock RoutineEditor component
const mockRoutineEditorSave = vi.fn()
vi.mock('../components/Routines/RoutineEditor', () => ({
  default: function MockRoutineEditor({ routine, onSave, onCancel, isSaving }) {
    return (
      <div data-testid='routine-editor'>
        <span data-testid='editor-routine-name'>{routine?.name}</span>
        <span data-testid='editor-saving'>{isSaving ? 'saving' : 'idle'}</span>
        <button
          data-testid='editor-save'
          onClick={() =>
            onSave({
              id: routine?.id,
              name: routine?.name || 'Updated Routine',
              steps: routine?.steps || [],
              tags: routine?.tags || []
            })
          }
        >
          Save
        </button>
        <button data-testid='editor-cancel' onClick={onCancel}>
          Cancel
        </button>
      </div>
    )
  }
}))

import RoutineEditModal from '../components/Routines/RoutineEditModal'

const SAMPLE_ROUTINE = {
  id: 'routine-1',
  name: 'Morning Routine',
  tags: ['morning'],
  steps: [{ label: 'Stretch', duration: 300 }]
}

describe('RoutineEditModal', () => {
  const mockOnClose = vi.fn()
  const mockOnUpdateRoutine = vi.fn()

  const defaultProps = {
    isOpen: true,
    routine: SAMPLE_ROUTINE,
    onClose: mockOnClose,
    onUpdateRoutine: mockOnUpdateRoutine
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnUpdateRoutine.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('renders modal with "Edit Routine" title when isOpen is true', () => {
      render(<RoutineEditModal {...defaultProps} />)
      expect(screen.getByText('Edit Routine')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<RoutineEditModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('renders RoutineEditor with the provided routine data', () => {
      render(<RoutineEditModal {...defaultProps} />)
      expect(screen.getByTestId('routine-editor')).toBeInTheDocument()
      expect(screen.getByTestId('editor-routine-name').textContent).toBe(
        'Morning Routine'
      )
    })

    it('does not render RoutineEditor when routine is null', () => {
      render(<RoutineEditModal {...defaultProps} routine={null} />)
      expect(screen.queryByTestId('routine-editor')).not.toBeInTheDocument()
    })
  })

  describe('Save flow', () => {
    it('calls onUpdateRoutine with updated routine data when saved', async () => {
      render(<RoutineEditModal {...defaultProps} />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('editor-save'))
      })

      expect(mockOnUpdateRoutine).toHaveBeenCalledTimes(1)
      expect(mockOnUpdateRoutine).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'routine-1', name: 'Morning Routine' })
      )
    })

    it('calls onClose after successful save', async () => {
      render(<RoutineEditModal {...defaultProps} />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('editor-save'))
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('shows saving state while onUpdateRoutine is in progress', async () => {
      let resolveUpdate
      mockOnUpdateRoutine.mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )

      render(<RoutineEditModal {...defaultProps} />)

      act(() => {
        fireEvent.click(screen.getByTestId('editor-save'))
      })

      // isSaving should be true while the promise is pending
      expect(screen.getByTestId('editor-saving').textContent).toBe('saving')

      await act(async () => {
        resolveUpdate()
      })

      expect(screen.getByTestId('editor-saving').textContent).toBe('idle')
    })

    it('does not call onClose when onUpdateRoutine throws', async () => {
      mockOnUpdateRoutine.mockRejectedValue(new Error('Save failed'))

      render(<RoutineEditModal {...defaultProps} />)

      await act(async () => {
        fireEvent.click(screen.getByTestId('editor-save'))
      })

      await waitFor(() => {
        expect(mockOnUpdateRoutine).toHaveBeenCalledTimes(1)
      })

      // onClose must NOT have been called because save failed
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Cancel flow', () => {
    it('calls onClose when cancel is triggered from editor', () => {
      render(<RoutineEditModal {...defaultProps} />)

      fireEvent.click(screen.getByTestId('editor-cancel'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnUpdateRoutine).not.toHaveBeenCalled()
    })

    it('calls onClose when modal close button is clicked', () => {
      render(<RoutineEditModal {...defaultProps} />)

      fireEvent.click(screen.getByTestId('modal-close'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})
