
import PropTypes from 'prop-types'
import Icon from '../common/Icon'
import { getUniqueCategories } from '../../utils/notes/noteFilters'

/**
 * Modal for filtering notes by category and date
 */
function FilterModal({ notes, filterOptions, onFilterChange, onClose }) {
  const handleClearFilters = () => {
    onFilterChange({
      category: '',
      dateFilter: 'all',
      customStart: '',
      customEnd: ''
    })
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className='modal-overlay'
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role='dialog'
      aria-modal='true'
      aria-labelledby='filter-modal-title'
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className='modal-content'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='document'
      >
        <div className='modal-header'>
          <h2 id='filter-modal-title'>Filter Notes</h2>
          <button type="button" className='btn btn-icon' onClick={onClose} aria-label='Close'>
            <Icon name='x' />
          </button>
        </div>
        <div className='modal-body'>
          <div className='filter-section'>
            <label htmlFor='category-filter'>
              <strong>Category:</strong>
            </label>
            <select
              id='category-filter'
              value={filterOptions.category}
              onChange={(e) =>
                onFilterChange({
                  ...filterOptions,
                  category: e.target.value
                })
              }
              className='filter-select'
            >
              <option value=''>All Categories</option>
              {getUniqueCategories(notes).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className='filter-section'>
            <label htmlFor='date-filter'>
              <strong>Date Filter:</strong>
            </label>
            <select
              id='date-filter'
              value={filterOptions.dateFilter}
              onChange={(e) =>
                onFilterChange({
                  ...filterOptions,
                  dateFilter: e.target.value
                })
              }
              className='filter-select'
            >
              <option value='all'>All Time</option>
              <option value='latest'>Latest (Last 7 days)</option>
              <option value='day'>Today</option>
              <option value='month'>This Month</option>
              <option value='year'>This Year</option>
              <option value='oldest'>Oldest (Over 30 days)</option>
              <option value='custom'>Custom Range</option>
            </select>
          </div>

          {filterOptions.dateFilter === 'custom' && (
            <div className='filter-section'>
              <label htmlFor='custom-start'>
                <strong>Start Date:</strong>
              </label>
              <input
                id='custom-start'
                type='date'
                value={filterOptions.customStart}
                onChange={(e) =>
                  onFilterChange({
                    ...filterOptions,
                    customStart: e.target.value
                  })
                }
                className='filter-input'
              />
              <label htmlFor='custom-end'>
                <strong>End Date:</strong>
              </label>
              <input
                id='custom-end'
                type='date'
                value={filterOptions.customEnd}
                onChange={(e) =>
                  onFilterChange({
                    ...filterOptions,
                    customEnd: e.target.value
                  })
                }
                className='filter-input'
              />
            </div>
          )}

          <div className='filter-actions'>
            <button type="button" className='btn' onClick={handleClearFilters}>
              Clear Filters
            </button>
            <button type="button" className='btn' onClick={onClose}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

FilterModal.propTypes = {
  notes: PropTypes.array.isRequired,
  filterOptions: PropTypes.shape({
    category: PropTypes.string,
    dateFilter: PropTypes.string,
    customStart: PropTypes.string,
    customEnd: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default FilterModal
