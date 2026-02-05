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

      const overlay = screen.getByRole('dialog')
      fireEvent.keyDown(overlay, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose when pressing other keys', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      )

      const overlay = screen.getByRole('dialog')
      fireEvent.keyDown(overlay, { key: 'Enter' })
      fireEvent.keyDown(overlay, { key: 'Space' })

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
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
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
      expect(title).toHaveAttribute('id', 'modal-title')
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
})
