/**
 * DayView — single-day schedule grid with drag-to-select and event drag-and-drop.
 * Extracted from FigmaScheduleGrid.jsx.
 */
import { Fragment, useMemo, useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import PropTypes from 'prop-types'

import {
  PERIOD_COLORS,
  EVENT_TYPE_COLORS,
  LINE_COLOR,
  TIME_COL_W,
  getPeriod,
  parseHour,
  formatHourLabel,
  formatEventTime,
  buildOverlapLayout
} from './scheduleConstants.js'
import { useScheduleHourHeight } from '../../hooks/schedule/useScheduleHourHeight.js'
import { NoiseOverlay, CellNoise } from './NoiseOverlays.jsx'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function DayView({ events, nowHour, onEventClick, onSlotClick, onEventDrop, date, use24HourFormat }) {
  const ROW_H = useScheduleHourHeight()
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayName = format(date, 'EEEE').toUpperCase()
  const isDayToday = dateStr === format(new Date(), 'yyyy-MM-dd')

  /* ── Time-range drag selection ── */
  const selRef = useRef(null) // { startBoundary, endBoundary, startHour, endHour } while dragging
  const [selection, setSelection] = useState(null)

  // Commit selection on mouse-up anywhere in the document
  useEffect(() => {
    const handleMouseUp = () => {
      if (!selRef.current) return
      const { startBoundary, endBoundary, startHour, endHour } = selRef.current
      const resolvedStart = typeof startBoundary === 'number' ? startBoundary : startHour
      const resolvedEnd = typeof endBoundary === 'number' ? endBoundary : endHour + 1
      const minH = Math.min(resolvedStart, resolvedEnd)
      const maxH = Math.max(resolvedStart, resolvedEnd + (resolvedStart === resolvedEnd ? 0.25 : 0))
      const toHHMM = (h) => {
        const capped = Math.max(0, Math.min(h, 24))
        let hr = Math.floor(capped)
        let min = Math.round((capped - hr) * 60)
        if (min === 60) { hr += 1; min = 0 }
        if (hr >= 24) return '24:00'
        return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      }
      onSlotClick({ day: dateStr, startTime: toHHMM(minH), endTime: toHHMM(maxH) })
      selRef.current = null
      setSelection(null)
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [dateStr, onSlotClick])

  /* Overlap-aware column layout — handles simultaneous events side-by-side */
  const eventLayout = useMemo(() => buildOverlapLayout(events), [events])

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
        {HOURS.map((hour) => {
          const period = getPeriod(hour)
          const pc = PERIOD_COLORS[period]
          const minSel = selection ? Math.min(selection.startHour, selection.endHour) : 0
          const maxSel = selection ? Math.max(selection.startHour, selection.endHour) + 1 : 0
          const isSelected = !!selection && hour < maxSel && hour + 1 > minSel
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
              {/* Hour cell — drag-to-select range; also a drop zone for event cards */}
              <button
                type='button'
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  height: `${ROW_H}px`,
                  background: isSelected ? 'rgba(99,122,255,0.18)' : pc.bg,
                  cursor: 'pointer',
                  border: 'none',
                  outline: isSelected ? '1px solid rgba(99,122,255,0.45)' : 'none',
                  padding: 0,
                  width: '100%',
                  display: 'block',
                  borderRadius: 0
                }}
                /* Start drag selection on mouse-down — snap to 15-min boundary */
                onMouseDown={(e) => {
                  if (e.button !== 0) return
                  const offsetY = e.nativeEvent.offsetY
                  const quarter = Math.max(0, Math.min(3, Math.floor((offsetY / ROW_H) * 4)))
                  const fractHour = hour + (quarter * 15) / 60
                  selRef.current = { startBoundary: fractHour, endBoundary: fractHour, startHour: fractHour, endHour: fractHour }
                  setSelection({ startHour: fractHour, endHour: fractHour, startBoundary: fractHour, endBoundary: fractHour })
                }}
                /* Track pointer within the same row for sub-hour selection */
                onMouseMove={(e) => {
                  if (!selRef.current || (e.buttons & 1) !== 1) return
                  const offsetY = e.nativeEvent.offsetY
                  const quarter = Math.max(0, Math.min(3, Math.floor((offsetY / ROW_H) * 4)))
                  const endBoundary = hour + (quarter * 15) / 60
                  selRef.current.endBoundary = endBoundary
                  selRef.current.endHour = endBoundary
                  setSelection({ startHour: selRef.current.startHour, endHour: endBoundary, startBoundary: selRef.current.startBoundary, endBoundary })
                }}
                /* Extend selection across rows while holding mouse button */
                onMouseEnter={(e) => {
                  if (!selRef.current) return
                  const offsetY = e.nativeEvent.offsetY
                  const quarter = Math.max(0, Math.min(3, Math.floor((offsetY / ROW_H) * 4)))
                  const endBoundary = hour + (quarter * 15) / 60
                  selRef.current.endBoundary = endBoundary
                  selRef.current.endHour = endBoundary
                  setSelection({ startHour: selRef.current.startHour, endHour: endBoundary, startBoundary: selRef.current.startBoundary, endBoundary })
                }}
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
                /* Drop zone: accept dragged event cards */
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const evtId = e.dataTransfer.getData('text/plain')
                  if (evtId && onEventDrop) onEventDrop(evtId, dateStr, hour)
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
                    background: LINE_COLOR
                  }}
                />
                {/* Quarter-hour visual dividers at 15/30/45 min marks */}
                {[25, 50, 75].map((pct) => (
                  <div
                    key={pct}
                    style={{
                      position: 'absolute',
                      left: '4px',
                      right: 0,
                      top: `${pct}%`,
                      height: '1px',
                      background: pct === 50 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.02)',
                      pointerEvents: 'none'
                    }}
                  />
                ))}
              </button>
            </Fragment>
          )
        })}

        {/* Event cards overlay — column-aware to handle simultaneous events */}
        {events.map((evt) => {
          const ec = EVENT_TYPE_COLORS[evt.type] || EVENT_TYPE_COLORS.event
          const startH = parseHour(evt.startTime)
          // Segments produced by expandMidnightSpanningEvents already have endTime '24:00',
          // so no further normalization needed here. Legacy overnight events (passed without
          // pre-expansion) are still capped safely.
          let endH = parseHour(evt.endTime || evt.startTime)
          if (endH < startH) endH = Math.min(endH + 24, 24)
          const dur = Math.max(endH - startH, 0.25)
          const top = startH * ROW_H
          const height = dur * ROW_H
          const layout = eventLayout.get(evt.id) || { column: 0, columns: 1 }
          const contentWidth = `calc(100% - ${TIME_COL_W + 16}px)`
          const colFrac = `calc(${contentWidth} / ${layout.columns})`
          const leftPx = TIME_COL_W + 8
          // For continuation segments, use the original event for drag data
          const dragEvt = evt._originalEvent ?? evt
          return (
            <button
              key={evt.id}
              type='button'
              draggable={!evt._continuation}
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
                cursor: evt._continuation ? 'pointer' : 'grab',
                overflow: 'hidden',
                textAlign: 'left',
                transition: 'transform 0.2s ease, opacity 0.15s ease'
              }}
              onClick={() => onEventClick(evt)}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(dragEvt.id))
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('application/json', JSON.stringify({
                  id: dragEvt.id, startTime: dragEvt.startTime, endTime: dragEvt.endTime, day: dragEvt.day
                }))
                e.currentTarget.dataset.dragging = 'true'
                e.currentTarget.style.opacity = '0.5'
              }}
              onDragEnd={(e) => {
                delete e.currentTarget.dataset.dragging
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scaleX(1)'
              }}
              onMouseEnter={(e) => {
                if (e.currentTarget.dataset.dragging !== 'true') e.currentTarget.style.transform = 'scaleX(1.01)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scaleX(1)'
              }}
              aria-label={`${evt.title}, ${formatEventTime(evt.startTime, use24HourFormat)} to ${formatEventTime(evt.endTime, use24HourFormat)}`}
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
                {formatEventTime(evt.startTime, use24HourFormat)} — {formatEventTime(evt.endTime, use24HourFormat)}
                {((evt.travelTime ?? 0) > 0 || (evt.preparationTime ?? 0) > 0) && (
                  <span style={{ marginLeft: '0.25rem', opacity: 0.75 }}>
                    {(evt.travelTime ?? 0) > 0 && (
                      <><span aria-hidden='true'>🚗</span><span className='sr-only'>Travel </span>{evt.travelTime}m</>
                    )}
                    {(evt.preparationTime ?? 0) > 0 && (
                      <>{(evt.travelTime ?? 0) > 0 ? ' ' : ''}<span aria-hidden='true'>🎯</span><span className='sr-only'>Prep </span>{evt.preparationTime}m</>
                    )}
                  </span>
                )}
              </div>
            </button>
          )
        })}

        {/* Now indicator — only on today */}
        {isDayToday && (
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

DayView.propTypes = {
  events: PropTypes.array.isRequired,
  nowHour: PropTypes.number.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSlotClick: PropTypes.func.isRequired,
  onEventDrop: PropTypes.func,
  date: PropTypes.instanceOf(Date).isRequired,
  use24HourFormat: PropTypes.bool
}
