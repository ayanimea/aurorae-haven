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
  const mockOnModify = vi.fn()
  const mockOnRemove = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    contextMenu: SAMPLE_CONTEXT_MENU,
    onModify: mockOnModify,
    onRemove: mockOnRemove,
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

    it('renders Modify routine menu item', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menuitem', { name: /modify routine/i })).toBeInTheDocument()
    })

    it('renders Remove routine menu item', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      expect(screen.getByRole('menuitem', { name: /remove routine/i })).toBeInTheDocument()
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

  describe('Modify action', () => {
    it('calls onModify with the routine when Modify is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /modify routine/i }))
      expect(mockOnModify).toHaveBeenCalledTimes(1)
      expect(mockOnModify).toHaveBeenCalledWith(SAMPLE_ROUTINE)
    })

    it('calls onClose after Modify is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /modify routine/i }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Remove action', () => {
    it('calls onRemove with the routine when Remove is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /remove routine/i }))
      expect(mockOnRemove).toHaveBeenCalledTimes(1)
      expect(mockOnRemove).toHaveBeenCalledWith(SAMPLE_ROUTINE)
    })

    it('calls onClose after Remove is clicked', () => {
      render(<RoutineContextMenu {...defaultProps} />)
      fireEvent.click(screen.getByRole('menuitem', { name: /remove routine/i }))
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
