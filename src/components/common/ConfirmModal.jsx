import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

/**
 * Accessible confirmation modal component
 * Replaces native confirm() with proper ARIA labels and keyboard navigation
 *
 * Implements:
 * - TAB-SEC-30: role="alertdialog" with aria-modal="true"
 * - TAB-POP-08: Focus trap with Tab/Shift+Tab navigation
 * - TAB-POP-09: Explicit button click required for confirm
 * - TAB-POP-16: ARIA labels via aria-labelledby and aria-describedby
 * - TAB-POP-18: Escape key handling (disabled for destructive actions)
 */
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}) {
  const modalRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)

  // Focus management: focus cancel button on mount for destructive actions
  useEffect(() => {
    if (isOpen) {
      // For destructive actions, focus cancel button first (safer default)
      // For non-destructive, focus confirm button
      if (isDestructive) {
        cancelButtonRef.current?.focus()
      } else {
        confirmButtonRef.current?.focus()
      }
    }
  }, [isOpen, isDestructive])

  // Keyboard navigation - Escape closes non-destructive modals only
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      // TAB-POP-18: Escape closes non-destructive dialogs only
      if (e.key === 'Escape' && !isDestructive) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDestructive, onCancel])

  // Focus trap - Tab/Shift+Tab cycles within modal
  useEffect(() => {
    if (!isOpen) return

    const handleFocusTrap = (e) => {
      if (!modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleFocusTrap)
    return () => document.removeEventListener('keydown', handleFocusTrap)
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay closes dialog on click
    <div
      className='modal-overlay'
      role='presentation'
      onClick={(e) => {
        // Click outside only works for non-destructive modals
        if (e.target === e.currentTarget && !isDestructive) {
          onCancel()
        }
      }}
    >
      <div
        ref={modalRef}
        className='modal-content confirm-modal-content'
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='confirm-modal-title'
        aria-describedby='confirm-modal-message'
      >
        <div className='modal-header'>
          <h2 id='confirm-modal-title'>{title}</h2>
        </div>
        <div className='modal-body'>
          <p id='confirm-modal-message'>{message}</p>
        </div>
        <div className='modal-footer'>
          <button
            ref={cancelButtonRef}
            className='btn btn-secondary'
            onClick={onCancel}
            type='button'
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            className={clsx(
              'btn',
              isDestructive ? 'btn-destructive' : 'btn-primary'
            )}
            onClick={onConfirm}
            type='button'
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isDestructive: PropTypes.bool
}

export default ConfirmModal
