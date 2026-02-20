import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Modal from '../common/Modal'
import Icon from '../common/Icon'
import ConfirmDialog from '../common/ConfirmDialog'
import SearchableEventSelector from './SearchableEventSelector'
import {
  getCurrentDateISO,
  getCurrentTimeHHMM,
  getCurrentTimePlusMinutes
} from '../../utils/timeUtils'
import {
  EVENT_TYPES,
  VALID_EVENT_TYPES,
  MAX_TRAVEL_TIME_MINUTES,
  MAX_PREPARATION_TIME_MINUTES
} from '../../utils/scheduleConstants'
import { instantiateRoutineFromTemplate } from '../../utils/scheduleHelpers'
import { createLogger } from '../../utils/logger'

const logger = createLogger('EventModal')

/**
 * Helper function to clamp a time value to a valid range
 * @param {number} value - The value to clamp
 * @param {number} max - The maximum allowed value
 * @returns {number} The clamped value (between 0 and max)
 */
const clampTimeValue = (value, max) => {
  return Math.max(0, Math.min(value, max))
}

/**
 * Helper function to handle time input changes with validation
 * @param {string} inputValue - The raw input value from the input field
 * @param {number} maxValue - The maximum allowed value
 * @param {Function} onChange - Callback to invoke with the validated value
 */
const handleTimeInputChange = (inputValue, maxValue, onChange) => {
  // Allow clearing the field to 0
  if (inputValue === '') {
    onChange(0)
    return
  }

  const parsedValue = parseInt(inputValue, 10)

  // Preserve previous value if input is invalid (NaN)
  if (Number.isNaN(parsedValue)) {
    return
  }

  const clampedValue = clampTimeValue(parsedValue, maxValue)
  onChange(clampedValue)
}

/**
 * Modal for creating and editing schedule events
 */
function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  eventType,
  initialData = null
}) {
  // Validate eventType and use default if invalid
  // Note: PropTypes validation will also warn about invalid types in development
  const validatedEventType = VALID_EVENT_TYPES.includes(eventType)
    ? eventType
    : EVENT_TYPES.TASK

  const [formData, setFormData] = useState({
    title: '',
    day: getCurrentDateISO(),
    startTime: getCurrentTimeHHMM(),
    endTime: getCurrentTimePlusMinutes(60),
    type: validatedEventType,
    travelTime: 0,
    preparationTime: 0
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  // Track if this is a drag-to-schedule operation (show both routines and tasks)
  const [isDragToSchedule, setIsDragToSchedule] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const titleInputRef = useRef(null)

  // Reset form when modal opens or event type changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const hasTitle = initialData.title && initialData.title.trim() !== ''
        // Detect drag-to-schedule: must have NO id (new event) AND null type (from createEventFromSlot)
        // This prevents misclassifying existing events with missing type as drag-to-schedule
        const isDragToSchedule =
          !initialData.id && initialData.type === null && !hasTitle

        setFormData({
          title: initialData.title || '',
          day: initialData.day || getCurrentDateISO(),
          startTime: initialData.startTime || getCurrentTimeHHMM(),
          endTime: initialData.endTime || getCurrentTimePlusMinutes(60),
          // Default missing type to validatedEventType for backward compatibility
          type:
            initialData.type !== undefined
              ? initialData.type
              : validatedEventType,
          travelTime: initialData.travelTime || 0,
          preparationTime: initialData.preparationTime || 0
        })

        setIsDragToSchedule(isDragToSchedule)

        // Show search selector if drag-to-schedule or editing event without title
        // Show form directly if editing existing event with title
        const isSearchableType =
          validatedEventType === EVENT_TYPES.ROUTINE ||
          validatedEventType === EVENT_TYPES.TASK
        setShowManualForm(hasTitle || (!isDragToSchedule && !isSearchableType))
      } else {
        setFormData({
          title: '',
          day: getCurrentDateISO(),
          startTime: getCurrentTimeHHMM(),
          endTime: getCurrentTimePlusMinutes(60),
          type: validatedEventType,
          travelTime: 0,
          preparationTime: 0
        })
        setIsDragToSchedule(false)
        // For routine/task, start with search; for meeting/habit, show form directly
        setShowManualForm(
          validatedEventType === EVENT_TYPES.MEETING ||
            validatedEventType === EVENT_TYPES.HABIT
        )
      }
      setError('')
    }
  }, [isOpen, initialData, validatedEventType])

  // Focus management - auto-focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus()
      // Only select text if editing existing event with title
      if (initialData && initialData.title) {
        titleInputRef.current.select()
      }
    }
  }, [isOpen, initialData])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateForm = () => {
    const trimmedTitle = formData.title.trim()
    if (!trimmedTitle) {
      setError('Title is required')
      return false
    }
    if (trimmedTitle.length > 200) {
      setError('Title must be 200 characters or less')
      return false
    }
    if (!formData.day) {
      setError('Date is required')
      return false
    }
    if (!formData.startTime || !formData.endTime) {
      setError('Start and end times are required')
      return false
    }
    // Time validation: End time must be after start time (zero-duration events not allowed)
    // Note: String comparison works correctly for HH:MM format in 24-hour time (e.g., "09:00" < "17:00")
    // This assumes times are always in HH:MM 24-hour format; would need Date objects for 12-hour format
    // Using >= to prevent both backwards time ranges and zero-duration events
    if (formData.startTime >= formData.endTime) {
      setError(
        'End time must be after start time (events cannot have zero duration)'
      )
      return false
    }

    // Validate travel time
    if (typeof formData.travelTime === 'number') {
      // Explicitly check for NaN
      if (Number.isNaN(formData.travelTime)) {
        setError('Travel time must be a valid number')
        return false
      }
      if (formData.travelTime < 0) {
        setError('Travel time cannot be negative')
        return false
      }
      if (formData.travelTime > MAX_TRAVEL_TIME_MINUTES) {
        setError(`Travel time cannot exceed ${MAX_TRAVEL_TIME_MINUTES} minutes`)
        return false
      }
    }

    // Validate preparation time
    if (typeof formData.preparationTime === 'number') {
      // Explicitly check for NaN
      if (Number.isNaN(formData.preparationTime)) {
        setError('Preparation time must be a valid number')
        return false
      }
      if (formData.preparationTime < 0) {
        setError('Preparation time cannot be negative')
        return false
      }
      if (formData.preparationTime > MAX_PREPARATION_TIME_MINUTES) {
        setError(
          `Preparation time cannot exceed ${MAX_PREPARATION_TIME_MINUTES} minutes`
        )
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setError('') // Clear any previous errors
    try {
      // Trim title before saving to prevent whitespace issues
      const trimmedData = {
        ...formData,
        title: formData.title.trim(),
        ...(initialData?.id ? { id: initialData.id } : {})
      }
      await onSave(trimmedData)
      onClose()
    } catch (err) {
      // Provide more specific error messages for better user experience
      const errorMessage =
        err.message || 'Failed to save event. Please try again.'
      logger.error('Save failed:', err)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!initialData?.id || !onDelete) return
    // Show confirmation dialog instead of window.confirm for better UX/accessibility
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    if (!initialData?.id || !onDelete) return

    const eventTypeLabel = formData.type || 'event'
    setIsSubmitting(true)
    setError('') // Clear any previous errors
    try {
      await onDelete(initialData.id)
      onClose()
    } catch (err) {
      // Provide more specific error message
      const errorMessage =
        err.message || `Failed to delete ${eventTypeLabel}. Please try again.`
      logger.error('Delete failed:', err)
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const getModalTitle = () => {
    const action = initialData?.id ? 'Save' : 'Schedule'

    // In drag-to-schedule with an undecided type (initialData.type === null)
    // and before the manual form is shown, keep the title generic so it
    // matches the selector offering both routines and tasks.
    const isUndecidedDragToSchedule =
      isDragToSchedule &&
      initialData &&
      initialData.type == null &&
      !showManualForm

    const typeLabel = isUndecidedDragToSchedule
      ? 'Event'
      : formData.type
        ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1)
        : 'Event'

    return `${action} ${typeLabel}`
  }

  // Handle selecting an existing routine/task
  const handleItemSelect = async (item) => {
    // If item is a template, instantiate it as a routine first
    if (item.isTemplate && item.type === EVENT_TYPES.ROUTINE) {
      try {
        logger.log('Instantiating routine from template:', item.title)
        const instantiatedRoutine = await instantiateRoutineFromTemplate(item)
        // Use the new routine and preserve slot timing if available
        // For drag-to-schedule, use the item's type; otherwise use validatedEventType
        setFormData((prev) => ({
          ...prev,
          title: instantiatedRoutine.title,
          type: isDragToSchedule ? EVENT_TYPES.ROUTINE : validatedEventType
        }))
      } catch (err) {
        logger.error('Failed to instantiate routine from template:', err)
        setError('Failed to create routine from template. Please try again.')
        // Reset to a safe state so user can retry, preserving slot timing if available
        setFormData((prev) => ({
          title: '',
          day: prev.day || getCurrentDateISO(),
          startTime: prev.startTime || getCurrentTimeHHMM(),
          endTime: prev.endTime || getCurrentTimePlusMinutes(60),
          type: validatedEventType,
          travelTime: 0,
          preparationTime: 0
        }))
        setShowManualForm(false)
        return
      }
    } else {
      // Preserve slot timing (day, startTime, endTime) if available from drag
      // For drag-to-schedule, use the item's actual type; otherwise use validatedEventType
      setFormData((prev) => ({
        ...prev,
        title: item.title,
        type: isDragToSchedule ? item.type : validatedEventType
      }))
    }
    setShowManualForm(true)
  }

  // Handle creating new routine/task
  const handleCreateNew = () => {
    // In drag-to-schedule mode, when user clicks "Create new", set concrete type
    // instead of keeping it null (which would fall back to 'task' in toFullCalendarEvent)
    // This ensures modal title and saved event are consistent
    setFormData((prev) => ({
      ...prev,
      type:
        prev.type === null ? validatedEventType || EVENT_TYPES.TASK : prev.type
    }))
    setShowManualForm(true)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={getModalTitle()}
        closeOnOverlayClick={false}
      >
        {/* Show search selector for routines/tasks when not in manual form mode */}
        {!showManualForm &&
          (isDragToSchedule ||
            validatedEventType === EVENT_TYPES.ROUTINE ||
            validatedEventType === EVENT_TYPES.TASK) && (
            <SearchableEventSelector
              eventType={isDragToSchedule ? null : validatedEventType}
              onSelect={handleItemSelect}
              onCreateNew={handleCreateNew}
            />
          )}

        {/* Show manual form when creating new or editing existing */}
        {showManualForm && (
          <form onSubmit={handleSubmit} className='event-form'>
            {error && (
              <div className='error-message' role='alert' aria-live='assertive'>
                <Icon name='alertCircle' />
                <span>{error}</span>
              </div>
            )}

            <div className='form-group'>
              <label htmlFor='event-title'>
                Title <span className='required'>*</span>
              </label>
              <input
                id='event-title'
                type='text'
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder='Enter title'
                disabled={isSubmitting}
                required
                maxLength={200}
                ref={titleInputRef}
              />
            </div>

            <div className='form-group'>
              <label htmlFor='event-date'>
                Date <span className='required'>*</span>
              </label>
              <input
                id='event-date'
                type='date'
                value={formData.day}
                onChange={(e) => handleChange('day', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='event-start-time'>
                  Start Time <span className='required'>*</span>
                </label>
                <input
                  id='event-start-time'
                  type='time'
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='event-end-time'>
                  End Time <span className='required'>*</span>
                </label>
                <input
                  id='event-end-time'
                  type='time'
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='event-travel-time'>Travel Time (minutes)</label>
                <input
                  id='event-travel-time'
                  type='number'
                  min='0'
                  max={MAX_TRAVEL_TIME_MINUTES}
                  value={formData.travelTime}
                  onChange={(e) =>
                    handleTimeInputChange(
                      e.target.value,
                      MAX_TRAVEL_TIME_MINUTES,
                      (value) => handleChange('travelTime', value)
                    )
                  }
                  disabled={isSubmitting}
                  aria-describedby='travel-time-help'
                />
                <small id='travel-time-help' className='form-help'>
                  Optional time needed to travel to this event (max{' '}
                  {MAX_TRAVEL_TIME_MINUTES} minutes)
                </small>
              </div>

              <div className='form-group'>
                <label htmlFor='event-preparation-time'>
                  Preparation Time (minutes)
                </label>
                <input
                  id='event-preparation-time'
                  type='number'
                  min='0'
                  max={MAX_PREPARATION_TIME_MINUTES}
                  value={formData.preparationTime}
                  onChange={(e) =>
                    handleTimeInputChange(
                      e.target.value,
                      MAX_PREPARATION_TIME_MINUTES,
                      (value) => handleChange('preparationTime', value)
                    )
                  }
                  disabled={isSubmitting}
                  aria-describedby='preparation-time-help'
                />
                <small id='preparation-time-help' className='form-help'>
                  Optional time needed to prepare for this event (max{' '}
                  {MAX_PREPARATION_TIME_MINUTES} minutes)
                </small>
              </div>
            </div>

            <div className='form-actions'>
              {initialData?.id && onDelete && (
                <button
                  type='button'
                  className='btn btn-danger'
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  aria-label='Delete event'
                >
                  <Icon name='trash2' />
                  Delete
                </button>
              )}
              <button
                type='button'
                className='btn btn-secondary'
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={isSubmitting}
                aria-label={initialData?.id ? 'Save' : 'Schedule'}
              >
                {isSubmitting ? (
                  <>
                    <Icon name='check' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name='check' />
                    {initialData?.id ? 'Save' : 'Schedule'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
      {/* Accessible confirmation dialog for delete action 
          NOTE: ConfirmDialog is rendered as a sibling to Modal (outside its FocusLock).
          This is intentional - ConfirmDialog uses capture-phase Escape handling to
          intercept events before Modal's bubble-phase listener, preventing the parent
          modal from closing. Focus management works because ConfirmDialog auto-focuses
          its cancel button on open, and Modal's Escape handler checks focus containment
          before closing. This pattern works for simple confirm dialogs but may need
          adjustment if more complex nested modal interactions are required. */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title='Confirm Delete'
        message={`Are you sure you want to delete this ${formData.type || 'event'}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText='Delete'
        cancelText='Cancel'
        confirmDanger={true}
      />
    </>
  )
}

EventModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  eventType: PropTypes.oneOf(VALID_EVENT_TYPES),
  initialData: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    day: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    type: PropTypes.oneOf(['routine', 'task', 'meeting', 'habit', null]),
    travelTime: PropTypes.number,
    preparationTime: PropTypes.number
  })
}

export default EventModal
