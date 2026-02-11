import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import Icon from './Icon'

/**
 * Reusable modal wrapper component
 * Provides consistent modal overlay and content structure
 */
function Modal({ isOpen, onClose, title, children, className = '', closeOnOverlayClick = true }) {
  if (!isOpen) return null

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className='modal-overlay'
      onClick={closeOnOverlayClick ? onClose : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role='dialog'
      aria-modal='true'
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={clsx('modal-content', className)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='document'
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
