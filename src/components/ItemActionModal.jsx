import React from 'react'
import PropTypes from 'prop-types'
import './ItemActionModal.css'

/**
 * Reusable modal for displaying item details with edit/delete actions
 * Used across Schedule, Tasks, Habits, Brain Dump, etc.
 * 
 * Mobile: Shows on click with full details
 * Desktop: Shows on right-click as context menu
 */
function ItemActionModal({ item, onClose, onEdit, onDelete, formatContent }) {
  if (!item) return null

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
  const isContextMenu = item.isContextMenu || !isMobile

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleBackdropKeyDown = (e) => {
    if (e.key === 'Escape') {
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
    const x = item.contextMenuX || 0
    const y = item.contextMenuY || 0

    return (
      <div 
        className="item-action-backdrop" 
        onClick={handleBackdropClick}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
      >
        <div 
          className="item-action-context-menu"
          style={{
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`
          }}
        >
          <button className="context-menu-item" onClick={handleEdit}>
            <span className="context-menu-icon">✏️</span>
            Edit
          </button>
          <button className="context-menu-item context-menu-item-danger" onClick={handleDelete}>
            <span className="context-menu-icon">🗑️</span>
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
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div className="item-action-modal">
        <div className="item-action-header">
          <h3>{item.title || 'Item Details'}</h3>
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
          <button className="item-action-btn item-action-btn-secondary" onClick={handleEdit}>
            ✏️ Edit
          </button>
          <button className="item-action-btn item-action-btn-danger" onClick={handleDelete}>
            🗑️ Delete
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
