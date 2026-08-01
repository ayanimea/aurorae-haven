/**
 * @vitest-environment jsdom
 *
 * Tests for RoutineContextMenu component
 * Validates the right-click management menu for routine items
 */

import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('../components/common/Icon', () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}))

import RoutineContextMenu from '../components/Routines/RoutineContextMenu'

const SAMPLE_ROUTINE = {
  id: 'routine-1',
  name: 'Morning Routine',
  steps: []
}

const SAMPLE_CONTEXT_MENU = {
  x: 100,
  y: 200,
  routine: SAMPLE_ROUTINE
}

describe('RoutineContextMenu', () => {
  const mockOnEdit = vi.fn()
  const mockOnDuplicate = vi.fn()
  const mockOnSchedule = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    contextMenu: SAMPLE_CONTEXT_MENU,
    onEdit: mockOnEdit,
    onDuplicate: mockOnDuplicate,
    onSchedule: mockOnSchedule,
    onDelete: mockOnDelete,
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders menu when contextMenu is provided', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('renders nothing when contextMenu is null', () => {
      render(<RoutineContextMenu {...defaultProps} contextMenu={null} />)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('positions the menu at the given coordinates', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      const menu = screen.getByRole('menu')
      expect(menu.style.top).toBe('200px')
      expect(menu.style.left).toBe('100px')
    })

    it('renders Edit menu item', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    })

    it('renders Duplicate menu item', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeInTheDocument()
    })

    it('renders Schedule menu item', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menuitem', { name: /schedule/i })).toBeInTheDocument()
    })

    it('renders Delete menu item', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
    })

    it('includes routine name in aria-label', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menu')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Morning Routine')
      )
    })

    it('uses title fallback when routine has no name', () => {
      const ctx = {
        ...SAMPLE_CONTEXT_MENU,
        routine: { id: 'r1', title: 'Evening Wind-Down' }
      }
      render(<RoutineContextMenu {...defaultProps} contextMenu={ctx} />)
      expect(screen.getByRole('menu')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Evening Wind-Down')
      )
    })
  })

  describe('Edit action', () => {
    it('calls onEdit with the routine when Edit is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }))
      expect(mockOnEdit).toHaveBeenCalledTimes(1)
      expect(mockOnEdit).toHaveBeenCalledWith(SAMPLE_ROUTINE)
    })

    it('calls onClose after Edit is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Duplicate action', () => {
    it('calls onDuplicate with the routine when Duplicate is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /duplicate/i }))
      expect(mockOnDuplicate).toHaveBeenCalledTimes(1)
      expect(mockOnDuplicate).toHaveBeenCalledWith(SAMPLE_ROUTINE)
    })

    it('calls onClose after Duplicate is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /duplicate/i }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Schedule action', () => {
    it('calls onSchedule with the routine when Schedule is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /schedule/i }))
      expect(mockOnSchedule).toHaveBeenCalledTimes(1)
      expect(mockOnSchedule).toHaveBeenCalledWith(SAMPLE_ROUTINE)
    })

    it('calls onClose after Schedule is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /schedule/i }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Delete action', () => {
    it('calls onDelete with the routine when Delete is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnDelete).toHaveBeenCalledWith(SAMPLE_ROUTINE)
    })

    it('calls onClose after Delete is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dismiss behaviour', () => {
    it('calls onClose when Escape key is pressed', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking outside the menu', () => {
      render(
        <div>
          <RoutineContextMenu {...defaultProps} />
          <button data-testid='outside'>Outside</button>
        </div>
      )
      fireEvent.mouseDown(screen.getByTestId('outside'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when clicking inside the menu', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.mouseDown(screen.getByRole('menu'))
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })
})
