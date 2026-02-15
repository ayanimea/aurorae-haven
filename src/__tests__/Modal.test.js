/**
 * Tests for Modal component
 * Validates modal rendering, interaction, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../components/common/Modal'

describe('Modal Component', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    test('renders children content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Test Content</div>
        </Modal>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('renders title when provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test Modal'>
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    test('does not render header when title is not provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('.modal-header')).not.toBeInTheDocument()
    })

    test('renders close button when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test'>
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    test('applies custom className to modal content', () => {
      const { container } = render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          className='custom-modal-class'
        >
          <div>Content</div>
        </Modal>
      )

      const modalContent = container.querySelector('.modal-content')
      expect(modalContent).toHaveClass('modal-content', 'custom-modal-class')
    })
  })

  describe('Interactions', () => {
    test('calls onClose when clicking overlay', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const overlay = screen.getByRole('dialog')
      fireEvent.click(overlay)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose when clicking modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const content = screen.getByText('Content')
      fireEvent.click(content)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('calls onClose when pressing Escape key', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      // Escape is now handled at document level, so fire on document
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose when pressing other keys', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('calls onClose when clicking close button', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test'>
          <div>Content</div>
        </Modal>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose when clicking overlay and closeOnOverlayClick is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <div>Content</div>
        </Modal>
      )

      const overlay = screen.getByRole('dialog')
      fireEvent.click(overlay)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('still calls onClose on Escape even when closeOnOverlayClick is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <div>Content</div>
        </Modal>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('still calls onClose on close button even when closeOnOverlayClick is false', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          title='Test'
          closeOnOverlayClick={false}
        >
          <div>Content</div>
        </Modal>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('respects closeOnOverlayClick default value of true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const overlay = screen.getByRole('dialog')
      fireEvent.click(overlay)

      // Default behavior should close on overlay click
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('cleans up document keydown listener on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      // Unmount the modal
      unmount()

      // Try to trigger Escape after unmount
      fireEvent.keyDown(document, { key: 'Escape' })

      // Should not call onClose after unmount
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    test('has role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    test('has aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    test('has aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test Modal'>
          <div>Content</div>
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      const title = screen.getByText('Test Modal')
      const titleId = title.getAttribute('id')
      
      // Verify the dialog references the title's ID
      expect(dialog).toHaveAttribute('aria-labelledby', titleId)
      // Verify the title has an ID (dynamic, generated by useId)
      expect(titleId).toBeTruthy()
    })

    test('does not have aria-labelledby when title is not provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).not.toHaveAttribute('aria-labelledby')
    })

    test('modal title has correct id for aria-labelledby', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test Modal'>
          <div>Content</div>
        </Modal>
      )

      const title = screen.getByText('Test Modal')
      const dialog = screen.getByRole('dialog')
      const titleId = title.getAttribute('id')
      const ariaLabelledBy = dialog.getAttribute('aria-labelledby')
      
      // Verify the title has a unique ID and the dialog references it
      expect(titleId).toBeTruthy()
      expect(ariaLabelledBy).toBe(titleId)
    })

    test('close button has aria-label', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test'>
          <div>Content</div>
        </Modal>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close')
    })

    test('modal content has role="document"', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const modalContent = container.querySelector('.modal-content')
      expect(modalContent).toHaveAttribute('role', 'document')
    })
  })

  describe('Structure', () => {
    test('has modal-overlay class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('.modal-overlay')).toBeInTheDocument()
    })

    test('has modal-content class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('.modal-content')).toBeInTheDocument()
    })

    test('has modal-body class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('.modal-body')).toBeInTheDocument()
    })

    test('has modal-header when title provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} title='Test'>
          <div>Content</div>
        </Modal>
      )

      expect(container.querySelector('.modal-header')).toBeInTheDocument()
    })
  })

  describe('Focus Management', () => {
    test('restores focus to previously focused element when modal closes', () => {
      // Create a focusable element
      const button = document.createElement('button')
      button.textContent = 'Trigger Button'
      document.body.appendChild(button)
      button.focus()

      // Store the button reference
      const initialActiveElement = document.activeElement

      // Mock requestAnimationFrame for testing BEFORE rendering
      const originalRaf = window.requestAnimationFrame
      const originalCancelRaf = window.cancelAnimationFrame
      let rafCallback = null

      window.requestAnimationFrame = jest.fn((cb) => {
        rafCallback = cb
        return 1
      })
      window.cancelAnimationFrame = jest.fn()

      // Render modal as open
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      )

      // Modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Close the modal by changing isOpen prop
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      )

      // Modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // Verify requestAnimationFrame was called
      expect(window.requestAnimationFrame).toHaveBeenCalled()

      // Execute the focus restoration callback
      if (rafCallback) {
        rafCallback()
      }

      // Focus should be restored to the original button
      expect(document.activeElement).toBe(initialActiveElement)

      // Cleanup
      document.body.removeChild(button)
      window.requestAnimationFrame = originalRaf
      window.cancelAnimationFrame = originalCancelRaf
    })

    test('cleans up requestAnimationFrame on unmount', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      // Mock requestAnimationFrame BEFORE rendering
      const originalRaf = window.requestAnimationFrame
      const originalCancelRaf = window.cancelAnimationFrame
      
      window.requestAnimationFrame = jest.fn(() => 1)
      window.cancelAnimationFrame = jest.fn()

      const { unmount, rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      )

      // Close the modal
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      )

      // Verify requestAnimationFrame was called when modal closed
      expect(window.requestAnimationFrame).toHaveBeenCalled()

      // Unmount before the animation frame executes
      unmount()

      // cancelAnimationFrame should have been called during cleanup
      expect(window.cancelAnimationFrame).toHaveBeenCalled()

      // Cleanup
      document.body.removeChild(button)
      window.requestAnimationFrame = originalRaf
      window.cancelAnimationFrame = originalCancelRaf
    })
  })
})
