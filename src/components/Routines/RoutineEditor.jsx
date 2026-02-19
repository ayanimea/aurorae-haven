/**
 * Routine Editor Component
 * Form for creating or editing routines with steps
 */

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

function RoutineEditor({ routine, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(routine?.name || routine?.title || '')
  const [tags, setTags] = useState(routine?.tags?.join(', ') || '')
  const [steps, setSteps] = useState(
    routine?.steps || [
      {
        label: '',
        duration: 300, // 5 minutes default
        description: ''
      }
    ]
  )

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        label: '',
        duration: 300,
        description: ''
      }
    ])
  }

  const handleRemoveStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps]
    newSteps[index] = {
      ...newSteps[index],
      [field]: field === 'duration' ? parseInt(value, 10) || 0 : value
    }
    setSteps(newSteps)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate
    if (!name.trim()) {
      return
    }

    const validSteps = steps.filter((step) => step.label.trim())
    if (validSteps.length === 0) {
      return
    }

    // Prepare routine data
    const routineData = {
      ...(routine?.id && { id: routine.id }),
      name: name.trim(),
      title: name.trim(), // For compatibility
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      steps: validSteps
    }

    onSave(routineData)
  }

  const totalDuration = steps.reduce(
    (sum, step) => sum + (step.duration || 0),
    0
  )

  return (
    <form onSubmit={handleSubmit} className='routine-editor'>
      {/* Routine Name */}
      <div className='form-group' style={{ marginBottom: '16px' }}>
        <label htmlFor='routine-name' className='form-label'>
          <strong>Routine Name</strong>
        </label>
        <input
          id='routine-name'
          type='text'
          placeholder='Enter routine name...'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='form-input'
          required
          disabled={isSaving}
        />
      </div>

      {/* Tags */}
      <div className='form-group' style={{ marginBottom: '16px' }}>
        <label htmlFor='routine-tags' className='form-label'>
          Tags (comma-separated)
        </label>
        <input
          id='routine-tags'
          type='text'
          placeholder='morning, focus, wellness...'
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className='form-input'
          disabled={isSaving}
        />
      </div>

      {/* Steps */}
      <div className='form-group' style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}
        >
          <strong className='form-label'>Steps</strong>
          <button
            type='button'
            className='btn btn-small'
            onClick={handleAddStep}
            disabled={isSaving}
            aria-label='Add step'
          >
            <Icon name='plus' />
            Add Step
          </button>
        </div>

        <div className='routine-steps-list'>
          {steps.map((step, index) => (
            <div
              key={index}
              className='routine-step-editor'
              style={{
                padding: '12px',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                marginBottom: '8px',
                backgroundColor: 'var(--glass-bg)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span className='small' style={{ opacity: 0.7 }}>
                  Step {index + 1}
                </span>
                {steps.length > 1 && (
                  <button
                    type='button'
                    className='btn-icon'
                    onClick={() => handleRemoveStep(index)}
                    disabled={isSaving}
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <Icon name='trash' />
                  </button>
                )}
              </div>

              <input
                type='text'
                placeholder='Step name...'
                value={step.label}
                onChange={(e) =>
                  handleStepChange(index, 'label', e.target.value)
                }
                className='form-input'
                style={{ marginBottom: '8px' }}
                required
                disabled={isSaving}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr',
                  gap: '8px',
                  marginBottom: '8px'
                }}
              >
                <div>
                  <label
                    htmlFor={`step-${index}-duration`}
                    className='form-label small'
                  >
                    Duration (sec)
                  </label>
                  <input
                    id={`step-${index}-duration`}
                    type='number'
                    min='1'
                    value={step.duration}
                    onChange={(e) =>
                      handleStepChange(index, 'duration', e.target.value)
                    }
                    className='form-input'
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`step-${index}-description`}
                    className='form-label small'
                  >
                    Description (optional)
                  </label>
                  <input
                    id={`step-${index}-description`}
                    type='text'
                    placeholder='Step description...'
                    value={step.description || ''}
                    onChange={(e) =>
                      handleStepChange(index, 'description', e.target.value)
                    }
                    className='form-input'
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='small' style={{ opacity: 0.7, marginTop: '8px' }}>
          Total duration: {Math.floor(totalDuration / 60)} min{' '}
          {totalDuration % 60} sec
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className='form-actions'
        style={{ display: 'flex', gap: '8px', marginTop: '16px' }}
      >
        <button
          type='submit'
          className='btn btn-primary'
          disabled={
            isSaving || !name.trim() || steps.every((s) => !s.label.trim())
          }
        >
          <Icon name='check' />
          {isSaving ? 'Creating...' : 'Create Routine'}
        </button>
        <button
          type='button'
          className='btn'
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

RoutineEditor.propTypes = {
  routine: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSaving: PropTypes.bool
}

RoutineEditor.defaultProps = {
  routine: null,
  isSaving: false
}

export default RoutineEditor
