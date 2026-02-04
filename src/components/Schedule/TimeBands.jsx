/**
 * TimeBands Component - Provides soft gradient time-of-day visual context
 * Canonical implementation per visual specification
 * 
 * Purpose: Allow users to recognize where they are in the day without reading text
 * Visual hierarchy: Below events (z-index: 1), above background (z-index: 0)
 */

import React from 'react'
import './TimeBands.css'

function TimeBands() {
  // Time ranges for each band (7am to midnight = 17 hours total)
  // These are calculated as percentages of the visible day
  const bands = [
    {
      name: 'morning',
      label: 'Morning',
      startHour: 7,
      endHour: 12,
      top: '0%',
      height: '29.41%' // 5 hours / 17 hours = 29.41%
    },
    {
      name: 'afternoon',
      label: 'Afternoon',
      startHour: 12,
      endHour: 18,
      top: '29.41%',
      height: '35.29%' // 6 hours / 17 hours = 35.29%
    },
    {
      name: 'evening',
      label: 'Evening',
      startHour: 18,
      endHour: 23,
      top: '64.70%',
      height: '29.41%' // 5 hours / 17 hours = 29.41%
    },
    {
      name: 'night',
      label: 'Night',
      startHour: 23,
      endHour: 24, // Only 1 hour visible (23:00-24:00), rest wraps to next day
      top: '94.11%',
      height: '5.89%' // 1 hour / 17 hours = 5.89%
    }
  ]

  return (
    <div className="schedule-bands-container" aria-hidden="true">
      {bands.map((band) => (
        <div
          key={band.name}
          className={`schedule-band ${band.name}`}
          style={{
            top: band.top,
            height: band.height
          }}
          data-time-range={`${band.startHour}:00-${band.endHour}:00`}
        />
      ))}
    </div>
  )
}

export default TimeBands
