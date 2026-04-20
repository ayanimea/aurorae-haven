import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { CATEGORY_OPTIONS } from '../../utils/habitCategories'

/**
 * FilterModal - Filter habits by category, status, and other criteria
 * TAB-HAB-04: Filter by Type, Category, Tags, Status
 */
function FilterModal({
  isOpen,
  currentFilters = { categories: [], status: 'all' },
  onApply,
  onClose
}) {
  const [localFilters, setLocalFilters] = useState(() => ({
    categories: currentFilters?.categories || [],
    status: currentFilters?.status || 'all'
  }))

  // Sync local filters with prop changes
  useEffect(() => {
    // Update local filters when currentFilters prop changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalFilters({
      categories: currentFilters?.categories || [],
      status: currentFilters?.status || 'all'
    })
  }, [currentFilters])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCategoryToggle = (categoryValue) => {
    const categories = [...localFilters.categories]
    const index = categories.indexOf(categoryValue)
    if (index === -1) {
      categories.push(categoryValue)
    } else {
      categories.splice(index, 1)
    }
    setLocalFilters({ ...localFilters, categories })
  }

  const handleApply = () => {
    onApply(localFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      categories: [],
      status: 'all'
    }
    setLocalFilters(resetFilters)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200 /* --z-modal */
      }}
      role='presentation'
    >
      <div
        className='card-b'
        style={{
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        role='dialog'
        aria-modal='true'
        aria-label='Filter Habits'
      >
        <strong
          id='filter-modal-title'
          style={{
            fontSize: '1.25rem',
            display: 'block',
            marginBottom: '1rem'
          }}
        >
          Filter Habits
        </strong>

        {/* Category Filter */}
        <div style={{ marginBottom: '1rem' }}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              Categories
            </legend>
            {CATEGORY_OPTIONS.filter((cat) => cat.value !== 'default').map(
              (cat) => (
                <div key={cat.value} style={{ marginBottom: '0.5rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={localFilters.categories.includes(cat.value)}
                      onChange={() => handleCategoryToggle(cat.value)}
                      aria-label={cat.label}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {cat.label}
                  </label>
                </div>
              )
            )}
          </fieldset>
        </div>

        {/* Status Filter */}
        <div style={{ marginBottom: '1rem' }}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              Status
            </legend>
            {['all', 'active', 'paused'].map((statusOption) => (
              <div key={statusOption} style={{ marginBottom: '0.5rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type='radio'
                    name='status'
                    value={statusOption}
                    checked={localFilters.status === statusOption}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        status: e.target.value
                      })
                    }
                    aria-label={
                      statusOption.charAt(0).toUpperCase() +
                      statusOption.slice(1)
                    }
                    style={{ marginRight: '0.5rem' }}
                  />
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </label>
              </div>
            ))}
          </fieldset>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
            marginTop: '1.5rem'
          }}
        >
          <button
            type='button'
            className='btn-outline'
            onClick={handleReset}
            style={{ padding: '0.5rem 1rem' }}
          >
            Reset
          </button>
          <button
            type='button'
            className='btn-outline'
            onClick={onClose}
            style={{ padding: '0.5rem 1rem' }}
          >
            Cancel
          </button>
          <button
            type='button'
            className='btn-primary'
            onClick={handleApply}
            style={{ padding: '0.5rem 1rem' }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

FilterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  currentFilters: PropTypes.object,
  onApply: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default FilterModal
