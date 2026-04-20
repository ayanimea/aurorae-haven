/**
 * MonthView — monthly calendar grid with roving tabindex keyboard navigation.
 * Extracted from FigmaScheduleGrid.jsx.
 */
import { useMemo, useState, useRef, useCallback, useId } from 'react'
import { format, startOfWeek, addDays, startOfMonth } from 'date-fns'
import PropTypes from 'prop-types'

import { EVENT_TYPE_COLORS, LINE_COLOR } from './scheduleConstants.js'
import { NoiseOverlay } from './NoiseOverlays.jsx'

export default function MonthView({ events, onEventClick, onSlotClick, date }) {
  const monthStart = startOfMonth(date)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const monthLabel = format(date, 'MMMM yyyy').toUpperCase()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthNum = date.getMonth()

  /* Roving tabindex — only one cell has tabIndex=0 at a time to reduce tab stops.
     Default to today's cell, or the first cell if today is not in the grid. */
  const todayCellIdx = cells.findIndex((d) => format(d, 'yyyy-MM-dd') === todayStr)
  const [focusedIdx, setFocusedIdx] = useState(todayCellIdx >= 0 ? todayCellIdx : 0)
  const gridRef = useRef(null)

  const focusCellAt = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(41, idx))
    setFocusedIdx(clamped)
    requestAnimationFrame(() => {
      gridRef.current?.querySelector(`[data-month-cell="${clamped}"]`)?.focus()
    })
  }, [])

  const handleCellKeyDown = useCallback((e, i) => {
    const dayStr = format(cells[i], 'yyyy-MM-dd')
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSlotClick({ day: dayStr, startTime: '09:00', endTime: '10:00' })
    } else if (e.key === 'ArrowRight') { e.preventDefault(); focusCellAt(i + 1) }
    else if (e.key === 'ArrowLeft')   { e.preventDefault(); focusCellAt(i - 1) }
    else if (e.key === 'ArrowDown')   { e.preventDefault(); focusCellAt(i + 7) }
    else if (e.key === 'ArrowUp')     { e.preventDefault(); focusCellAt(i - 7) }
  }, [cells, onSlotClick, focusCellAt])

  /* Pre-index events by day so each cell does an O(1) lookup */
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const evt of events) {
      if (!map[evt.day]) map[evt.day] = []
      map[evt.day].push(evt)
    }
    return map
  }, [events])

  /* Single shared SVG turbulence filter for all 42 month cells — same pattern as WeekView. */
  const monthCellNoiseUid = useId()
  const monthCellNoiseFilterId = `monthCellNoise-${monthCellNoiseUid.replace(/:/g, '')}`

  return (
    <div style={{ padding: '1.25rem' }}>
      {/* Single shared turbulence filter — referenced by all cell noise overlays. */}
      <svg width='0' height='0' style={{ position: 'absolute' }} aria-hidden='true'>
        <defs>
          <filter id={monthCellNoiseFilterId}>
            <feTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch' />
          </filter>
        </defs>
      </svg>
      <div style={{ marginBottom: '1rem' }}>
        <h3
          style={{
            color: 'rgba(220,225,245,0.8)',
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '0.06em'
          }}
        >
          {monthLabel}
        </h3>
      </div>
      <div
        ref={gridRef}
        role='grid'
        aria-label='Monthly schedule'
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderLeft: `1px solid ${LINE_COLOR}`,
          borderTop: `1px solid ${LINE_COLOR}`
        }}
      >
        {/* Day headers */}
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              borderRight: `1px solid ${LINE_COLOR}`,
              borderBottom: `1px solid ${LINE_COLOR}`,
              padding: '0.5rem',
              color: 'rgba(170,175,195,0.55)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.06em'
            }}
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cellDate, i) => {
          const dayStr = format(cellDate, 'yyyy-MM-dd')
          const isThisMonth = cellDate.getMonth() === monthNum
          const isToday = dayStr === todayStr
          const day = cellDate.getDate()
          const dayEvents = eventsByDay[dayStr] || []

          return (
            /* gridcell div avoids nested <button> (invalid HTML). Slot creation is
               handled via onClick/onKeyDown; event buttons inside remain valid.
               Roving tabindex: only the focused cell has tabIndex=0. */
            <div
              key={i}
              role='gridcell'
              data-month-cell={i}
              tabIndex={i === focusedIdx ? 0 : -1}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRight: `1px solid ${LINE_COLOR}`,
                borderBottom: `1px solid ${LINE_COLOR}`,
                borderTop: isToday ? '2px solid rgba(100,140,240,0.3)' : undefined,
                padding: '0.5rem',
                height: '6rem',
                background: isToday ? 'rgba(70,110,210,0.06)' : undefined,
                opacity: isThisMonth ? 1 : 0.35,
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => {
                setFocusedIdx(i)
                onSlotClick({ day: dayStr, startTime: '09:00', endTime: '10:00' })
              }}
              onKeyDown={(e) => handleCellKeyDown(e, i)}
              aria-label={`${dayStr} — ${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`}
            >
              {/* Lightweight noise rect — references the single shared feTurbulence filter above */}
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  opacity: 0.18,
                  mixBlendMode: 'soft-light'
                }}
                aria-hidden='true'
              >
                <rect width='100%' height='100%' filter={`url(#${monthCellNoiseFilterId})`} />
              </svg>
              <div
                style={{
                  color: isToday ? 'rgba(180,200,255,0.95)' : 'rgba(210,215,235,0.7)',
                  fontSize: '0.75rem',
                  fontWeight: isToday ? 500 : 400,
                  marginBottom: '0.3rem'
                }}
              >
                {isThisMonth ? day : ''}
              </div>
              <div>
                {dayEvents.slice(0, 2).map((evt) => {
                  const ec = EVENT_TYPE_COLORS[evt.type] || EVENT_TYPE_COLORS.event
                  return (
                    <button
                      key={evt.id}
                      type='button'
                      style={{
                        position: 'relative',
                        display: 'block',
                        width: '100%',
                        borderRadius: '3px',
                        padding: '0.1rem 0.25rem',
                        marginBottom: '2px',
                        background: ec.bg,
                        borderLeft: `2px solid ${ec.border}`,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textAlign: 'left',
                        transition: 'transform 0.15s ease',
                        border: 'none'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(evt)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                      aria-label={evt.title}
                    >
                      <NoiseOverlay />
                      <div
                        style={{
                          color: ec.text,
                          fontSize: '0.5625rem',
                          fontWeight: 500,
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {evt.title}
                      </div>
                    </button>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div
                    style={{
                      color: 'rgba(170,175,195,0.5)',
                      fontSize: '0.5625rem',
                      paddingLeft: '0.25rem'
                    }}
                  >
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

MonthView.propTypes = {
  events: PropTypes.array.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired
}
