/**
 * Tests for ConfirmDialog component
 * Validates rendering, ARIA attributes, button actions, keyboard navigation,
 * and capture-phase Escape handling for nested modal scenarios
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConfirmDialog from '../components/common/ConfirmDialog'

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn()
  const mockOnCancel = jest.fn()

  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />)
      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(
        screen.getByText('Are you sure you want to proceed?')
      ).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
    })

    it('renders custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText='Delete'
          cancelText='Keep'
        />
      )
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Keep')).toBeInTheDocument()
    })

    it('renders default button text', () => {
      render(<ConfirmDialog {...defaultProps} />)
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('applies danger styling when confirmDanger is true', () => {
      render(<ConfirmDialog {...defaultProps} confirmDanger={true} />)
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toHaveClass('button-danger')
    })

    it('applies primary styling when confirmDanger is false', () => {
      render(<ConfirmDialog {...defaultProps} confirmDanger={false} />)
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toHaveClass('button-primary')
    })
  })

  describe('Accessibility - ARIA', () => {
    it('has proper dialog role', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('has aria-modal="true"', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute(
        'aria-labelledby',
        'confirm-dialog-title'
      )
      const title = screen.getByText('Confirm Action')
      expect(title).toHaveAttribute('id', 'confirm-dialog-title')
    })

    it('has aria-describedby pointing to message', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute(
        'aria-describedby',
        'confirm-dialog-message'
      )
      const message = screen.getByText('Are you sure you want to proceed?')
      expect(message).toHaveAttribute('id', 'confirm-dialog-message')
    })

    it('has aria-label on confirm button', () => {
      render(
        <ConfirmDialog {...defaultProps} confirmText='Delete Forever' />
      )
      const confirmButton = screen.getByRole('button', {
        name: 'Delete Forever'
      })
      expect(confirmButton).toHaveAttribute('aria-label', 'Delete Forever')
    })

    it('has aria-label on cancel button', () => {
      render(<ConfirmDialog {...defaultProps} cancelText='Go Back' />)
      const cancelButton = screen.getByRole('button', { name: 'Go Back' })
      expect(cancelButton).toHaveAttribute('aria-label', 'Go Back')
    })
  })

  describe('Button Actions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('calls onCancel when cancel button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })

    it('calls onCancel when backdrop is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const backdrop = screen.getByRole('presentation')
      fireEvent.click(backdrop)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })

    it('does not call onCancel when clicking inside dialog container', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      fireEvent.click(dialog)
      expect(mockOnCancel).not.toHaveBeenCalled()
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  describe('Focus Management', () => {
    it('focuses cancel button when dialog opens', async () => {
      const { rerender } = render(
        <ConfirmDialog {...defaultProps} isOpen={false} />
      )
      rerender(<ConfirmDialog {...defaultProps} isOpen={true} />)

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).toHaveFocus()
      })
    })

    it('focuses cancel button initially for safety with destructive actions', () => {
      render(<ConfirmDialog {...defaultProps} confirmDanger={true} />)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toHaveFocus()
    })
  })

  describe('Keyboard Navigation - Escape Key (Capture Phase)', () => {
    it('calls onCancel when Escape key is pressed', () => {
      render(<ConfirmDialog {...defaultProps} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })

    it('prevents default on Escape to stop parent modal from closing', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      document.dispatchEvent(event)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('uses capture phase listener to intercept Escape before bubble phase', () => {
      render(<ConfirmDialog {...defaultProps} />)

      // Track listener registration
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      )

      // Re-render to trigger useEffect
      const { rerender } = render(
        <ConfirmDialog {...defaultProps} isOpen={false} />
      )
      rerender(<ConfirmDialog {...defaultProps} isOpen={true} />)

      // Check that listener was added with capture phase (third argument = true)
      const capturePhaseCall = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'keydown' && call[2] === true
      )
      expect(capturePhaseCall).toBeDefined()

      // Cleanup
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />)
      const capturePhaseRemoveCall = removeEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'keydown' && call[2] === true
      )
      expect(capturePhaseRemoveCall).toBeDefined()

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('does not call onCancel on Escape when dialog is closed', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('does not respond to other keys', () => {
      render(<ConfirmDialog {...defaultProps} />)
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })
      expect(mockOnCancel).not.toHaveBeenCalled()
      expect(mockOnConfirm).not.toHaveBeenCalled()
    })
  })

  describe('PropTypes and Edge Cases', () => {
    it('handles empty title', () => {
      render(<ConfirmDialog {...defaultProps} title='' />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('handles empty message', () => {
      render(<ConfirmDialog {...defaultProps} message='' />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('handles long message text', () => {
      const longMessage = 'A'.repeat(500)
      render(<ConfirmDialog {...defaultProps} message={longMessage} />)
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('applies maxWidth style to dialog container', () => {
      render(<ConfirmDialog {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveStyle({ maxWidth: '400px' })
    })
  })

  describe('Cleanup', () => {
    it('removes event listener when unmounted', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      )
      const { unmount } = render(<ConfirmDialog {...defaultProps} />)
      unmount()

      // Check that the capture-phase listener was removed
      const capturePhaseRemoveCall = removeEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'keydown' && call[2] === true
      )
      expect(capturePhaseRemoveCall).toBeDefined()

      removeEventListenerSpy.mockRestore()
    })

    it('removes event listener when isOpen changes to false', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      )
      const { rerender } = render(<ConfirmDialog {...defaultProps} />)
      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />)

      const capturePhaseRemoveCall = removeEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'keydown' && call[2] === true
      )
      expect(capturePhaseRemoveCall).toBeDefined()

      removeEventListenerSpy.mockRestore()
    })
  })
})
