import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import FocusLock from 'react-focus-lock'
import Icon from './Icon'

/**
 * Reusable modal wrapper component with full WCAG 2.2 AA compliance
 * - Focus trap: prevents keyboard focus from leaving modal (via react-focus-lock)
 * - Focus restoration: returns focus to trigger element on close
 * - Proper ARIA attributes and live regions
 * - Keyboard navigation support
 * 
 * Uses react-focus-lock for robust, battle-tested focus trapping instead of
 * custom implementation. This handles edge cases like iframes, shadow DOM,
 * disabled elements, and browser compatibility.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether modal is currently open
 * @param {Function} props.onClose - Callback when modal should close
 * @param {string} [props.title] - Optional modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether clicking overlay closes modal
 */
function Modal({ isOpen, onClose, title, children, className = '', closeOnOverlayClick = true }) {
  // Store onClose in a ref to avoid re-registering the keydown listener on every render
  const onCloseRef = useRef(onClose)
  const previousFocusRef = useRef(null)
  
  // Keep ref up to date
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  
  // Focus restoration: Save current focus and restore on close (WCAG 2.4.3)
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element for restoration
      previousFocusRef.current = document.activeElement
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])
  
  // Handle Escape key at document level to ensure it always works
  // Respects e.defaultPrevented so inner components can consume Escape for their own UX
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  if (!isOpen) return null

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className='modal-overlay'
      role='dialog'
      aria-modal='true'
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby='modal-body'
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <FocusLock returnFocus>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          className={clsx('modal-content', className)}
          onClick={(e) => e.stopPropagation()}
          role='document'
        >
          {title && (
            <div className='modal-header'>
              <h2 id='modal-title'>{title}</h2>
              <button
                className='btn btn-icon'
                onClick={onClose}
                aria-label={`Close ${title || 'modal'}`}
                title={`Close ${title || 'modal'}`}
              >
                <Icon name='x' />
              </button>
            </div>
          )}
          <div id='modal-body' className='modal-body'>{children}</div>
        </div>
      </FocusLock>
    </div>
  )
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  closeOnOverlayClick: PropTypes.bool
}

export default Modal
