import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * Context menu for note operations (right-click menu)
 */
function ContextMenu({
  contextMenu,
  onExport,
  onLockToggle,
  onDelete,
  onClose
}) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!contextMenu) return null

  return (
    <div
      ref={menuRef}
      className='context-menu'
      style={{
        top: `${contextMenu.y}px`,
        left: `${contextMenu.x}px`
      }}
      role='menu'
    >
      <button type="button"
        className='context-menu-item'
        onClick={() => {
          onExport(contextMenu.note.id)
          onClose()
        }}
        role='menuitem'
      >
        <Icon name='download' />
        Export Note
      </button>
      <button type="button"
        className='context-menu-item'
        onClick={() => {
          onLockToggle(contextMenu.note.id)
          onClose()
        }}
        role='menuitem'
      >
        <Icon name={contextMenu.note.locked ? 'unlock' : 'lock'} />
        {contextMenu.note.locked ? 'Unlock Note' : 'Lock Note'}
      </button>
      <button type="button"
        className='context-menu-item'
        onClick={() => {
          onDelete(contextMenu.note.id)
          onClose()
        }}
        role='menuitem'
        disabled={contextMenu.note.locked}
      >
        <Icon name='trashAlt' />
        Delete Note
      </button>
    </div>
  )
}

ContextMenu.propTypes = {
  contextMenu: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    note: PropTypes.shape({
      id: PropTypes.string,
      locked: PropTypes.bool
    })
  }),
  onExport: PropTypes.func.isRequired,
  onLockToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default ContextMenu
