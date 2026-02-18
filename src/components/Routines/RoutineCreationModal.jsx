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

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template)
    onClose()
  }

  const handleManualCreate = () => {
    // For now, redirect to Library to create a new template
    // In future, could have inline creation form
    setShowLibrary(true)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Create New Routine'
      className='routine-creation-modal'
    >
      {!showLibrary ? (
        <div className='routine-creation-options'>
          <p className='small' style={{ marginBottom: '16px' }}>
            Choose how to create your routine:
          </p>

          <button
            className='btn btn-primary btn-block'
            onClick={() => setShowLibrary(true)}
            style={{ marginBottom: '12px' }}
          >
            <Icon name='library' />
            Add from Library
          </button>

          <button
            className='btn btn-block'
            onClick={handleManualCreate}
            style={{ marginBottom: '12px' }}
          >
            <Icon name='plus' />
            Create from Scratch
          </button>

          <button className='btn btn-block' onClick={onClose}>
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
            >
              <Icon name='chevronLeft' />
              Back
            </button>
          </div>

          <LibrarySelector onSelectTemplate={handleSelectTemplate} />
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
