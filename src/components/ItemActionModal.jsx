import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useIsMobile } from '../hooks/useIsMobile'
import { adjustMenuPosition } from '../utils/positionUtils'
import './ItemActionModal.css'

/**
 * Reusable modal for displaying item details with edit/delete actions
 * Used across Schedule, Tasks, Habits, Brain Dump, etc.
 * 
 * Mobile: Shows on click with full details
 * Desktop: Shows on right-click as context menu
 */
function ItemActionModal({ item, onClose, onEdit, onDelete, formatContent }) {
  // All hooks must be called before any conditional returns
  const isMobile = useIsMobile()
  const modalRef = useRef(null)
  const firstButtonRef = useRef(null)
  const previouslyFocusedElement = useRef(null)

  // Compute derived values from props (before early return)
  const isContextMenu = item ? (item.isContextMenu || !isMobile) : false

  // Store previously focused element for focus restoration
  useEffect(() => {
    if (!item) return

    previouslyFocusedElement.current = document.activeElement
    
    // Focus first button when modal opens
    if (firstButtonRef.current) {
      firstButtonRef.current.focus()
    }
    
    // Restore focus on unmount
    return () => {
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus()
      }
    }
  }, [item])

  // Focus trap for full modal
  useEffect(() => {
    if (!item || isContextMenu || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    // Safety check: ensure there are focusable elements
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [item, isContextMenu])

  // Global escape key handler
  useEffect(() => {
    if (!item) return

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [item, onClose])

  // Early return AFTER all hooks
  if (!item) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit(item)
    onClose()
  }

  const handleDelete = async () => {
    const confirmed = await onDelete(item)
    if (confirmed !== false) {
      onClose()
    }
  }

  // Context menu style (desktop right-click)
  if (isContextMenu) {
    const menuWidth = 200
    const menuHeight = 100
    const { x, y } = adjustMenuPosition(
      item.contextMenuX || 0,
      item.contextMenuY || 0,
      menuWidth,
      menuHeight
    )

    return (
      <div 
        className="item-action-backdrop"
        role="presentation"
        onClick={handleBackdropClick}
      >
        <div 
          className="item-action-context-menu"
          role="menu"
          aria-label="Item actions"
          style={{
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`
          }}
        >
          <button 
            ref={firstButtonRef}
            className="context-menu-item" 
            onClick={handleEdit}
            role="menuitem"
          >
            <span className="context-menu-icon" aria-hidden="true">✏️</span>
            Edit
          </button>
          <button 
            className="context-menu-item context-menu-item-danger" 
            onClick={handleDelete}
            role="menuitem"
          >
            <span className="context-menu-icon" aria-hidden="true">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    )
  }

  // Full details modal (mobile click)
  const content = formatContent ? formatContent(item) : null

  return (
    <div 
      className="item-action-backdrop"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="item-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="item-action-header">
          <h3 id="modal-title">{item.title || 'Item Details'}</h3>
          <button className="item-action-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        
        {content && (
          <div className="item-action-content">
            {content}
          </div>
        )}
        
        <div className="item-action-buttons">
          <button 
            ref={firstButtonRef}
            className="item-action-btn item-action-btn-secondary" 
            onClick={handleEdit}
          >
            <span aria-hidden="true">✏️</span> Edit
          </button>
          <button 
            className="item-action-btn item-action-btn-danger" 
            onClick={handleDelete}
          >
            <span aria-hidden="true">🗑️</span> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

ItemActionModal.propTypes = {
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  formatContent: PropTypes.func
}

export default ItemActionModal
