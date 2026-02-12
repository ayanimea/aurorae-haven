import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import Icon from './Icon'

/**
 * Reusable modal wrapper component
 * Provides consistent modal overlay and content structure
 */
function Modal({ isOpen, onClose, title, children, className = '', closeOnOverlayClick = true }) {
  // Store onClose in a ref to avoid re-registering the keydown listener on every render
  const onCloseRef = useRef(onClose)
  
  // Keep ref up to date
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  
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
    <div
      className='modal-overlay'
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={clsx('modal-content', className)}
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className='modal-header'>
            <h2 id='modal-title'>{title}</h2>
            <button
              className='btn btn-icon'
              onClick={onClose}
              aria-label='Close'
            >
              <Icon name='x' />
            </button>
          </div>
        )}
        <div className='modal-body'>{children}</div>
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
