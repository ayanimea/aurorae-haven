/**
 * Routine Creation Modal
 * Modal for creating routines from scratch or from library templates
 */

import { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import LibrarySelector from './LibrarySelector'
import RoutineEditor from './RoutineEditor'

function RoutineCreationModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateRoutine
}) {
  const [view, setView] = useState('options') // 'options', 'library', 'editor'
  const [isCreating, setIsCreating] = useState(false)

  const handleClose = () => {
    // Reset state when closing
    setView('options')
    setIsCreating(false)
    onClose()
  }

  const handleSelectTemplate = async (template) => {
    setIsCreating(true)
    try {
      await onSelectTemplate(template) // Wait for template instantiation and list reload
      handleClose()
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveRoutine = async (routineData) => {
    setIsCreating(true)
    try {
      await onCreateRoutine(routineData)
      handleClose()
    } finally {
      setIsCreating(false)
    }
  }

  const handleBackToOptions = () => {
    setView('options')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Create New Routine'
      className='routine-creation-modal'
    >
      {view === 'options' && (
        <div className='routine-creation-options'>
          <p className='small' style={{ marginBottom: '16px' }}>
            Create a new routine from scratch or choose a template:
          </p>

          <button type="button"
            className='btn btn-primary btn-block'
            onClick={() => setView('editor')}
            style={{ marginBottom: '12px' }}
          >
            <Icon name='plus' />
            Create from Scratch
          </button>

          <button type="button"
            className='btn btn-block'
            onClick={() => setView('library')}
            style={{ marginBottom: '12px' }}
          >
            <Icon name='library' />
            Browse Library
          </button>

          <button type="button" className='btn btn-block' onClick={handleClose}>
            Cancel
          </button>
        </div>
      )}

      {view === 'library' && (
        <div className='routine-library-selector'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <button type="button"
              className='btn'
              onClick={handleBackToOptions}
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

          <LibrarySelector onSelectTemplate={handleSelectTemplate} />
        </div>
      )}

      {view === 'editor' && (
        <div className='routine-editor-wrapper'>
          <div style={{ marginBottom: '16px' }}>
            <button type="button"
              className='btn'
              onClick={handleBackToOptions}
              aria-label='Back to options'
              disabled={isCreating}
            >
              <Icon name='chevronLeft' />
              Back
            </button>
          </div>

          <RoutineEditor
            onSave={handleSaveRoutine}
            onCancel={handleBackToOptions}
            isSaving={isCreating}
          />
        </div>
      )}
    </Modal>
  )
}

RoutineCreationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectTemplate: PropTypes.func.isRequired,
  onCreateRoutine: PropTypes.func.isRequired
}

export default RoutineCreationModal
