/**
 * Routine Creation Modal
 * Modal for creating routines with option to use templates from Library
 */

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import LibrarySelector from './LibrarySelector'

function RoutineCreationModal({ isOpen, onClose, onSelectTemplate }) {
  const [showLibrary, setShowLibrary] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleClose = () => {
    // Reset state when closing
    setShowLibrary(false)
    setIsCreating(false)
    onClose()
  }

  const handleSelectTemplate = async (template) => {
    setIsCreating(true)
    try {
      await onSelectTemplate(template) // Wait for template instantiation and list reload
      handleClose()
    } finally {
      // Always re-enable UI even if there was an error (parent handles error display)
      setIsCreating(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Create New Routine'
      className='routine-creation-modal'
    >
      {!showLibrary ? (
        <div className='routine-creation-options'>
          <p className='small' style={{ marginBottom: '16px' }}>
            Choose a routine template from the library:
          </p>

          <button
            className='btn btn-primary btn-block'
            onClick={() => setShowLibrary(true)}
            style={{ marginBottom: '12px' }}
          >
            <Icon name='library' />
            Browse Library
          </button>

          <button className='btn btn-block' onClick={handleClose}>
            Cancel
          </button>
        </div>
      ) : (
        <div className='routine-library-selector'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <button
              className='btn'
              onClick={() => setShowLibrary(false)}
              aria-label='Back to options'
              disabled={isCreating}
            >
              <Icon name='chevronLeft' />
              Back
            </button>
            {isCreating && (
              <span className='small' style={{ opacity: 0.7 }}>
                Creating routine...
              </span>
            )}
          </div>

          <LibrarySelector
            onSelectTemplate={handleSelectTemplate}
            disabled={isCreating}
          />
        </div>
      )}
    </Modal>
  )
}

RoutineCreationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectTemplate: PropTypes.func.isRequired
}

export default RoutineCreationModal
