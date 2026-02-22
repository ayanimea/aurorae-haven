/**
 * TimeBands Component - Provides soft gradient time-of-day visual context
 * Canonical implementation per visual specification
 *
 * Purpose: Allow users to recognize where they are in the day without reading text
 * Visual hierarchy: Behind FullCalendar (z-index: 0), visible through semi-transparent .fc background
 *
 * Bands are absolutely positioned within .schedule-calendar-container (position: relative).
 * Percentages represent proportions of the visible time range (07:00–24:00 = 17 hours):
 *   Morning   07:00–12:00  5h / 17h = 29.41%
 *   Afternoon 12:00–18:00  6h / 17h = 35.29%
 *   Evening   18:00–23:00  5h / 17h = 29.41%
 *   Night     23:00–24:00  1h / 17h =  5.89%
 */

import './TimeBands.css'

function TimeBands() {
  return (
    <div className='schedule-bands' aria-hidden='true'>
      <div className='schedule-band morning' />
      <div className='schedule-band afternoon' />
      <div className='schedule-band evening' />
      <div className='schedule-band night' />
    </div>
  )
}

export default TimeBands
