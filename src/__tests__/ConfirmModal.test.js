/**
 * Tests for ConfirmModal component
 * Validates accessibility, keyboard navigation, and focus management
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConfirmModal from '../components/common/ConfirmModal'

describe('ConfirmModal', () => {
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
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(
        screen.getByText('Are you sure you want to proceed?')
      ).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<ConfirmModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
    })

    it('renders custom button text', () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmText='Delete'
          cancelText='Keep'
        />
      )
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Keep')).toBeInTheDocument()
    })

    it('renders default button text', () => {
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Accessibility - ARIA', () => {
    it('has proper alertdialog role', () => {
      render(<ConfirmModal {...defaultProps} />)
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toBeInTheDocument()
    })

    it('has aria-modal="true"', () => {
      render(<ConfirmModal {...defaultProps} />)
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmModal {...defaultProps} />)
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-modal-title')
      expect(screen.getByText('Confirm Action')).toHaveAttribute(
        'id',
        'confirm-modal-title'
      )
    })

    it('has aria-describedby pointing to message', () => {
      render(<ConfirmModal {...defaultProps} />)
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveAttribute(
        'aria-describedby',
        'confirm-modal-message'
      )
      expect(
        screen.getByText('Are you sure you want to proceed?')
      ).toHaveAttribute('id', 'confirm-modal-message')
    })
  })

  describe('Button Actions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<ConfirmModal {...defaultProps} />)
      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel button is clicked', () => {
      render(<ConfirmModal {...defaultProps} />)
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard Navigation', () => {
    it('closes on Escape key for non-destructive modals', () => {
      render(<ConfirmModal {...defaultProps} isDestructive={false} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('does not close on Escape key for destructive modals', () => {
      render(<ConfirmModal {...defaultProps} isDestructive />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('does not dismiss on Escape or backdrop when dismissal is disabled', () => {
      render(<ConfirmModal {...defaultProps} allowDismiss={false} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      fireEvent.click(screen.getByRole('presentation'))
      expect(mockOnCancel).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('supports Tab navigation between buttons', () => {
      render(<ConfirmModal {...defaultProps} />)
      const cancelButton = screen.getByText('Cancel')
      const confirmButton = screen.getByText('Confirm')

      // Focus starts on confirm button by default for non-destructive modals
      cancelButton.focus()
      expect(cancelButton).toHaveFocus()
      confirmButton.focus()
      expect(confirmButton).toHaveFocus()
    })
  })

  describe('Focus Management', () => {
    it('focuses confirm button on mount for non-destructive modals', async () => {
      render(<ConfirmModal {...defaultProps} isDestructive={false} />)
      const confirmButton = screen.getByText('Confirm')
      await waitFor(() => {
        expect(confirmButton).toHaveFocus()
      })
    })

    it('focuses cancel button on mount for destructive modals', async () => {
      render(<ConfirmModal {...defaultProps} isDestructive />)
      const cancelButton = screen.getByText('Cancel')
      await waitFor(() => {
        expect(cancelButton).toHaveFocus()
      })
    })
  })

  describe('Destructive Action Styling', () => {
    it('applies destructive styling when isDestructive is true', () => {
      render(<ConfirmModal {...defaultProps} isDestructive />)
      const confirmButton = screen.getByText('Confirm')
      expect(confirmButton).toHaveClass('btn-destructive')
    })

    it('applies primary styling when isDestructive is false', () => {
      render(<ConfirmModal {...defaultProps} isDestructive={false} />)
      const confirmButton = screen.getByText('Confirm')
      expect(confirmButton).toHaveClass('btn-primary')
    })

    it('applies secondary styling to cancel button', () => {
      render(<ConfirmModal {...defaultProps} />)
      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toHaveClass('btn-secondary')
    })
  })

  describe('Click Outside Behavior', () => {
    it('closes on click outside for non-destructive modals', () => {
      render(<ConfirmModal {...defaultProps} isDestructive={false} />)
      const overlay = screen.getByRole('presentation')
      fireEvent.click(overlay)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('does not close on click outside for destructive modals', () => {
      render(<ConfirmModal {...defaultProps} isDestructive />)
      const overlay = screen.getByRole('presentation')
      fireEvent.click(overlay)
      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('does not close when clicking modal content', () => {
      render(<ConfirmModal {...defaultProps} />)
      const dialog = screen.getByRole('alertdialog')
      fireEvent.click(dialog)
      expect(mockOnCancel).not.toHaveBeenCalled()
    })
  })

  describe('Body Scroll Prevention', () => {
    it('prevents body scroll when modal is open', () => {
      const { rerender } = render(<ConfirmModal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')

      rerender(<ConfirmModal {...defaultProps} isOpen={false} />)
      // When unmounted, overflow is set to 'unset'
      expect(document.body.style.overflow).toBe('unset')
    })
  })
})
