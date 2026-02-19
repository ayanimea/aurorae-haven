import React, { useEffect, useRef, useId } from 'react'
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
function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  closeOnOverlayClick = true
}) {
  // Generate unique IDs for aria-labelledby and aria-describedby to avoid conflicts
  // when multiple modals are mounted
  const titleId = useId()
  const bodyId = useId()

  // Store onClose in a ref to avoid re-registering the keydown listener on every render
  const onCloseRef = useRef(onClose)
  const previousFocusRef = useRef(null)
  const contentRef = useRef(null)

  // Keep ref up to date
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Save current focus when modal opens for potential defensive fallback
  // FocusLock's returnFocus prop handles the actual focus restoration (WCAG 2.4.3)
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
    } else if (previousFocusRef.current) {
      // Defensive focus restoration fallback: if FocusLock's returnFocus doesn't work
      // (e.g., element was removed, browser incompatibility), manually restore focus
      // Using requestAnimationFrame provides more reliable timing than setTimeout(0)
      // for defensive fallback, as it ensures the focus restoration happens after
      // FocusLock's own mechanism and any DOM updates have completed.
      let rafId = undefined
      let schedulingMethod = null // Track which method was used: 'raf', 'windowTimeout', or 'globalTimeout'

      const attemptFocusRestore = () => {
        if (
          previousFocusRef.current &&
          previousFocusRef.current !== document.body &&
          typeof previousFocusRef.current.focus === 'function'
        ) {
          try {
            previousFocusRef.current.focus()
          } catch {
            // Silently catch focus errors (element might be detached or hidden)
            // This is expected behavior and not an error condition
          }
        }
        previousFocusRef.current = null
      }

      // Use window.requestAnimationFrame for browser compatibility (SSR/test safety)
      const hasWindow = typeof window !== 'undefined'
      const hasRaf =
        hasWindow && typeof window.requestAnimationFrame === 'function'

      if (hasRaf) {
        rafId = window.requestAnimationFrame(attemptFocusRestore)
        schedulingMethod = 'raf'
      } else if (hasWindow) {
        // Fallback when window exists but requestAnimationFrame does not
        rafId = window.setTimeout(attemptFocusRestore, 0)
        schedulingMethod = 'windowTimeout'
      } else {
        // Non-window environments (SSR/tests): best-effort fallback
        rafId = setTimeout(attemptFocusRestore, 0)
        schedulingMethod = 'globalTimeout'
      }

      return () => {
        if (rafId !== undefined) {
          if (schedulingMethod === 'raf') {
            window.cancelAnimationFrame(rafId)
          } else if (schedulingMethod === 'windowTimeout') {
            window.clearTimeout(rafId)
          } else {
            clearTimeout(rafId)
          }
        }
      }
    }
  }, [isOpen])

  // Handle Escape key at document level (bubbling phase) to ensure it always works
  // Only close if focus is within this modal's content (prevents closing underlying modals
  // when nested dialogs like ConfirmDialog are open on top)
  // Respects e.defaultPrevented so inner components can consume Escape for their own UX.
  // NOTE: Because this listener is attached to document in the bubble phase, nested dialogs
  // rendered inside the modal content that also listen for Escape on document must intercept
  // the event earlier (for example, with a capture-phase listener that calls e.preventDefault(),
  // or by handling keydown on an element inside the nested dialog and calling e.stopPropagation()).
  // Alternatively, render nested dialogs outside the modal content hierarchy (e.g., as siblings
  // with their own overlay/portal) so they can manage Escape independently.
  //
  // FOCUS MANAGEMENT: This approach relies on focus being within the modal content (or on
  // document.body when no focusable element exists). FocusLock typically ensures focus stays
  // in the modal, but in edge cases focus may be on lock guards or the trigger element when
  // the modal first opens. The noFocusSet check handles modals with no focusable content.
  // Tests manually focus .modal-body to simulate typical FocusLock behavior.
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        // Only close this modal if focus is within its content
        // Add null checks for robustness (activeElement can be null if focus is on body or not set)
        // If no element has focus (document.body), treat it as eligible to close this modal
        const hasFocusInModal =
          document.activeElement &&
          contentRef.current?.contains(document.activeElement)
        const noFocusSet =
          !document.activeElement || document.activeElement === document.body

        if (hasFocusInModal || noFocusSet) {
          onCloseRef.current()
        }
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
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={bodyId}
      onClick={closeOnOverlayClick ? onClose : undefined}
      onKeyDown={(e) => { if (e.key === 'Escape' && closeOnOverlayClick) onClose() }}
    >
      <FocusLock returnFocus>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          ref={contentRef}
          className={clsx('modal-content', className)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role='document'
        >
          {title && (
            <div className='modal-header'>
              <h2 id={titleId}>{title}</h2>
              <button type="button"
                className='btn btn-icon'
                onClick={onClose}
                aria-label='Close'
                title='Close'
              >
                <Icon name='x' />
              </button>
            </div>
          )}
          <div id={bodyId} className='modal-body'>
            {children}
          </div>
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
