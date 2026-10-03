/**
 * Context menu for routine management (right-click menu)
 * Provides keyboard-accessible Edit, Duplicate, Schedule and Delete actions
 * without triggering routine execution side effects.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * RoutineContextMenu
 *
 * Renders a positioned context menu with management actions for a routine.
 * Closes on outside click, Escape key, or when an action is selected.
 * Document-level listeners are only active while the menu is open.
 * The first menu item receives focus when the menu opens.
 * Position is clamped to viewport bounds to prevent off-screen rendering.
 *
 * @param {object}   contextMenu        - Menu state: { x, y, routine }
 * @param {function} onEdit             - Called when "Edit" is selected
 * @param {function} onDuplicate        - Called when "Duplicate" is selected
 * @param {function} onSchedule        - Called when "Schedule" is selected
 * @param {function} onDelete           - Called when "Delete" is selected
 * @param {function} onClose            - Called to close the menu
 */
function RoutineContextMenu({ contextMenu, onEdit, onDuplicate, onSchedule, onDelete, onClose }) {
  const menuRef = useRef(null)
  const returnFocusRef = useRef(null)

  const closeMenu = useCallback(
    (restoreFocus = false) => {
      if (restoreFocus && returnFocusRef.current?.isConnected) {
        returnFocusRef.current.focus()
      }
      onClose()
    },
    [onClose]
  )

  // Only register document-level listeners while the menu is open
  useEffect(() => {
    if (!contextMenu) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeMenu(true)
        return
      }

      const menuItems = Array.from(
        menuRef.current?.querySelectorAll('[role="menuitem"]') || []
      )
      if (menuItems.length === 0) return

      const currentIndex = menuItems.indexOf(document.activeElement)
      let nextIndex

      switch (e.key) {
        case 'ArrowDown':
          nextIndex = (currentIndex + 1) % menuItems.length
          break
        case 'ArrowUp':
          nextIndex =
            currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = menuItems.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      menuItems[nextIndex].focus()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu, closeMenu, onClose])

  // Move focus into the menu and retain the trigger for dismissal/action focus.
  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return
    returnFocusRef.current = document.activeElement
    const firstItem = menuRef.current.querySelector('[role="menuitem"]')
    firstItem?.focus()
  }, [contextMenu])

  // Clamp menu position to viewport bounds so it never renders off-screen
  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return
    const menu = menuRef.current
    const { width, height } = menu.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const x = Math.min(contextMenu.x, Math.max(0, vw - width - 8))
    const y = Math.min(contextMenu.y, Math.max(0, vh - height - 8))
    menu.style.left = `${x}px`
    menu.style.top = `${y}px`
  }, [contextMenu])

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
          onEdit(contextMenu.routine)
          closeMenu(true)
        }}
        role='menuitem'
      >
        <Icon name='edit' />
        Edit
      </button>
      <button
        type='button'
        className='context-menu-item'
        onClick={() => {
          onDuplicate(contextMenu.routine)
          closeMenu(true)
        }}
        role='menuitem'
      >
        <Icon name='copy' />
        Duplicate
      </button>
      <button
        type='button'
        className='context-menu-item'
        onClick={() => {
          onSchedule(contextMenu.routine)
          closeMenu(true)
        }}
        role='menuitem'
      >
        <Icon name='calendar' />
        Schedule
      </button>
      <button
        type='button'
        className='context-menu-item context-menu-item-danger'
        onClick={() => {
          onDelete(contextMenu.routine)
          closeMenu(true)
        }}
        role='menuitem'
      >
        <Icon name='trash' />
        Delete
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
  onEdit: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onSchedule: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default RoutineContextMenu
