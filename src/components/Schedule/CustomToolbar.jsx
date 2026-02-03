/**
 * Custom Toolbar for React Big Calendar
 * Matches existing Schedule UI styling and functionality
 */

import React from 'react'
import PropTypes from 'prop-types'
import Icon from '../../components/common/Icon'
import { format } from 'date-fns'

function CustomToolbar({
  date,
  view,
  views,
  onNavigate,
  onView,
  show24Hours,
  onToggle24Hours,
  onScheduleEvent,
  EVENT_TYPES
}) {
  const viewLabels = {
    day: 'Day',
    week: 'Week',
    month: 'Month'
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
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    return isToday ? `Today · ${formatDate()}` : formatDate()
  }

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <h2>Schedule</h2>
        <p className="date-display">{getTodayLabel()}</p>
      </div>

      <div className="toolbar-right">
        {/* Navigation buttons */}
        <div className="nav-buttons">
          <button
            type="button"
            onClick={handlePrev}
            className="btn-icon"
            aria-label="Previous period"
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="btn-secondary"
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn-icon"
            aria-label="Next period"
          >
            <Icon name="chevronRight" />
          </button>
        </div>

        {/* View mode selector */}
        <div className="view-selector">
          <label htmlFor="view-mode">View:</label>
          <select
            id="view-mode"
            value={view}
            onChange={(e) => onView(e.target.value)}
            className="view-dropdown"
            aria-label="Change view mode"
          >
            {views.map((v) => (
              <option key={v} value={v}>
                {viewLabels[v] || v}
              </option>
            ))}
          </select>
        </div>

        {/* 24-hour toggle */}
        <button
          type="button"
          onClick={onToggle24Hours}
          className="btn-secondary"
          aria-label={`Switch to ${show24Hours ? '12' : '24'}-hour format`}
        >
          <Icon name="clock" />
          {show24Hours ? '24h' : '12h'}
        </button>

        {/* Schedule event button */}
        <div className="schedule-event-dropdown">
          <button
            type="button"
            className="btn-primary"
            aria-label="Schedule an event"
            onClick={() => onScheduleEvent(EVENT_TYPES.TASK)}
          >
            <Icon name="plus" />
            Schedule
          </button>
        </div>
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
  show24Hours: PropTypes.bool.isRequired,
  onToggle24Hours: PropTypes.func.isRequired,
  onScheduleEvent: PropTypes.func.isRequired,
  EVENT_TYPES: PropTypes.object.isRequired
}

export default CustomToolbar
