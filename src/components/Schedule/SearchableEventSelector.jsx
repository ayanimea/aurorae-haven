import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'
import {
  searchRoutinesAndTasks,
  getAllRoutinesAndTasks
} from '../../utils/scheduleHelpers'
import { createLogger } from '../../utils/logger'

const logger = createLogger('SearchableEventSelector')

/**
 * SearchableEventSelector - Component for searching and selecting existing routines/tasks
 * Provides a search-first workflow with dropdown of existing items before creating new ones.
 * Important tasks are automatically prioritized at the top of results.
 *
 * @component
 * @param {Object} props - Component props
 * @param {('routine'|'task'|'meeting'|'habit')} props.eventType - Type of event to search/create
 * @param {Function} props.onSelect - Callback when an existing item is selected. Receives the selected item object.
 * @param {Function} props.onCreateNew - Callback when "create new" button is clicked
 * @returns {React.ReactElement|null} The search component or null if eventType doesn't support search
 *
 * @example
 * <SearchableEventSelector
 *   eventType="task"
 *   onSelect={(item) => console.log('Selected:', item)}
 *   onCreateNew={() => console.log('Create new')}
 * />
 */
function SearchableEventSelector({ eventType, onSelect, onCreateNew }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Load all items when component mounts or eventType changes
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true)
      try {
        // Only show routines and tasks in search (meetings and habits are created from scratch)
        const shouldSearch = eventType === 'routine' || eventType === 'task'
        if (shouldSearch) {
          const items = await getAllRoutinesAndTasks(eventType)
          setSearchResults(items)
        } else {
          setSearchResults([])
        }
      } catch (err) {
        logger.error('Failed to load items:', err)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
  }, [eventType])

  // Search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        // If no search query, show all items
        try {
          const items = await getAllRoutinesAndTasks(eventType)
          setSearchResults(items)
        } catch (err) {
          logger.error('Failed to load items for empty search query:', err)
          setSearchResults([])
        }
        return
      }

      setIsLoading(true)
      try {
        const results = await searchRoutinesAndTasks(searchQuery, eventType)
        setSearchResults(results)
      } catch (err) {
        logger.error('Search failed:', err)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, eventType])

  /**
   * Handle input focus - opens dropdown and focuses search input
   * @callback
   */
  const handleInputFocus = useCallback(() => {
    setShowDropdown(true)
  }, [])

  /**
   * Handle item selection from dropdown
   * @callback
   * @param {Object} item - The selected item (routine or task)
   */
  const handleItemSelect = useCallback(
    (item) => {
      onSelect(item)
      setSearchQuery('')
      setShowDropdown(false)
    },
    [onSelect]
  )

  /**
   * Handle create new button click
   * @callback
   */
  const handleCreateNew = useCallback(() => {
    onCreateNew()
    setShowDropdown(false)
  }, [onCreateNew])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Handle keyboard navigation
   * Supports: Escape key to close dropdown
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      searchInputRef.current?.blur()
    }
  }, [])

  // Only show search for routines and tasks (not meetings or habits)
  const shouldShowSearch = eventType === 'routine' || eventType === 'task'

  // Memoize result count for better performance
  const resultCount = useMemo(
    () => searchResults.length,
    [searchResults.length]
  )

  // Memoize result count text for UX feedback
  const resultCountText = useMemo(() => {
    if (isLoading) return ''
    if (resultCount === 0) return ''
    const plural = resultCount === 1 ? '' : 's'
    return `${resultCount} ${eventType}${plural} found`
  }, [isLoading, resultCount, eventType])

  if (!shouldShowSearch) {
    return null
  }

  return (
    <div className='searchable-event-selector'>
      <div className='form-group'>
        <label htmlFor='event-search'>
          Search existing {eventType}s or create new
        </label>
        <div className='search-input-wrapper'>
          <Icon name='search' />
          <input
            id='event-search'
            ref={searchInputRef}
            type='text'
            className='search-input'
            placeholder={`Search for an existing ${eventType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            aria-label={`Search for existing ${eventType}`}
            aria-controls='search-results-dropdown'
            aria-busy={isLoading}
            aria-describedby='search-hint'
            autoComplete='off'
            role='combobox'
            aria-expanded={showDropdown}
          />
        </div>
        <div id='search-hint' className='search-hint' aria-live='polite'>
          {resultCountText || 'Press Esc to close dropdown'}
        </div>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          id='search-results-dropdown'
          className='search-dropdown'
          role='listbox'
          aria-label='Search results'
          aria-busy={isLoading}
        >
          {isLoading ? (
            <div
              className='search-dropdown-loading'
              role='status'
              aria-live='polite'
            >
              <Icon name='loader' />
              <span>Searching {eventType}s...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className='search-dropdown-header'>
                <span>Select an existing {eventType}</span>
                {resultCountText && (
                  <span className='search-dropdown-count'>
                    {resultCountText}
                  </span>
                )}
                {eventType === 'task' && (
                  <span className='search-dropdown-hint'>
                    Important tasks shown first
                  </span>
                )}
              </div>
              <div className='search-dropdown-list'>
                {searchResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type='button'
                    className='search-dropdown-item'
                    onClick={() => handleItemSelect(item)}
                    role='option'
                    aria-selected='false'
                    aria-label={`${item.title}${item.isImportant ? ' (Important)' : ''}${item.quadrantLabel ? ` - ${item.quadrantLabel}` : ''}${item.isTemplate ? ' (From Library)' : ''}`}
                  >
                    <div className='search-dropdown-item-content'>
                      <div className='search-dropdown-item-header'>
                        <Icon
                          name={
                            item.type === 'routine' ? 'repeat' : 'checkCircle'
                          }
                        />
                        <span className='search-dropdown-item-title'>
                          {item.title}
                        </span>
                        {item.isImportant && (
                          <span className='search-dropdown-item-badge important'>
                            Important
                          </span>
                        )}
                        {item.isTemplate && (
                          <span className='search-dropdown-item-badge template'>
                            Library
                          </span>
                        )}
                      </div>
                      {item.quadrantLabel && (
                        <div className='search-dropdown-item-meta'>
                          {item.quadrantLabel}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className='search-dropdown-empty' role='status'>
              <Icon name='inbox' />
              <p>
                No {eventType}s found
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          )}

          <div className='search-dropdown-footer'>
            <button
              type='button'
              className='btn btn-primary'
              onClick={handleCreateNew}
              aria-label={`Create new ${eventType}`}
            >
              <Icon name='plus' />
              Create new {eventType}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

SearchableEventSelector.propTypes = {
  eventType: PropTypes.oneOf(['routine', 'task', 'meeting', 'habit'])
    .isRequired,
  onSelect: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired
}

export default SearchableEventSelector
