/**
 * Context menu for routine management (right-click menu)
 * Provides keyboard-accessible Modify and Remove actions
 * without triggering routine execution side effects.
 */

import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * RoutineContextMenu
 *
 * Renders a positioned context menu with management actions for a routine.
 * Closes on outside click, Escape key, or when an action is selected.
 *
 * @param {object}   contextMenu        - Menu state: { x, y, routine }
 * @param {function} onModify           - Called when "Modify routine" is selected
 * @param {function} onRemove           - Called when "Remove routine" is selected
 * @param {function} onClose            - Called to close the menu
 */
function RoutineContextMenu({ contextMenu, onModify, onRemove, onClose }) {
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
      aria-label={`Actions for ${contextMenu.routine?.name || contextMenu.routine?.title || 'routine'}`}
    >
      <button
        type='button'
        className='context-menu-item'
        onClick={() => {
          onModify(contextMenu.routine)
          onClose()
        }}
        role='menuitem'
      >
        <Icon name='edit' />
        Modify routine
      </button>
      <button
        type='button'
        className='context-menu-item context-menu-item-danger'
        onClick={() => {
          onRemove(contextMenu.routine)
          onClose()
        }}
        role='menuitem'
      >
        <Icon name='trash' />
        Remove routine
      </button>
    </div>
  )
}

RoutineContextMenu.propTypes = {
  contextMenu: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    routine: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      title: PropTypes.string
    })
  }),
  onModify: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default RoutineContextMenu
