/**
 * WeekView — 7-day schedule grid with roving tabindex keyboard navigation
 * and per-day overlap-aware event column layout.
 * Extracted from FigmaScheduleGrid.jsx.
 */
import { Fragment, useMemo, useState, useRef, useCallback } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import PropTypes from 'prop-types'

import {
  PERIOD_COLORS,
  EVENT_TYPE_COLORS,
  LINE_COLOR,
  TIME_COL_W,
  getPeriod,
  parseHour,
  formatHourLabel,
  buildOverlapLayout
} from './scheduleConstants.js'
import { useScheduleHourHeight } from '../../hooks/schedule/useScheduleHourHeight.js'
import { NoiseOverlay, CellNoise } from './NoiseOverlays.jsx'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function WeekView({ events, nowHour, onEventClick, onSlotClick, onEventDrop, date, use24HourFormat }) {
  const ROW_H = useScheduleHourHeight()
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Mon
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayDayIdx = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === todayStr)
  const defaultDay = todayDayIdx >= 0 ? todayDayIdx : 0

  /* Roving tabindex — only one cell has tabIndex=0 at a time to reduce tab stops */
  const [focusedCell, setFocusedCell] = useState({
    day: defaultDay,
    hour: Math.min(Math.floor(nowHour >= 0 ? nowHour : 9), 23)
  })
  const gridRef = useRef(null)

  const focusCell = useCallback((day, hour) => {
    const clamped = { day: Math.max(0, Math.min(6, day)), hour: Math.max(0, Math.min(23, Math.floor(hour))) }
    setFocusedCell(clamped)
    requestAnimationFrame(() => {
      gridRef.current?.querySelector(`[data-cell-key="${clamped.day}-${clamped.hour}"]`)?.focus()
    })
  }, [])

  const handleCellKeyDown = useCallback((e, di, hour) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const dayStr = format(weekDays[di], 'yyyy-MM-dd')
      onSlotClick({
        day: dayStr,
        startTime: `${String(hour).padStart(2, '0')}:00`,
        endTime: hour === 23 ? '24:00' : `${String(hour + 1).padStart(2, '0')}:00`
      })
    } else if (e.key === 'ArrowRight') { e.preventDefault(); focusCell(di + 1, hour) }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); focusCell(di - 1, hour) }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); focusCell(di, hour + 1) }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); focusCell(di, hour - 1) }
  }, [weekDays, onSlotClick, focusCell])

  /* Pre-index events by "day-hour" key so cell lookups are O(1) */
  const eventsByDayHour = useMemo(() => {
    const map = {}
    for (const evt of events) {
      if (!evt || evt.allDay || !evt.day || !evt.startTime || !evt.endTime) continue
      const startHour = parseHour(evt.startTime)
      if (!Number.isFinite(startHour)) continue
      const key = `${evt.day}-${Math.floor(startHour)}`
      if (!map[key]) map[key] = []
      map[key].push(evt)
    }
    return map
  }, [events])

  /* Per-day overlap layout — same algorithm as DayView but keyed by day string */
  const overlapByDay = useMemo(() => {
    const result = {}
    for (const dayDate of weekDays) {
      const dayStr = format(dayDate, 'yyyy-MM-dd')
      const dayEvts = events.filter((e) => e.day === dayStr && !e.allDay && e.startTime && e.endTime)
      result[dayStr] = buildOverlapLayout(dayEvts)
    }
    return result
  }, [events, weekDays])

  return (
    <div style={{ padding: '1.25rem' }}>
      <div
        ref={gridRef}
        role='grid'
        aria-label='Weekly schedule'
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `${TIME_COL_W}px repeat(7, 1fr)`,
          borderLeft: `1px solid ${LINE_COLOR}`,
          borderTop: `1px solid ${LINE_COLOR}`
        }}
      >
        {/* Header row */}
        <div
          style={{
            borderRight: `1px solid ${LINE_COLOR}`,
            borderBottom: `1px solid ${LINE_COLOR}`,
            padding: '0.5rem'
          }}
        />
        {weekDays.map((dayDate, di) => {
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const isCurrent = format(dayDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          return (
            <div
              key={di}
              style={{
                textAlign: 'center',
                borderRight: `1px solid ${LINE_COLOR}`,
                borderBottom: `1px solid ${LINE_COLOR}`,
                padding: '0.6rem 0.25rem',
                color: isToday || isCurrent ? 'rgba(200,215,255,0.9)' : 'rgba(195,200,220,0.6)',
                fontSize: '0.75rem',
                fontWeight: isToday || isCurrent ? 500 : 400
              }}
            >
              {format(dayDate, 'EEE M/d').toUpperCase()}
            </div>
          )
        })}

        {/* Hour rows */}
        {HOURS.map((hour) => {
          const period = getPeriod(hour)
          const pc = PERIOD_COLORS[period]
          return (
            <Fragment key={`h-${hour}`}>
              {/* Time label */}
              <div
                style={{
                  textAlign: 'right',
                  paddingRight: '0.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  paddingTop: '0.25rem',
                  borderRight: `1px solid ${LINE_COLOR}`,
                  borderBottom: `1px solid ${LINE_COLOR}`,
                  color: pc.text,
                  fontSize: '0.6875rem',
                  opacity: 0.55,
                  height: `${ROW_H}px`
                }}
              >
                {formatHourLabel(hour, use24HourFormat)}
              </div>
              {weekDays.map((dayDate, di) => {
                const dayStr = format(dayDate, 'yyyy-MM-dd')
                const cellEvents = eventsByDayHour[`${dayStr}-${hour}`] || []
                const isActive = focusedCell.day === di && focusedCell.hour === hour
                return (
                  /* gridcell div avoids nested <button> (invalid HTML). Slot creation is
                     handled via onClick/onKeyDown; event buttons inside remain valid.
                     Roving tabindex: only the focused cell has tabIndex=0. */
                  <div
                    key={`${di}-${hour}`}
                    role='gridcell'
                    data-cell-key={`${di}-${hour}`}
                    tabIndex={isActive ? 0 : -1}
                    style={{
                      position: 'relative',
                      borderRight: `1px solid ${LINE_COLOR}`,
                      borderBottom: `1px solid ${LINE_COLOR}`,
                      height: `${ROW_H}px`,
                      background: pc.bg,
                      cursor: 'pointer',
                      padding: 0,
                      borderRadius: 0
                    }}
                    onClick={() => {
                      setFocusedCell({ day: di, hour })
                      onSlotClick({
                        day: dayStr,
                        startTime: `${String(hour).padStart(2, '0')}:00`,
                        endTime: hour === 23 ? '24:00' : `${String(hour + 1).padStart(2, '0')}:00`
                      })
                    }}
                    onKeyDown={(e) => handleCellKeyDown(e, di, hour)}
                    /* Drop zone: accept dragged event cards */
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const evtId = e.dataTransfer.getData('text/plain')
                      if (evtId && onEventDrop) onEventDrop(evtId, dayStr, hour)
                    }}
                    aria-label={`${dayStr} ${formatHourLabel(hour, use24HourFormat)} slot`}
                  >
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                      <CellNoise />
                    </div>
                    {/* Quarter-hour visual dividers at 15/30/45 min marks */}
                    {[25, 50, 75].map((pct) => (
                      <div
                        key={pct}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${pct}%`,
                          height: '1px',
                          background: pct === 50 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                          pointerEvents: 'none'
                        }}
                      />
                    ))}
                    {cellEvents.map((evt) => {
                      const ec = EVENT_TYPE_COLORS[evt.type] || EVENT_TYPE_COLORS.event
                      const startH = parseHour(evt.startTime)
                      // Normalize midnight-spanning events
                      let endH = parseHour(evt.endTime || evt.startTime)
                      if (endH < startH) endH = Math.min(endH + 24, 24)
                      const dur = Math.max(endH - startH, 0.25)
                      const offsetPx = (startH - hour) * ROW_H
                      const height = dur * ROW_H
                      const evtLayout = overlapByDay[dayStr]?.get(evt.id) ?? { column: 0, columns: 1 }
                      return (
                        <button
                          key={evt.id}
                          type='button'
                          draggable
                          style={{
                            position: 'absolute',
                            left: `${(evtLayout.column / evtLayout.columns) * 100}%`,
                            width: `calc(${100 / evtLayout.columns}% - 4px)`,
                            top: `${2 + offsetPx}px`,
                            height: `${height - 4}px`,
                            background: ec.bg,
                            border: `1px solid ${ec.border}`,
                            borderLeft: `2px solid ${ec.border}`,
                            borderRadius: '4px',
                            padding: '0.25rem 0.35rem',
                            cursor: 'grab',
                            zIndex: 10,
                            overflow: 'hidden',
                            textAlign: 'left',
                            transition: 'transform 0.2s ease, opacity 0.15s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick(evt)
                          }}
                          onDragStart={(e) => {
                            e.stopPropagation()
                            e.dataTransfer.setData('text/plain', String(evt.id))
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('application/json', JSON.stringify({
                              id: evt.id, startTime: evt.startTime, endTime: evt.endTime, day: evt.day
                            }))
                            e.currentTarget.style.opacity = '0.5'
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1'
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
                              fontSize: '0.625rem',
                              fontWeight: 500,
                              lineHeight: 1.3,
                              position: 'relative',
                              zIndex: 1
                            }}
                          >
                            {evt.title}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </Fragment>
          )
        })}

        {/* Now indicator — only if today is in the displayed week */}
        {todayDayIdx >= 0 && nowHour >= 0 && nowHour < 24 && (
          <div
            style={{
              position: 'absolute',
              top: `calc(${nowHour * ROW_H}px + 2.1rem)`,
              left: `${TIME_COL_W - 6}px`,
              right: 0,
              zIndex: 15,
              pointerEvents: 'none'
            }}
            aria-hidden='true'
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#f06060',
                  boxShadow: '0 0 8px rgba(240,96,96,0.6)',
                  flexShrink: 0
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(240,96,96,0.7), rgba(240,96,96,0.15))'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

WeekView.propTypes = {
  events: PropTypes.array.isRequired,
  nowHour: PropTypes.number.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  onEventDrop: PropTypes.func,
  date: PropTypes.instanceOf(Date).isRequired,
  use24HourFormat: PropTypes.bool
}
