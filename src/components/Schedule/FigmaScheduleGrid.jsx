/**
 * FigmaScheduleGrid - Figma-sourced schedule grid (day / week / month views)
 * Visual design ported from Figma ZIP: src/app/pages/Schedule.tsx
 *
 * Data is wired to real events (not sample data):
 *   - events: array of {id, title, type, day (yyyy-MM-dd), startTime (HH:mm), endTime (HH:mm)}
 *   - onEventClick(event) → opens ItemActionModal for the selected event
 *   - onSlotClick({day, startTime, endTime}) → opens EventModal to create a new event
 *   - date: current navigation Date
 *   - viewMode: 'day' | 'week' | 'month'
 */
import { Fragment, useId, useMemo, useState, useRef, useCallback } from 'react'
import { format, startOfWeek, addDays, startOfMonth } from 'date-fns'
import PropTypes from 'prop-types'

/* ── Period colours (from Figma Schedule.tsx) ───────────────────────────── */
export const PERIOD_COLORS = {
  night: {
    bg: 'rgba(20,18,45,0.6)',
    border: 'rgba(60,55,100,0.4)',
    text: 'rgba(140,135,180,0.9)',
    label: 'Night',
    dot: '#5550a0'
  },
  morning: {
    bg: 'rgba(210,160,110,0.35)',
    border: 'rgba(230,180,130,0.55)',
    text: 'rgba(255,220,180,0.95)',
    label: 'Morning',
    dot: '#e8b880'
  },
  afternoon: {
    bg: 'rgba(140,190,200,0.3)',
    border: 'rgba(160,210,220,0.5)',
    text: 'rgba(200,235,240,0.95)',
    label: 'Afternoon',
    dot: '#a0d0d8'
  },
  evening: {
    bg: 'rgba(160,120,170,0.3)',
    border: 'rgba(180,145,195,0.5)',
    text: 'rgba(210,185,225,0.95)',
    label: 'Evening',
    dot: '#c0a0d0'
  }
}

/* ── Event type colours (from Figma Schedule.tsx) ────────────────────────── */
export const EVENT_TYPE_COLORS = {
  task: {
    bg: 'rgba(230,65,65,0.22)',
    border: 'rgba(250,90,90,0.55)',
    text: 'rgba(255,165,155,0.95)'
  },
  routine: {
    bg: 'rgba(30,200,230,0.22)',
    border: 'rgba(50,220,250,0.55)',
    text: 'rgba(120,240,255,0.95)'
  },
  habit: {
    bg: 'rgba(160,55,235,0.22)',
    border: 'rgba(185,85,255,0.55)',
    text: 'rgba(215,160,255,0.95)'
  },
  event: {
    bg: 'rgba(55,100,240,0.22)',
    border: 'rgba(75,130,255,0.55)',
    text: 'rgba(150,190,255,0.95)'
  }
}

/** Map an hour (0-23) to its period key */
function getPeriod(hour) {
  if (hour >= 7 && hour < 13) return 'morning'
  if (hour >= 13 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

/** Parse 'HH:mm' time string to decimal hours */
function parseHour(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h + (m || 0) / 60
}

/** Format an hour number as a time label, respecting 24h/12h user preference */
function formatHourLabel(hour, use24h) {
  if (use24h !== false) return `${String(hour).padStart(2, '0')}:00`
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

/** Noise SVG overlay - same as Figma. Uses useId() to avoid duplicate filter IDs across instances. */
function NoiseOverlay() {
  const uid = useId()
  const filterId = `figmaEventNoise-${uid.replace(/:/g, '')}`
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.12,
        mixBlendMode: 'overlay',
        borderRadius: 'inherit'
      }}
      aria-hidden='true'
    >
      <filter id={filterId}>
        <feTurbulence
          type='fractalNoise'
          baseFrequency='0.85'
          numOctaves='4'
          stitchTiles='stitch'
        />
      </filter>
      <rect width='100%' height='100%' filter={`url(#${filterId})`} />
    </svg>
  )
}

function CellNoise() {
  const uid = useId()
  const filterId = `figmaCellNoise-${uid.replace(/:/g, '')}`
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.08,
        mixBlendMode: 'overlay'
      }}
      aria-hidden='true'
    >
      <filter id={filterId}>
        <feTurbulence
          type='fractalNoise'
          baseFrequency='0.65'
          numOctaves='3'
          stitchTiles='stitch'
        />
      </filter>
      <rect width='100%' height='100%' filter={`url(#${filterId})`} />
    </svg>
  )
}

/* ── Row height (px per hour) — derived from CSS --hour-height variable with 52px fallback ─── */
/* NOTE: ROW_H is read once at module load from the document's computed styles. It reflects
   the value of --hour-height at import time and will not update if CSS variables change
   dynamically. Re-render-based zoom or density changes are not supported without a remount. */
function getScheduleHourHeight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 52
  const styles = window.getComputedStyle(document.documentElement)
  const hourHeight = Number.parseFloat(styles.getPropertyValue('--hour-height'))
  if (Number.isFinite(hourHeight) && hourHeight > 0) return hourHeight
  const minuteUnit = Number.parseFloat(styles.getPropertyValue('--minute-unit'))
  if (Number.isFinite(minuteUnit) && minuteUnit > 0) return minuteUnit * 60
  return 52
}

const ROW_H = getScheduleHourHeight()
const LINE_COLOR = 'rgba(255,255,255,0.04)'
const TIME_COL_W = 60

/* ── Day View ────────────────────────────────────────────────────────────── */
function DayView({ events, nowHour, onEventClick, onSlotClick, date, use24HourFormat }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayName = format(date, 'EEEE').toUpperCase()

  /* Overlap-aware column layout — handles up to maxSimultaneousEvents (2) per slot */
  const eventLayout = useMemo(() => {
    const sorted = [...events]
      .map((evt) => ({ evt, startH: parseHour(evt.startTime), endH: parseHour(evt.endTime || evt.startTime) }))
      .sort((a, b) => a.startH !== b.startH ? a.startH - b.startH : a.endH - b.endH)

    const layoutMap = new Map()
    let cluster = [] // {evt, startH, endH, column}
    let active = []  // currently overlapping items

    const finalizeCluster = () => {
      if (cluster.length === 0) return
      const cols = Math.max(...cluster.map((x) => x.column + 1), 1)
      for (const item of cluster) layoutMap.set(item.evt.id, { column: item.column, columns: cols })
      cluster = []
      active = []
    }

    for (const item of sorted) {
      active = active.filter((a) => a.endH > item.startH)
      if (cluster.length > 0 && active.length === 0) finalizeCluster()
      const usedCols = new Set(active.map((a) => a.column))
      let col = 0
      while (usedCols.has(col)) col++
      const positioned = { ...item, column: col }
      cluster.push(positioned)
      active.push(positioned)
    }
    finalizeCluster()
    return layoutMap
  }, [events])

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h3
          style={{
            color: 'rgba(220,225,245,0.8)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            letterSpacing: '0.08em'
          }}
        >
          {dayName}
        </h3>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `${TIME_COL_W}px 1fr`
        }}
      >
        {hours.map((hour) => {
          const period = getPeriod(hour)
          const pc = PERIOD_COLORS[period]
          return (
            <Fragment key={hour}>
              {/* Time label */}
              <div
                style={{
                  textAlign: 'right',
                  paddingRight: '0.75rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  height: `${ROW_H}px`,
                  color: pc.text,
                  fontSize: '0.6875rem',
                  opacity: 0.6,
                  paddingTop: '0.15rem'
                }}
              >
                {formatHourLabel(hour, use24HourFormat)}
              </div>
              {/* Hour cell */}
              <button
                type='button'
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  height: `${ROW_H}px`,
                  background: pc.bg,
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                  width: '100%',
                  display: 'block'
                }}
                onClick={() =>
                  onSlotClick({
                    day: dateStr,
                    startTime: `${String(hour).padStart(2, '0')}:00`,
                    endTime: hour === 23 ? '24:00' : `${String(hour + 1).padStart(2, '0')}:00`
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSlotClick({
                      day: dateStr,
                      startTime: `${String(hour).padStart(2, '0')}:00`,
                      endTime: hour === 23 ? '24:00' : `${String(hour + 1).padStart(2, '0')}:00`
                    })
                  }
                }}
                aria-label={`${String(hour).padStart(2, '0')}:00 slot`}
              >
                <CellNoise />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: pc.border
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '1px',
                    background: 'rgba(255,255,255,0.04)'
                  }}
                />
              </button>
            </Fragment>
          )
        })}

        {/* Event cards overlay — column-aware to handle simultaneous events */}
        {events.map((evt) => {
          const ec = EVENT_TYPE_COLORS[evt.type] || EVENT_TYPE_COLORS.event
          const startH = parseHour(evt.startTime)
          const endH = parseHour(evt.endTime || evt.startTime)
          const dur = Math.max(endH - startH, 0.25)
          const top = startH * ROW_H
          const height = dur * ROW_H
          const layout = eventLayout.get(evt.id) || { column: 0, columns: 1 }
          const contentWidth = `calc(100% - ${TIME_COL_W + 16}px)`
          const colFrac = `calc(${contentWidth} / ${layout.columns})`
          const leftPx = TIME_COL_W + 8
          return (
            <button
              key={evt.id}
              type='button'
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: `calc(${leftPx}px + ${layout.column} * ${colFrac})`,
                width: `calc(${colFrac} - 4px)`,
                height: `${height - 2}px`,
                background: ec.bg,
                border: `1px solid ${ec.border}`,
                borderLeft: `3px solid ${ec.border}`,
                borderRadius: '6px',
                padding: '0.4rem 0.6rem',
                zIndex: 2,
                cursor: 'pointer',
                overflow: 'hidden',
                textAlign: 'left',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => onEventClick(evt)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scaleX(1.01)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scaleX(1)'
              }}
              aria-label={`${evt.title}, ${evt.startTime} to ${evt.endTime}`}
            >
              <NoiseOverlay />
              <div
                style={{
                  color: ec.text,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {evt.title}
              </div>
              <div
                style={{
                  color: ec.text,
                  fontSize: '0.625rem',
                  opacity: 0.6,
                  marginTop: '0.1rem',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {evt.startTime} — {evt.endTime}
              </div>
            </button>
          )
        })}

        {/* Now indicator */}
        <div
          style={{
            position: 'absolute',
            top: `${nowHour * ROW_H}px`,
            left: `${TIME_COL_W - 6}px`,
            right: 0,
            zIndex: 5,
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
                background:
                  'linear-gradient(90deg, rgba(240,96,96,0.7), rgba(240,96,96,0.15))'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

DayView.propTypes = {
  events: PropTypes.array.isRequired,
  nowHour: PropTypes.number.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  use24HourFormat: PropTypes.bool
}

/* ── Week View ───────────────────────────────────────────────────────────── */
function WeekView({ events, nowHour, onEventClick, onSlotClick, date, use24HourFormat }) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Mon
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 24 }, (_, i) => i) // 00:00–23:00
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayDayIdx = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === todayStr)
  const defaultDay = todayDayIdx >= 0 ? todayDayIdx : 0

  /* Roving tabindex — only one cell has tabIndex=0 at a time to reduce tab stops */
  const [focusedCell, setFocusedCell] = useState({ day: defaultDay, hour: Math.min(nowHour >= 0 ? nowHour : 9, 23) })
  const gridRef = useRef(null)

  const focusCell = useCallback((day, hour) => {
    const clamped = { day: Math.max(0, Math.min(6, day)), hour: Math.max(0, Math.min(23, hour)) }
    setFocusedCell(clamped)
    // Defer to next paint so the new tabIndex=0 element is in the DOM
    requestAnimationFrame(() => {
      gridRef.current?.querySelector(`[data-cell-key="${clamped.day}-${clamped.hour}"]`)?.focus()
    })
  }, [])

  const handleCellKeyDown = useCallback((e, di, hour) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const dayDate = weekDays[di]
      const dayStr = format(dayDate, 'yyyy-MM-dd')
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
      const key = `${evt.day}-${Math.floor(parseHour(evt.startTime))}`
      if (!map[key]) map[key] = []
      map[key].push(evt)
    }
    return map
  }, [events])

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
                color:
                  isToday || isCurrent
                    ? 'rgba(200,215,255,0.9)'
                    : 'rgba(195,200,220,0.6)',
                fontSize: '0.75rem',
                fontWeight: isToday || isCurrent ? 500 : 400
              }}
            >
              {format(dayDate, 'EEE M/d').toUpperCase()}
            </div>
          )
        })}

        {/* Hour rows */}
        {hours.map((hour) => {
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
                      padding: 0
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
                    aria-label={`${dayStr} ${formatHourLabel(hour, use24HourFormat)} slot`}
                  >
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                      <CellNoise />
                    </div>
                    {cellEvents.map((evt) => {
                      const ec = EVENT_TYPE_COLORS[evt.type] || EVENT_TYPE_COLORS.event
                      const startH = parseHour(evt.startTime)
                      const endH = parseHour(evt.endTime || evt.startTime)
                      const dur = Math.max(endH - startH, 0.25)
                      const offsetPx = (startH - hour) * ROW_H
                      const height = dur * ROW_H
                      return (
                        <button
                          key={evt.id}
                          type='button'
                          style={{
                            position: 'absolute',
                            left: '2px',
                            right: '2px',
                            top: `${2 + offsetPx}px`,
                            height: `${height - 4}px`,
                            background: ec.bg,
                            border: `1px solid ${ec.border}`,
                            borderLeft: `2px solid ${ec.border}`,
                            borderRadius: '4px',
                            padding: '0.25rem 0.35rem',
                            cursor: 'pointer',
                            zIndex: 10,
                            overflow: 'hidden',
                            textAlign: 'left',
                            transition: 'transform 0.2s ease'
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

        {/* Now indicator for week view — only render when within the 24-hour grid */}
        {nowHour >= 0 && nowHour < 24 && (
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
                    background:
                      'linear-gradient(90deg, rgba(240,96,96,0.7), rgba(240,96,96,0.15))'
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
  date: PropTypes.instanceOf(Date).isRequired,
  use24HourFormat: PropTypes.bool
}

/* ── Month View ──────────────────────────────────────────────────────────── */
function MonthView({ events, onEventClick, onSlotClick, date }) {
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

  return (
    <div style={{ padding: '1.25rem' }}>
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
                onSlotClick({
                  day: dayStr,
                  startTime: '09:00',
                  endTime: '10:00'
                })
              }}
              onKeyDown={(e) => handleCellKeyDown(e, i)}
              aria-label={`${dayStr} — ${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`}
            >
              <CellNoise />
              <div
                style={{
                  color: isToday
                    ? 'rgba(180,200,255,0.95)'
                    : 'rgba(210,215,235,0.7)',
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

/* ── Main grid component ─────────────────────────────────────────────────── */
function FigmaScheduleGrid({ events, viewMode, date, onEventClick, onSlotClick, use24HourFormat }) {
  const now = new Date()
  const nowHour = now.getHours() + now.getMinutes() / 60

  if (viewMode === 'day') {
    return (
      <DayView
        events={events.filter((e) => e.day === format(date, 'yyyy-MM-dd'))}
        nowHour={nowHour}
        onEventClick={onEventClick}
        onSlotClick={onSlotClick}
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
  use24HourFormat: PropTypes.bool
}

export default FigmaScheduleGrid
