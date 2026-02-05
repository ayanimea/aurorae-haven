/**
 * TemplateEditor Component
 * Modal for creating/editing templates
 * TAB-LIB-07, TAB-LIB-11
 */

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * Convert a numeric string value to a number or null
 * @param {string} value - The value to convert
 * @returns {number|null} The converted number or null if empty
 */
function convertToNumberOrNull(value) {
  if (value && value !== '') {
    const num = Number(value)
    return isNaN(num) ? null : num
  }
  return null
}

function TemplateEditor({ template, onSave, onClose }) {
  const [formData, setFormData] = useState(() => {
    if (template) {
      return {
        type: template.type,
        title: template.title,
        tags: template.tags || [],
        category: template.category || '',
        quadrant: template.quadrant || 'urgent_important',
        dueOffset: template.dueOffset || '',
        steps: template.steps || [],
        energyTag: template.energyTag || '',
        estimatedDuration: template.estimatedDuration || '',
        duration: template.duration || '',
        description: template.description || ''
      }
    }
    return {
      type: 'task',
      title: '',
      tags: [],
      category: '',
      quadrant: 'urgent_important',
      dueOffset: '',
      steps: [],
      energyTag: '',
      estimatedDuration: '',
      duration: '',
      description: ''
    }
  })

  const [tagInput, setTagInput] = useState('')
  const [stepInput, setStepInput] = useState({
    label: '',
    duration: '',
    description: ''
  })
  const [errors, setErrors] = useState({})

  // Sync form data with template prop
  useEffect(() => {
    // Update form data when template changes
    if (template) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        type: template.type,
        title: template.title,
        tags: template.tags || [],
        category: template.category || '',
        quadrant: template.quadrant || 'urgent_important',
        dueOffset: template.dueOffset || '',
        steps: template.steps || [],
        energyTag: template.energyTag || '',
        estimatedDuration: template.estimatedDuration || '',
        duration: template.duration || '',
        description: template.description || ''
      })
    }
  }, [template])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.type === 'routine' && formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required for routines'
    }

    if (formData.estimatedDuration && Number(formData.estimatedDuration) < 0) {
      newErrors.estimatedDuration = 'Duration cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    // Convert numeric fields to numbers (or null if empty)
    const templateData = {
      ...formData,
      dueOffset: convertToNumberOrNull(formData.dueOffset),
      estimatedDuration: convertToNumberOrNull(formData.estimatedDuration),
      steps: formData.steps.map((step) => ({
        ...step,
        duration: convertToNumberOrNull(step.duration)
      }))
    }

    onSave(templateData)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove)
    })
  }

  const handleAddStep = () => {
    if (stepInput.label.trim()) {
      setFormData({
        ...formData,
        steps: [
          ...formData.steps,
          {
            label: stepInput.label,
            duration: parseInt(stepInput.duration) || 0,
            description: stepInput.description
          }
        ]
      })
      setStepInput({ label: '', duration: '', description: '' })
    }
  }

  const handleRemoveStep = (index) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index)
    })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className='modal-overlay'
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role='presentation'
    >
      <div
        className='modal-content template-editor'
        role='dialog'
        aria-labelledby='editor-title'
        aria-modal='true'
      >
        <div className='modal-header'>
          <h2 id='editor-title'>
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button
            className='btn-close'
            onClick={onClose}
            aria-label='Close editor'
          >
            <Icon name='x' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='modal-body'>
          {/* Template Type */}
          <div className='form-group'>
            <label htmlFor='type'>Type *</label>
            <select
              id='type'
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              disabled={!!template}
              required
            >
              <option value='task'>Task</option>
              <option value='routine'>Routine</option>
            </select>
          </div>

          {/* Title */}
          <div className='form-group'>
            <label htmlFor='title'>Title *</label>
            <input
              id='title'
              type='text'
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder='Template title'
              required
              aria-describedby={errors.title ? 'title-error' : undefined}
              aria-invalid={errors.title ? 'true' : 'false'}
            />
            {errors.title && (
              <span id='title-error' className='error-message' role='alert'>
                {errors.title}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className='form-group'>
            <label htmlFor='tag-input'>Tags</label>
            <div className='tag-input-container'>
              <input
                id='tag-input'
                type='text'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder='Add tag'
              />
              <button
                type='button'
                className='btn btn-sm'
                onClick={handleAddTag}
              >
                Add
              </button>
            </div>
            <div className='tags-list'>
              {formData.tags.map((tag, idx) => (
                <span key={idx} className='tag-chip'>
                  {tag}
                  <button
                    type='button'
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Task-specific fields */}
          {formData.type === 'task' && (
            <>
              <div className='form-group'>
                <label htmlFor='category'>Category</label>
                <input
                  id='category'
                  type='text'
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder='e.g., Work, Personal'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='quadrant'>Default Quadrant</label>
                <select
                  id='quadrant'
                  value={formData.quadrant}
                  onChange={(e) =>
                    setFormData({ ...formData, quadrant: e.target.value })
                  }
                >
                  <option value='urgent_important'>Urgent & Important</option>
                  <option value='not_urgent_important'>
                    Not Urgent & Important
                  </option>
                  <option value='urgent_not_important'>
                    Urgent & Not Important
                  </option>
                  <option value='not_urgent_not_important'>
                    Not Urgent & Not Important
                  </option>
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='dueOffset'>Due Date Offset (days)</label>
                <input
                  id='dueOffset'
                  type='number'
                  value={formData.dueOffset}
                  onChange={(e) =>
                    setFormData({ ...formData, dueOffset: e.target.value })
                  }
                  placeholder='e.g., 7 for one week'
                />
              </div>
            </>
          )}

          {/* Routine-specific fields */}
          {formData.type === 'routine' && (
            <>
              <div className='form-group'>
                <div className='form-label'>Steps *</div>
                <div className='step-input-container'>
                  <input
                    type='text'
                    value={stepInput.label}
                    onChange={(e) =>
                      setStepInput({ ...stepInput, label: e.target.value })
                    }
                    placeholder='Step label'
                  />
                  <input
                    type='number'
                    value={stepInput.duration}
                    onChange={(e) =>
                      setStepInput({ ...stepInput, duration: e.target.value })
                    }
                    placeholder='Duration (sec)'
                    style={{ width: '120px' }}
                  />
                  <button
                    type='button'
                    className='btn btn-sm'
                    onClick={handleAddStep}
                  >
                    Add Step
                  </button>
                </div>
                <div className='steps-list'>
                  {formData.steps.map((step, idx) => (
                    <div key={idx} className='step-item'>
                      <span className='step-label'>{step.label}</span>
                      <span className='step-duration'>{step.duration}s</span>
                      <button
                        type='button'
                        onClick={() => handleRemoveStep(idx)}
                        aria-label={`Remove ${step.label} step`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {errors.steps && (
                  <span className='error-message' role='alert'>
                    {errors.steps}
                  </span>
                )}
              </div>

              <div className='form-group'>
                <label htmlFor='energyTag'>Energy Tag</label>
                <select
                  id='energyTag'
                  value={formData.energyTag}
                  onChange={(e) =>
                    setFormData({ ...formData, energyTag: e.target.value })
                  }
                >
                  <option value=''>None</option>
                  <option value='low'>Low Energy</option>
                  <option value='medium'>Medium Energy</option>
                  <option value='high'>High Energy</option>
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='estimatedDuration'>
                  Estimated Duration (seconds)
                </label>
                <input
                  id='estimatedDuration'
                  type='number'
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedDuration: e.target.value
                    })
                  }
                  placeholder='Total duration in seconds'
                  aria-describedby={
                    errors.estimatedDuration ? 'duration-error' : undefined
                  }
                  aria-invalid={!!errors.estimatedDuration}
                />
                {errors.estimatedDuration && (
                  <span
                    id='duration-error'
                    className='error-message'
                    role='alert'
                  >
                    {errors.estimatedDuration}
                  </span>
                )}
              </div>
            </>
          )}

          <div className='modal-actions'>
            <button type='button' className='btn' onClick={onClose}>
              Cancel
            </button>
            <button type='submit' className='btn btn-primary'>
              {template ? 'Update' : 'Create'} Template
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

TemplateEditor.propTypes = {
  template: PropTypes.shape({
    type: PropTypes.string,
    title: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    quadrant: PropTypes.string,
    dueOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    steps: PropTypes.arrayOf(PropTypes.object),
    energyTag: PropTypes.string,
    estimatedDuration: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    duration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default TemplateEditor
