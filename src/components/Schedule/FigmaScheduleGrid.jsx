/**
 * FigmaScheduleGrid — thin orchestrator that delegates to DayView / WeekView / MonthView.
 * Visual design ported from Figma ZIP: src/app/pages/Schedule.tsx
 *
 * Props:
 *   - events: array of {id, title, type, day (yyyy-MM-dd), startTime (HH:mm), endTime (HH:mm)}
 *   - onEventClick(event) → opens ItemActionModal for the selected event
 *   - onSlotClick({day, startTime, endTime}) → opens EventModal to create a new event
 *   - date: current navigation Date
 *   - viewMode: 'day' | 'week' | 'month'
 *
 * The heavy view logic lives in:
 *   DayView.jsx / WeekView.jsx / MonthView.jsx
 * Shared helpers live in:
 *   scheduleConstants.js / scheduleHooks.js / NoiseOverlays.jsx
 */
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

import DayView from './DayView.jsx'
import WeekView from './WeekView.jsx'
import MonthView from './MonthView.jsx'

/* Re-export shared constants so existing importers (e.g. Schedule.jsx) don't break */
export { PERIOD_COLORS, EVENT_TYPE_COLORS } from './scheduleConstants.js'

function FigmaScheduleGrid({ events, viewMode, date, onEventClick, onSlotClick, onEventDrop, use24HourFormat }) {
  /* Update "now" every 60 s so the indicator stays accurate without stale renders */
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const nowHour = now.getHours() + now.getMinutes() / 60

  if (viewMode === 'day') {
    return (
      <DayView
        events={events.filter((e) => e.day === format(date, 'yyyy-MM-dd') && e.startTime && e.endTime && !e.allDay)}
        nowHour={nowHour}
        onEventClick={onEventClick}
        onSlotClick={onSlotClick}
        onEventDrop={onEventDrop}
        date={date}
        use24HourFormat={use24HourFormat}
      />
    )
  }

  if (viewMode === 'week') {
    return (
      <WeekView
        events={events}
        nowHour={nowHour}
        onEventClick={onEventClick}
        onSlotClick={onSlotClick}
        onEventDrop={onEventDrop}
        date={date}
        use24HourFormat={use24HourFormat}
      />
    )
  }

  return (
    <MonthView
      events={events}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
      date={date}
    />
  )
}

FigmaScheduleGrid.propTypes = {
  events: PropTypes.array.isRequired,
  viewMode: PropTypes.oneOf(['day', 'week', 'month']).isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  onEventDrop: PropTypes.func,
  use24HourFormat: PropTypes.bool
}

export default FigmaScheduleGrid
