/**
 * Custom Toolbar for React Big Calendar
 * Matches existing Schedule UI styling and functionality
 */

import React from 'react'
import PropTypes from 'prop-types'
import Icon from '../../components/common/Icon'
import { format, isSameDay } from 'date-fns'
import { isDevelopment } from '../../utils/environment'
import './CustomToolbar.css'

function CustomToolbar({
  date,
  view,
  views,
  onNavigate,
  onView,
  onScheduleEvent,
  EVENT_TYPES,
  onPopulateFakeData,
  onClearAllEvents,
  isLoading
}) {
  const viewLabels = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    // FullCalendar view names
    timeGridDay: 'Day',
    timeGridWeek: 'Week',
    dayGridMonth: 'Month'
  }

  const handleToday = () => {
    onNavigate('TODAY')
  }

  const handlePrev = () => {
    onNavigate('PREV')
  }

  const handleNext = () => {
    onNavigate('NEXT')
  }

  // Format date display
  const formatDate = () => {
    return format(date, 'dd/MM/yyyy')
  }

  const getTodayLabel = () => {
    const today = new Date()
    // Use date-fns isSameDay for robust date comparison
    const isToday = isSameDay(date, today)

    return isToday ? `Today · ${formatDate()}` : formatDate()
  }

  return (
    <div className='calendar-toolbar'>
      <div className='toolbar-left'>
        <h2>Schedule</h2>
        <p className='date-display'>{getTodayLabel()}</p>
      </div>

      <div className='toolbar-right'>
        {/* Navigation buttons */}
        <div className='nav-buttons'>
          <button
            type='button'
            onClick={handlePrev}
            className='btn-icon'
            aria-label='Previous period'
          >
            <Icon name='chevronLeft' />
          </button>
          <button
            type='button'
            onClick={handleToday}
            className='btn-secondary'
            aria-label='Go to today'
          >
            Today
          </button>
          <button
            type='button'
            onClick={handleNext}
            className='btn-icon'
            aria-label='Next period'
          >
            <Icon name='chevronRight' />
          </button>
        </div>

        {/* View mode selector */}
        <div className='view-selector'>
          <label htmlFor='view-mode'>View:</label>
          <select
            id='view-mode'
            value={view}
            onChange={(e) => onView(e.target.value)}
            className='view-dropdown'
            aria-label='Change view mode'
          >
            {views.map((v) => (
              <option key={v} value={v}>
                {viewLabels[v] || v}
              </option>
            ))}
          </select>
        </div>

        {/* Development-only fake data buttons */}
        {isDevelopment() && (
          <div className='dev-buttons'>
            <button
              type='button'
              className='btn-secondary'
              aria-label='Populate fake data'
              onClick={onPopulateFakeData}
              disabled={isLoading}
              title='Add fake events for testing (dev only)'
            >
              🎲 Fake Data
            </button>
            <button
              type='button'
              className='btn-secondary'
              aria-label='Clear all events'
              onClick={onClearAllEvents}
              disabled={isLoading}
              title='Remove all events (dev only)'
            >
              🗑️ Clear
            </button>
          </div>
        )}

        {/* Schedule event button */}
        <button
          type='button'
          className='btn-primary'
          aria-label='Schedule an event'
          onClick={() => onScheduleEvent(EVENT_TYPES.TASK)}
        >
          <Icon name='plus' />
          Schedule
        </button>
      </div>
    </div>
  )
}

CustomToolbar.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  view: PropTypes.string.isRequired,
  views: PropTypes.arrayOf(PropTypes.string).isRequired,
  onNavigate: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onScheduleEvent: PropTypes.func.isRequired,
  EVENT_TYPES: PropTypes.object.isRequired,
  onPopulateFakeData: PropTypes.func,
  onClearAllEvents: PropTypes.func,
  isLoading: PropTypes.bool
}

export default CustomToolbar
