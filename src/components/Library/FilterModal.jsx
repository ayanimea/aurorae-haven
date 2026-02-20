/**
 * FilterModal Component
 * Modal for filtering templates
 * TAB-LIB-05
 */

import { useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'

function FilterModal({ filters, onFilterChange, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApply = () => {
    onFilterChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = {
      type: null,
      tags: [],
      durationMin: null,
      durationMax: null
    }
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay closes modal on click
    <div
      className='modal-overlay'
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role='presentation'
    >
      <div
        className='modal-content filter-modal'
        role='dialog'
        aria-labelledby='filter-title'
        aria-modal='true'
      >
        <div className='modal-header'>
          <h2 id='filter-title'>Filter Templates</h2>
          <button type="button"
            className='btn-close'
            onClick={onClose}
            aria-label='Close filter'
          >
            <Icon name='x' />
          </button>
        </div>

        <div className='modal-body'>
          {/* Type filter */}
          <div className='form-group'>
            <label htmlFor='filter-type'>Type</label>
            <select
              id='filter-type'
              value={localFilters.type || ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  type: e.target.value || null
                })
              }
            >
              <option value=''>All Types</option>
              <option value='task'>Task</option>
              <option value='routine'>Routine</option>
            </select>
          </div>

          {/* Duration range (for routines) */}
          <div className='form-group'>
            <div className='form-label'>Duration Range (seconds)</div>
            <div className='range-inputs'>
              <input
                type='number'
                placeholder='Min'
                value={localFilters.durationMin || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    durationMin: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null
                  })
                }
                aria-label='Minimum duration'
              />
              <span>to</span>
              <input
                type='number'
                placeholder='Max'
                value={localFilters.durationMax || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    durationMax: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null
                  })
                }
                aria-label='Maximum duration'
              />
            </div>
          </div>

          {/* Active filters summary */}
          <div className='active-filters'>
            <strong className='small'>Active Filters:</strong>
            {localFilters.type && (
              <span className='filter-chip'>Type: {localFilters.type}</span>
            )}
            {(localFilters.durationMin || localFilters.durationMax) && (
              <span className='filter-chip'>
                Duration: {localFilters.durationMin || '0'}–
                {localFilters.durationMax || '∞'}s
              </span>
            )}
            {!localFilters.type &&
              !localFilters.durationMin &&
              !localFilters.durationMax && (
                <span className='small dim'>No filters applied</span>
              )}
          </div>
        </div>

        <div className='modal-actions'>
          <button type='button' className='btn' onClick={handleReset}>
            Reset
          </button>
          <button type='button' className='btn' onClick={onClose}>
            Cancel
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={handleApply}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

FilterModal.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    durationMin: PropTypes.number,
    durationMax: PropTypes.number
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default FilterModal
