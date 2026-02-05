/**
 * ConfirmDialog Component
 * Accessible confirmation dialog that replaces window.confirm
 * Provides better UX with focus management, styling, and screen reader support
 */

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmDanger = false
}) {
  const confirmButtonRef = useRef(null)
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Focus cancel button by default (safer default for destructive actions)
      cancelButtonRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    // Backdrop is presentational only; interaction handled via Escape key and dialog buttons
    <div
      className='modal-overlay'
      onClick={handleBackdropClick}
      role='presentation'
    >
      <div
        className='modal-container'
        style={{ maxWidth: '400px' }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'
        aria-describedby='confirm-dialog-message'
      >
        <div className='modal-header'>
          <h2 id='confirm-dialog-title'>{title}</h2>
        </div>

        <div className='modal-body'>
          <p id='confirm-dialog-message'>{message}</p>
        </div>

        <div
          className='modal-footer'
          style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <button
            ref={cancelButtonRef}
            type='button'
            className='button button-outline'
            onClick={onCancel}
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type='button'
            className={
              confirmDanger ? 'button button-danger' : 'button button-primary'
            }
            onClick={onConfirm}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmDanger: PropTypes.bool
}

export default ConfirmDialog
