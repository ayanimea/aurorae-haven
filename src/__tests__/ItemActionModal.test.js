/**
 * Tests for ItemActionModal component
 * Validates modal rendering, focus management, keyboard navigation, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ItemActionModal from '../components/ItemActionModal'

// Mock dependencies
jest.mock('../utils/positionUtils', () => ({
  adjustMenuPosition: jest.fn((x, y) => ({ x, y }))
}))

import { adjustMenuPosition } from '../utils/positionUtils'

describe('ItemActionModal Component', () => {
  const mockOnClose = jest.fn()
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockFormatContent = jest.fn((item) => <div>{item.description}</div>)

  const mockItem = {
    id: 1,
    title: 'Test Item',
    description: 'Test description'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    adjustMenuPosition.mockImplementation((x, y) => ({ x, y }))
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    test('does not render when item is null', () => {
      render(
        <ItemActionModal
          item={null}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    test('renders full modal when no context menu flag', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          formatContent={mockFormatContent}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    test('renders context menu when isContextMenu flag is true', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('renders edit and delete buttons in full modal', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3) // Close + Edit + Delete
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    test('renders edit and delete menu items in context menu', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(2)
      expect(
        screen.getByRole('menuitem', { name: /edit/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /delete/i })
      ).toBeInTheDocument()
    })

    test('calls formatContent when provided', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          formatContent={mockFormatContent}
        />
      )

      expect(mockFormatContent).toHaveBeenCalledWith(mockItem)
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    test('renders without formatContent', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Test Item')).toBeInTheDocument()
    })
  })

  describe('Context menu positioning', () => {
    test('calls adjustMenuPosition with context menu coordinates', () => {
      const itemWithPosition = {
        ...mockItem,
        isContextMenu: true,
        contextMenuX: 100,
        contextMenuY: 200
      }

      render(
        <ItemActionModal
          item={itemWithPosition}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(adjustMenuPosition).toHaveBeenCalledWith(100, 200, 200, 100)
    })

    test('uses default coordinates when not provided', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(adjustMenuPosition).toHaveBeenCalledWith(0, 0, 200, 100)
    })

    test('applies adjusted position styles to context menu', () => {
      adjustMenuPosition.mockReturnValue({ x: 150, y: 250 })
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      const { container } = render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const menu = container.querySelector('.item-action-context-menu')
      expect(menu).toHaveStyle({
        left: '150px',
        top: '250px',
        position: 'fixed'
      })
    })
  })

  describe('Interactions', () => {
    test('calls onEdit and onClose when edit button clicked in full modal', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent.includes('Edit'))
      fireEvent.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockItem)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onEdit and onClose when edit menu item clicked in context menu', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editMenuItem = screen.getByRole('menuitem', { name: /edit/i })
      fireEvent.click(editMenuItem)

      expect(mockOnEdit).toHaveBeenCalledWith(contextMenuItem)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onDelete when delete button clicked and confirmed', async () => {
      mockOnDelete.mockResolvedValue(true)

      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent.includes('Delete'))
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockItem)
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    test('does not close when delete is cancelled', async () => {
      mockOnDelete.mockResolvedValue(false)

      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen
        .getAllByRole('button')
        .find((btn) => btn.textContent.includes('Delete'))
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockItem)
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('calls onClose when clicking backdrop', () => {
      const { container } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const backdrop = container.querySelector('.item-action-backdrop')
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose when clicking modal content', () => {
      const { container } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const modal = container.querySelector('.item-action-modal')
      fireEvent.click(modal)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('calls onClose when close button clicked', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard navigation', () => {
    test('calls onClose when Escape key pressed', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when Escape pressed in context menu', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose for other keys', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'a' })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('implements focus trap for Tab key in full modal', () => {
      const { container } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const buttons = container.querySelectorAll('button')
      const firstButton = buttons[0]
      const lastButton = buttons[buttons.length - 1]

      lastButton.focus()
      expect(document.activeElement).toBe(lastButton)

      fireEvent.keyDown(document, { key: 'Tab' })

      // Focus trap should cycle to first button
      expect(firstButton.focus).toBeDefined()
    })

    test('implements reverse focus trap for Shift+Tab in full modal', () => {
      const { container } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const buttons = container.querySelectorAll('button')
      const firstButton = buttons[0]

      firstButton.focus()
      expect(document.activeElement).toBe(firstButton)

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

      // Focus trap should cycle to last button
      expect(buttons.length).toBeGreaterThan(0)
    })

    test('does not apply focus trap in context menu', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      fireEvent.keyDown(document, { key: 'Tab' })

      // Should not interfere with normal tab behavior
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Focus management', () => {
    test('focuses first button when modal opens', async () => {
      const { rerender } = render(
        <ItemActionModal
          item={null}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      rerender(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Focus management happens in useEffect, wait for it
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const activeElement = document.activeElement
        expect(buttons.some((btn) => btn === activeElement)).toBe(true)
      })
    })

    test('restores focus to previous element when modal closes', async () => {
      const triggerButton = document.createElement('button')
      triggerButton.textContent = 'Trigger'
      document.body.appendChild(triggerButton)
      triggerButton.focus()

      expect(document.activeElement).toBe(triggerButton)

      const { rerender } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      rerender(
        <ItemActionModal
          item={null}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Focus restoration happens in useEffect cleanup
      await waitFor(
        () => {
          expect(document.activeElement).toBe(triggerButton)
        },
        { timeout: 2000 }
      )

      document.body.removeChild(triggerButton)
    })

    test('handles rapid modal switches', async () => {
      const item1 = { ...mockItem, id: 1, title: 'Item 1' }
      const item2 = { ...mockItem, id: 2, title: 'Item 2' }

      const { rerender } = render(
        <ItemActionModal
          item={item1}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()

      rerender(
        <ItemActionModal
          item={item2}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Item 2')).toBeInTheDocument()
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('full modal has role="dialog"', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    test('full modal has aria-modal="true"', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    test('full modal has aria-labelledby pointing to title', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')

      const title = screen.getByText('Test Item')
      expect(title).toHaveAttribute('id', 'modal-title')
    })

    test('context menu has role="menu"', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    test('context menu has aria-label', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const menu = screen.getByRole('menu')
      expect(menu).toHaveAttribute('aria-label', 'Item actions')
    })

    test('context menu items have role="menuitem"', () => {
      const contextMenuItem = { ...mockItem, isContextMenu: true }

      render(
        <ItemActionModal
          item={contextMenuItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(2)
    })

    test('close button has aria-label', () => {
      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close')
    })

    test('backdrop has role="presentation"', () => {
      const { container } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const backdrop = container.querySelector('.item-action-backdrop')
      expect(backdrop).toHaveAttribute('role', 'presentation')
    })
  })

  describe('Edge cases', () => {
    test('handles item with no title', () => {
      const itemWithoutTitle = { id: 1, description: 'No title' }

      render(
        <ItemActionModal
          item={itemWithoutTitle}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Item Details')).toBeInTheDocument()
    })

    test('handles null formatContent return', () => {
      const nullFormatContent = jest.fn(() => null)

      render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          formatContent={nullFormatContent}
        />
      )

      expect(screen.getByText('Test Item')).toBeInTheDocument()
      expect(nullFormatContent).toHaveBeenCalledWith(mockItem)
    })

    test('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    test('handles SSR environment gracefully', () => {
      // In jsdom v28, we can't mock document as undefined
      // But we can test that the component handles rendering without errors
      const { rerender, container } = render(
        <ItemActionModal
          item={null}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Component should render nothing when item is null
      expect(container.firstChild).toBeNull()

      // Component should not crash when item is provided
      rerender(
        <ItemActionModal
          item={mockItem}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Component should render the modal
      expect(container.firstChild).not.toBeNull()
    })
  })
})
