/**
 * Routine Edit Modal
 * Modal for editing an existing routine's details
 */

import { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../common/Modal'
import RoutineEditor from './RoutineEditor'

function RoutineEditModal({ isOpen, routine, onClose, onUpdateRoutine }) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (routineData) => {
    setIsSaving(true)
    try {
      await onUpdateRoutine(routineData)
      onClose()
    } catch {
      // Parent (Routines.jsx) handles the error notification (toast).
      // Keep the modal open so the user can retry or cancel.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Edit Routine'
      className='routine-edit-modal'
    >
      {routine && (
        <RoutineEditor
          routine={routine}
          onSave={handleSave}
          onCancel={onClose}
          isSaving={isSaving}
        />
      )}
    </Modal>
  )
}

RoutineEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  routine: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onUpdateRoutine: PropTypes.func.isRequired
}

export default RoutineEditModal
