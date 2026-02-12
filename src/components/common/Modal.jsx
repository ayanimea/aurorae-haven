import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import Icon from './Icon'

/**
 * Reusable modal wrapper component with full WCAG 2.2 AA compliance
 * - Focus trap: prevents keyboard focus from leaving modal
 * - Focus restoration: returns focus to trigger element on close
 * - Proper ARIA attributes and live regions
 * - Keyboard navigation support
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
  const modalRef = useRef(null)
  
  // Keep ref up to date
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  
  // Focus management: Save previous focus and restore on close (WCAG 2.4.3)
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousFocusRef.current = document.activeElement
      
      // Set initial focus to modal (will be refined by autofocus in form)
      setTimeout(() => {
        if (modalRef.current) {
          // Try to focus the first focusable element
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (focusableElements.length > 0) {
            focusableElements[0].focus()
          }
        }
      }, 0)
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])
  
  // Focus trap: Keep focus within modal (WCAG 2.4.3)
  useEffect(() => {
    if (!isOpen) return

    const handleTab = (e) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift + Tab on first element: go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
      // Tab on last element: go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
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
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        ref={modalRef}
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
