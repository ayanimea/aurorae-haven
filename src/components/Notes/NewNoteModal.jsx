import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { NOTE_TEMPLATES } from '../../data/noteTemplates'

/**
 * Modal for selecting a note template and (optionally) inserting a TOC marker.
 *
 * Props:
 *  - isOpen     {boolean}               Whether the modal is shown
 *  - onConfirm  {function(templateId, includeToc)} Called when the user confirms
 *  - onCancel   {function}              Called when the user cancels / closes
 */
function NewNoteModal({ isOpen, onConfirm, onCancel }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank')
  const [includeToc, setIncludeToc] = useState(false)
  const modalRef = useRef(null)
  const firstFocusableRef = useRef(null)

  // Reset selections when the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId('blank')
      setIncludeToc(false)
      // Delay focus so the modal has rendered
      requestAnimationFrame(() => {
        firstFocusableRef.current?.focus()
      })
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleFocusTrap = (e) => {
      if (!modalRef.current || e.key !== 'Tab') return

      const focusable = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleFocusTrap)
    return () => document.removeEventListener('keydown', handleFocusTrap)
  }, [isOpen])

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(selectedTemplateId, includeToc)
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop closes dialog on click
    <div
      className='modal-overlay'
      role='presentation'
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        ref={modalRef}
        className='modal-content new-note-modal-content'
        role='dialog'
        aria-modal='true'
        aria-labelledby='new-note-modal-title'
      >
        <div className='modal-header'>
          <h2 id='new-note-modal-title'>New Note</h2>
          <button
            type='button'
            className='btn btn-icon modal-close-btn'
            onClick={onCancel}
            aria-label='Close'
            ref={firstFocusableRef}
          >
            <svg className='icon' viewBox='0 0 24 24' aria-hidden='true'>
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        </div>

        <div className='modal-body'>
          <p className='new-note-modal-subtitle'>Choose a starting template</p>

          <div
            className='note-template-grid'
            role='group'
            aria-label='Note templates'
          >
            {NOTE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type='button'
                className={clsx('note-template-card', {
                  'note-template-card--selected':
                    selectedTemplateId === template.id
                })}
                onClick={() => setSelectedTemplateId(template.id)}
                aria-pressed={selectedTemplateId === template.id}
                aria-label={`${template.name}: ${template.description}`}
              >
                <span className='note-template-card__emoji' aria-hidden='true'>
                  {template.emoji}
                </span>
                <span className='note-template-card__name'>{template.name}</span>
                <span className='note-template-card__desc'>
                  {template.description}
                </span>
              </button>
            ))}
          </div>

          <label className='note-toc-toggle'>
            <input
              type='checkbox'
              checked={includeToc}
              onChange={(e) => setIncludeToc(e.target.checked)}
              aria-describedby='toc-toggle-hint'
            />
            <span>Include Table of Contents</span>
          </label>
          <p
            id='toc-toggle-hint'
            className='new-note-modal-hint'
          >
            Inserts a [TOC] marker at the top of the note. The TOC appears after you add headings.
          </p>
        </div>

        <div className='modal-footer'>
          <button
            type='button'
            className='btn btn-secondary'
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={handleConfirm}
          >
            Create Note
          </button>
        </div>
      </div>
    </div>
  )
}

NewNoteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default NewNoteModal
