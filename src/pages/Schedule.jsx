/**
REFERENCE: See /docs/schedule-ui-spec.md and /docs/schedule-after-mockup.png
Any deviation from those visuals is a regression.
*/

/**
COPILOT / LLM INSTRUCTIONS — SCHEDULE UI (DO NOT SIMPLIFY)

This Schedule UI is intentionally subtle and layered.
Do NOT approximate, simplify, or “clean up” the visuals.

Key constraints (NON-NEGOTIABLE):

1. Time-of-day styling is NOT row coloring.
   - Do NOT apply background colors to hour rows.
   - Do NOT use a single global background gradient.
   - Time-of-day bands MUST be implemented as a separate,
     absolutely-positioned background layer.

2. The schedule has FOUR visual layers, in this order:
   1) Event cards (primary focus)
   2) Current-time indicator (if present)
   3) Hour grid lines (structural only)
   4) Time-of-day bands (semantic orientation)
   Decorative backgrounds are below all of the above.

3. Time-of-day bands are SEMANTIC, not decorative.
   - Morning / Afternoon / Evening / Night MUST be perceptible
     without reading hour labels.
   - Bands must be visually distinct from each other,
     but remain low-contrast and calm.
   - If converting the UI to grayscale makes all hours look identical,
     the implementation is WRONG.

4. Bands must be DISCRETE ZONES, not a continuous gradient.
   - Each band covers a defined time range.
   - Each band has its own soft internal gradient.
   - Adjacent bands may overlap softly, but must differ in hue or luminance.

5. Event cards must visually dominate.
   - Cards float above bands (z-index, elevation).
   - Cards NEVER inherit band colors.
   - If background draws attention before events, FAIL.

6. Time scaling MUST be proportional and non-hardcoded.
   - All vertical sizing derives from a minute-based unit.
   - Do NOT hardcode pixel heights for hours or events.
   - Use CSS variables and calculations only.

7. This UI prioritises ORIENTATION over decoration.
   - Calm but legible.
   - Structured but non-mechanical.
   - If it looks “efficient” but feels disorienting, it is WRONG.

If unsure: DO NOT GUESS.
Ask for clarification or preserve the existing structure.
*/

/**
 * Schedule Page - Calendar view for events using Figma-sourced custom grid
 * Manages routines, tasks, meetings, and habits with a clean, accessible interface
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, startOfWeek, addDays, subDays, addMonths, subMonths } from 'date-fns'
import EventModal from '../components/Schedule/EventModal'
import ItemActionModal from '../components/ItemActionModal'
import ErrorBoundary from '../components/ErrorBoundary'
import GlassPanel from '../components/common/GlassPanel'
import FigmaScheduleGrid, { PERIOD_COLORS, EVENT_TYPE_COLORS } from '../components/Schedule/FigmaScheduleGrid'
import Icon from '../components/common/Icon'
import EventService from '../services/EventService'
import { EVENT_TYPES } from '../utils/scheduleConstants'
import { getSettings, VALID_GUIDANCE_LEVELS } from '../utils/settingsManager'
import { isDevelopment } from '../utils/environment'
import { addTaskToStorage } from '../utils/scheduleHelpers'
import { createRoutine } from '../utils/routinesManager'
import { timeToMinutes, minutesToTime } from '../utils/timeUtils'
import { validateStructural } from '../schedule/structuralConstraints'
import { generateSuggestions } from '../schedule/suggestionEngine'
import { snapDown, snapUp } from '../schedule/timeUtils'
import '../components/ErrorBoundary.css'

/**
 * Convert a snapped end-minute value back to a stored time string.
 *
 * - Midnight-spanning: end was normalised to > 1440, wrap it back via modulo.
 * - Non-spanning: if snapped end hits exactly 1440, use the '24:00' sentinel
 *   (end-of-day); otherwise convert normally.
 *
 * @param {number}  snappedEnd          - Snapped end in minutes (may be > 1440 for midnight-spanning)
 * @param {boolean} wasMidnightSpanning - Whether the original event spanned midnight
 * @returns {string} Time in 'HH:MM' or '24:00' format
 */
function formatSnappedEndTime(snappedEnd, wasMidnightSpanning) {
  if (wasMidnightSpanning) return minutesToTime(snappedEnd % 1440)
  if (snappedEnd >= 1440) return '24:00'
  return minutesToTime(snappedEnd)
}

/**
 * Check structural constraints for a candidate event against the current
 * events state, excluding `excludeId` (used during edit/move to avoid
 * self-conflict). Returns null when valid, or an error message string.
 *
 * @param {object}   candidate  - The event being created/moved/resized
 * @param {object[]} allEvents  - Current events state
 * @param {string}   [excludeId] - ID of the event to exclude (edit/drag/resize)
 * @returns {string|null}
 */
function checkStructural(candidate, allEvents, excludeId) {
  if (!candidate.day) return null
  const dayEvents = allEvents.filter(
    (e) => e.day === candidate.day && e.id !== excludeId
  )
  const check = validateStructural(candidate, dayEvents)
  return check.valid ? null : (check.reason ?? 'Scheduling conflict: too many simultaneous events')
}

// Console statements are intentionally used throughout this file for production debugging
// and error handling. They replaced a custom logger utility that was causing issues in
// production builds where Vite's minification was removing the logger module entirely,
// resulting in "logger is not defined" runtime errors. Direct console usage is immune
// to tree-shaking and ensures reliable error reporting in production environments.
// See commit 511b225 for the migration from custom logger to console methods.

function Schedule() {
  // Success message timeout ref for cleanup on unmount
  const successMessageTimeoutRef = useRef(null)
  // Ref that always points to the latest loadEvents callback so storage event
  // handlers (defined before loadEvents) can call it without stale closures.
  const loadEventsRef = useRef(null)

  // State management
  const [view, setView] = useState('day') // 'day' | 'week' | 'month'
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [successMessage, setSuccessMessage] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)

  // Dev-only: Lazy-loaded FloatingDevButtons component
  const [FloatingDevButtons, setFloatingDevButtons] = useState(null)

  const [schedulingGuidanceLevel, setSchedulingGuidanceLevel] = useState(() => {
    const stored = getSettings().schedule?.schedulingGuidanceLevel
    return VALID_GUIDANCE_LEVELS.includes(stored) ? stored : 'full'
  })

  const [use24HourFormat, setUse24HourFormat] = useState(
    () => getSettings().schedule?.use24HourFormat !== false
  )

  useEffect(() => {
    // Handle cross-tab updates via 'storage' event (fires when localStorage changes in another tab)
    const handleStorage = (event) => {
      try {
        const scheduleSettings = getSettings().schedule
        const level = scheduleSettings?.schedulingGuidanceLevel
        if (VALID_GUIDANCE_LEVELS.includes(level)) {
          setSchedulingGuidanceLevel(level)
        }
        setUse24HourFormat(scheduleSettings?.use24HourFormat !== false)
      } catch (_err) {}

      // Reload schedule events when tasks are modified in another tab so the
      // Schedule view stays in sync without requiring a page refresh.
      // Routines are stored in IndexedDB (not localStorage), so no 'aurorae_routines'
      // key will ever fire here — cross-tab routine sync would require BroadcastChannel.
      if (event?.key === 'aurorae_tasks') {
        loadEventsRef.current?.()
      }
    }

    // Handle same-tab updates via custom 'settingsUpdated' event
    // Settings page should dispatch: window.dispatchEvent(new CustomEvent('settingsUpdated'))
    const handleSettingsUpdated = () => {
      try {
        const scheduleSettings = getSettings().schedule
        const level = scheduleSettings?.schedulingGuidanceLevel
        if (VALID_GUIDANCE_LEVELS.includes(level)) {
          setSchedulingGuidanceLevel(level)
        }
        setUse24HourFormat(scheduleSettings?.use24HourFormat !== false)
      } catch (_err) {}
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('settingsUpdated', handleSettingsUpdated)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('settingsUpdated', handleSettingsUpdated)
    }
  }, [])

  // Dev-only: Dynamically load FloatingDevButtons to prevent bundling in production
  useEffect(() => {
    if (isDevelopment()) {
      import('../components/Schedule/FloatingDevButtons')
        .then((module) => {
          setFloatingDevButtons(() => module.default)
        })
        .catch((err) => {
          // biome-ignore lint/suspicious/noConsole: dev-only chunk-load failure, logger not available here
          console.error('[Schedule] FloatingDevButtons failed to load:', err)
        })
    }
  }, [])

  // Load events based on current view and date
  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      let loadedEvents = []
      const dateStr = format(date, 'yyyy-MM-dd')

      if (view === 'day') {
        loadedEvents = await EventService.getEventsForDate(dateStr)
      } else if (view === 'week') {
        loadedEvents = await EventService.getEventsForWeek(dateStr)
      } else if (view === 'month') {
        const startOfMonth = startOfWeek(
          new Date(date.getFullYear(), date.getMonth(), 1),
          { weekStartsOn: 1 } // Monday — matches MonthView grid
        )
        const endOfMonth = addDays(startOfMonth, 41) // 6 weeks
        loadedEvents = await EventService.getEventsForRange(
          format(startOfMonth, 'yyyy-MM-dd'),
          format(endOfMonth, 'yyyy-MM-dd')
        )
      }

      setEvents(loadedEvents)
    } catch (_err) {
      setError('Failed to load events. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [view, date])

  // Keep the ref in sync so storage event handlers always call the latest version
  loadEventsRef.current = loadEvents

  // Load events when view or date changes
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Cleanup success message timeout on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current)
        successMessageTimeoutRef.current = null
      }
    }
  }, [])

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    (action) => {
      setDate((prev) => {
        switch (action) {
          case 'PREV':
            if (view === 'day') return subDays(prev, 1)
            if (view === 'week') return subDays(prev, 7)
            return subMonths(prev, 1)
          case 'NEXT':
            if (view === 'day') return addDays(prev, 1)
            if (view === 'week') return addDays(prev, 7)
            return addMonths(prev, 1)
          case 'TODAY':
            return new Date()
          default:
            return prev
        }
      })
    },
    [view]
  )

  // ── Event handlers ───────────────────────────────────────────────────────
  const handleSaveEvent = async (eventData) => {
    try {
      // Ensure we have a valid event object
      if (!eventData) {
        throw new Error('No event data provided')
      }

      // Strip the internal flag before persisting to avoid polluting IndexedDB
      const { _isNewCreation, ...rawCleanData } = eventData

      // Snap timed event start/end to the configured interval (start down, end up).
      // This keeps stored values consistent with structural validation and load
      // computation, which both apply the same snapping internally.
      let cleanEventData = rawCleanData
      if (rawCleanData.startTime && rawCleanData.endTime && !rawCleanData.allDay) {
        const rawStart = timeToMinutes(rawCleanData.startTime)
        const rawEnd = timeToMinutes(rawCleanData.endTime)
        const wasMidnightSpanning = rawEnd < rawStart
        const normalEnd = wasMidnightSpanning ? rawEnd + 1440 : rawEnd
        const snappedStart = snapDown(rawStart)
        const snappedEnd = snapUp(normalEnd)
        cleanEventData = {
          ...rawCleanData,
          startTime: minutesToTime(snappedStart),
          endTime: formatSnappedEndTime(snappedEnd, wasMidnightSpanning)
        }
      }

      // Check if this is an update or create
      // For updates, we need both an ID and it must be a string/number
      const isUpdate =
        cleanEventData.id &&
        (typeof cleanEventData.id === 'string' ||
          typeof cleanEventData.id === 'number')

      // Structural validation: enforce simultaneous-event limits before saving.
      // Exclude the event being updated (by ID) so edits don't self-conflict.
      const structuralError = checkStructural(cleanEventData, events, cleanEventData.id)
      if (structuralError) {
        setError(structuralError)
        // Clear any stale suggestions from a previous failure before generating new ones.
        setSuggestions([])
        // In 'full' guidance mode, surface available time slots for this day.
        // Only generate suggestions for timed events (all-day events have no duration).
        if (
          schedulingGuidanceLevel === 'full' &&
          cleanEventData.day &&
          cleanEventData.startTime &&
          cleanEventData.endTime
        ) {
          const dayStr = cleanEventData.day
          const parts = dayStr.split('-').map(Number)
          const eventDate =
            parts.length === 3 && parts.every((n) => !Number.isNaN(n))
              ? new Date(parts[0], parts[1] - 1, parts[2])
              : new Date(dayStr)
          const dayEvents = events.filter(
            (e) => e.day === dayStr && e.id !== cleanEventData.id
          )
          const endMins = timeToMinutes(cleanEventData.endTime)
          const startMins = timeToMinutes(cleanEventData.startTime)
          const duration =
            endMins < startMins ? endMins + 1440 - startMins : endMins - startMins
          if (duration > 0) {
            setSuggestions(
              generateSuggestions({
                existingEvents: dayEvents,
                durationMinutes: duration,
                date: eventDate,
                ...(typeof cleanEventData.preparationTime === 'number' && {
                  preparationTime: cleanEventData.preparationTime
                }),
                ...(typeof cleanEventData.travelTime === 'number' && {
                  travelTime: cleanEventData.travelTime
                })
              })
            )
          }
        }
        return
      }
      setSuggestions([])

      if (isUpdate) {
        await EventService.updateEvent(cleanEventData)
      } else {
        await EventService.createEvent(cleanEventData)

        // When user created a brand-new task/routine from the schedule, also
        // persist it in its native store so it appears in the respective tab.
        // This is best-effort: failure here does NOT block the schedule event
        // save or the modal close — it only logs a non-blocking warning.
        if (_isNewCreation) {
          try {
            if (cleanEventData.type === EVENT_TYPES.TASK) {
              addTaskToStorage(cleanEventData.title)
            } else if (cleanEventData.type === EVENT_TYPES.ROUTINE) {
              const durationMinutes =
                timeToMinutes(cleanEventData.endTime) -
                timeToMinutes(cleanEventData.startTime)
              // `steps` defaults to [] in routinesManager.createRoutine when not provided.
              // Only name and estimatedDuration are required for a minimal routine entry.
              await createRoutine({
                name: cleanEventData.title,
                estimatedDuration: Math.max(0, durationMinutes) * 60
              })
            }
          } catch (mirrorErr) {
            // Mirror failure is non-fatal: the schedule event was already saved.
            // Log a warning so developers are aware but don't surface this to the user.
            // biome-ignore lint/suspicious/noConsole: non-fatal mirror failure, intentional warning
            console.warn('Secondary store mirror failed (non-blocking):', mirrorErr)
          }
        }
      }

      await loadEvents()
      setIsModalOpen(false)
      setSelectedEvent(null)
    } catch (_err) {
      setError('Failed to save event. Please try again.')
    }
  }

  // Shared helper to delete an event by ID
  const deleteEventById = async (eventId) => {
    if (!eventId) {
      throw new Error('Event ID is required for deletion')
    }
    await EventService.deleteEvent(eventId)
    await loadEvents()
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) {
      return
    }

    try {
      await deleteEventById(eventToDelete.id)
      setShowActionModal(false)
      setEventToDelete(null)
    } catch (_err) {
      setError('Failed to delete event. Please try again.')
    }
  }

  const handleDeleteFromModal = async (eventId) => {
    await deleteEventById(eventId)
  }

  const handleEditEvent = () => {
    try {
      if (eventToDelete) {
        setSelectedEvent(eventToDelete)
        setSelectedEventType(eventToDelete.type)
        setShowActionModal(false)
        setIsModalOpen(true)
      } else {
      }
    } catch (_err) {
      setError('Failed to edit event. Please try again.')
    }
  }

  const handleDismissError = () => {
    setError('')
    setSuggestions([])
  }

  const handleCloseModal = () => {
    try {
      setIsModalOpen(false)
      setSelectedEvent(null)
      setSelectedEventType(null)
      // Clear any errors when closing modal
      setError('')
    } catch (_err) {}
  }

  const handleScheduleEvent = (eventType) => {
    try {
      setSelectedEventType(eventType)
      setSelectedEvent(null)
      setIsModalOpen(true)
    } catch (_err) {
      setError('Failed to open event creation. Please try again.')
    }
  }

  // Click on an event card → open ItemActionModal (edit/delete choice)
  const handleGridEventClick = useCallback((evt) => {
    setEventToDelete(evt)
    setShowActionModal(true)
  }, [])

  // Drag an event card to a new time slot → preserve duration, update day + startTime
  const handleEventDrop = useCallback(async (evtId, newDay, newHour) => {
    const evt = events.find((e) => String(e.id) === String(evtId))
    if (!evt) return
    try {
      const oldStartMins = timeToMinutes(evt.startTime)
      const oldEndMins = timeToMinutes(evt.endTime)
      const duration = oldEndMins >= oldStartMins
        ? oldEndMins - oldStartMins
        : oldEndMins + 1440 - oldStartMins
      const newStartMins = newHour * 60
      const newEndMins = newStartMins + duration
      const newStartTime = minutesToTime(newStartMins)
      const newEndTime = newEndMins >= 1440 ? '24:00' : minutesToTime(newEndMins)
      const updatedEvt = { ...evt, day: newDay, startTime: newStartTime, endTime: newEndTime }
      const structuralError = checkStructural(updatedEvt, events, evt.id)
      if (structuralError) {
        setError(structuralError)
        return
      }
      await EventService.updateEvent(updatedEvt)
      await loadEvents()
    } catch (_err) {
      setError('Failed to move event. Please try again.')
    }
  }, [events, loadEvents])

  // Click on an empty slot → open EventModal to create new event
  const handleSlotClick = useCallback(({ day, startTime, endTime }) => {
    setSelectedEvent({ day, startTime, endTime })
    setSelectedEventType(EVENT_TYPES.TASK)
    setIsModalOpen(true)
  }, [])

  /**
   * Development-only: Populate calendar with fake events
   */
  const handlePopulateFakeData = useCallback(async () => {
    if (!isDevelopment()) {
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccessMessage('')
      // Dynamic import reduces initial bundle size but doesn't eliminate code from production
      // (runtime guard still allows bundler to create a separate chunk)
      const { generateFakeEvents } = await import('../utils/fakeDataGenerator')
      const fakeEvents = generateFakeEvents(new Date(), 14) // 2 weeks of data
      let successCount = 0
      let errorCount = 0

      for (const eventData of fakeEvents) {
        try {
          await EventService.createEvent(eventData)
          successCount++
        } catch (_err) {
          errorCount++
        }
      }
      await loadEvents()

      if (successCount === 0) {
        setError('❌ Failed to create fake events')
      } else if (errorCount > 0) {
        setError(
          `⚠️ Created ${successCount} fake events, but ${errorCount} failed.`
        )
      } else {
        if (successMessageTimeoutRef.current) {
          clearTimeout(successMessageTimeoutRef.current)
        }
        setSuccessMessage(
          `✅ Created ${successCount} fake events successfully!`
        )
        successMessageTimeoutRef.current = window.setTimeout(() => {
          setSuccessMessage('')
          successMessageTimeoutRef.current = null
        }, 3000)
      }
    } catch (_err) {
      setError('Failed to populate fake data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [loadEvents])

  /**
   * Development-only: Clear all events from calendar
   */
  const handleClearAllEvents = async () => {
    if (!isDevelopment()) {
      return
    }

    // Confirm before clearing
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete ALL events?\n\n' +
        'This action cannot be undone and will remove all events from the calendar.'
    )

    if (!confirmed) {
      return
    }

    try {
      setIsLoading(true)
      setError('')

      // Get all events first
      const allEvents = await EventService.getAllEvents()

      let successCount = 0

      for (const event of allEvents) {
        try {
          await EventService.deleteEvent(event.id)
          successCount++
        } catch (_err) {
          // Deletion failed for this event; continue with others
        }
      }
      await loadEvents()

      if (successCount > 0) {
        if (successMessageTimeoutRef.current) {
          clearTimeout(successMessageTimeoutRef.current)
        }
        setSuccessMessage(`✅ Cleared ${successCount} events successfully!`)
        successMessageTimeoutRef.current = window.setTimeout(() => {
          setSuccessMessage('')
          successMessageTimeoutRef.current = null
        }, 3000)
      } else {
        if (successMessageTimeoutRef.current) {
          clearTimeout(successMessageTimeoutRef.current)
        }
        setSuccessMessage('ℹ️ No events to clear')
        successMessageTimeoutRef.current = window.setTimeout(() => {
          setSuccessMessage('')
          successMessageTimeoutRef.current = null
        }, 3000)
      }
    } catch (_err) {
      setError('Failed to clear events. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Date label for the Figma header ─────────────────────────────────────
  const headerDateLabel = (() => {
    if (view === 'day') return format(date, 'd/MM/yyyy')
    if (view === 'week') {
      const ws = startOfWeek(date, { weekStartsOn: 1 })
      const we = addDays(ws, 6)
      return `${format(ws, 'd MMM')} – ${format(we, 'd MMM yyyy')}`
    }
    return format(date, 'MMMM yyyy')
  })()

  const todayFmtStr = format(new Date(), 'd/MM/yyyy')
  const isToday = view === 'day' && headerDateLabel === todayFmtStr

  return (
    <ErrorBoundary>
      <div className='page page-schedule'>

        {/* ── Figma header ─────────────────────────────────────────────────── */}
        <div className='figma-schedule-header'>
          <div>
            <h2 className='figma-schedule-title'>Schedule</h2>
            <p className='figma-schedule-subtitle'>
              {isToday ? `Today — ${headerDateLabel}` : headerDateLabel}
            </p>
          </div>
          <div className='figma-schedule-controls'>
            <button
              type='button'
              className='figma-schedule-nav-btn'
              onClick={() => handleNavigate('PREV')}
              aria-label='Previous'
            >
              <Icon name='chevronLeft' />
            </button>
            <button
              type='button'
              className='figma-schedule-today-btn'
              onClick={() => handleNavigate('TODAY')}
            >
              Today
            </button>
            <button
              type='button'
              className='figma-schedule-nav-btn'
              onClick={() => handleNavigate('NEXT')}
              aria-label='Next'
            >
              <Icon name='chevronRight' />
            </button>

            <span className='figma-schedule-sep' aria-hidden='true' />

            {/* Period legend */}
            <div className='figma-period-legend' role='group' aria-label='Time-of-day periods'>
              {Object.entries(PERIOD_COLORS).map(([key, val]) => (
                <div key={key} className='figma-period-legend-item'>
                  <span
                    className='figma-period-dot'
                    style={{ background: val.dot, boxShadow: `0 0 6px ${val.dot}50` }}
                    aria-hidden='true'
                  />
                  <span className='figma-period-label' style={{ color: val.text }}>
                    {val.label}
                  </span>
                </div>
              ))}
            </div>

            <span className='figma-schedule-sep' aria-hidden='true' />

            {/* View selector */}
            <select
              className='figma-schedule-view-select'
              value={view}
              onChange={(e) => setView(e.target.value)}
              aria-label='View mode'
            >
              <option value='day'>Day</option>
              <option value='week'>Week</option>
              <option value='month'>Month</option>
            </select>

            {/* Schedule+ button */}
            <button
              type='button'
              className='figma-schedule-add-btn'
              onClick={() => handleScheduleEvent(EVENT_TYPES.TASK)}
              aria-label='Add event'
            >
              <Icon name='plus' />
              Schedule
            </button>
          </div>
        </div>

        {/* ── Main grid panel ───────────────────────────────────────────────── */}
        <GlassPanel className='figma-schedule-grid-panel'>
          {isLoading && (
            <div className='figma-schedule-loading' role='status' aria-live='polite'>
              Loading…
            </div>
          )}
          <div role='region' aria-label='Event calendar'>
            <FigmaScheduleGrid
              events={events}
              viewMode={view}
              date={date}
              onEventClick={handleGridEventClick}
              onSlotClick={handleSlotClick}
              onEventDrop={handleEventDrop}
              use24HourFormat={use24HourFormat}
            />
          </div>
        </GlassPanel>

        {/* ── Event type legend ─────────────────────────────────────────────── */}
        <GlassPanel className='figma-event-legend-panel'>
          <div className='figma-event-legend'>
            <span className='figma-event-legend-label'>Event types:</span>
            {Object.entries(EVENT_TYPE_COLORS).map(([type, colors]) => (
              <div key={type} className='figma-event-legend-item'>
                <span
                  className='figma-event-legend-swatch'
                  style={{ background: colors.border }}
                  aria-hidden='true'
                />
                <span className='figma-event-legend-text' style={{ color: colors.text }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* ── Error toast ───────────────────────────────────────────────────── */}
        {error && (
          <div className='fc-error-toast' role='alert'>
            {error}
            {suggestions.length > 0 && (
              <div className='fc-error-suggestions' role='group' aria-label='Available time slots'>
                <span className='fc-error-suggestions-label'>Try instead:</span>
                <ul className='fc-error-suggestions-list'>
                  {suggestions.map((s) => (
                    <li key={s.startMinutes} className='fc-error-suggestion-slot'>
                      {minutesToTime(s.startMinutes)} – {s.endMinutes === 1440 ? '24:00' : minutesToTime(s.endMinutes)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type='button'
              onClick={handleDismissError}
              className='error-dismiss'
              aria-label='Dismiss error'
            >
              ×
            </button>
          </div>
        )}

        {/* ── Success toast ─────────────────────────────────────────────────── */}
        {successMessage && (
          <div className='success-message' role='status'>
            {successMessage}
            <button
              type='button'
              onClick={() => setSuccessMessage('')}
              className='success-dismiss'
              aria-label='Dismiss message'
            >
              ×
            </button>
          </div>
        )}

        {/* ── Event Modal (create / edit) ───────────────────────────────────── */}
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteFromModal}
          eventType={selectedEventType}
          initialData={selectedEvent}
        />

        {/* ── Action Modal (edit / delete choice) ──────────────────────────── */}
        {showActionModal && eventToDelete && (
          <ItemActionModal
            item={eventToDelete}
            onClose={() => {
              setShowActionModal(false)
              setEventToDelete(null)
            }}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        )}

        {/* ── Floating Dev Buttons (dev only) ──────────────────────────────── */}
        {isDevelopment() && FloatingDevButtons && (
          <FloatingDevButtons
            onPopulateData={handlePopulateFakeData}
            onClearData={handleClearAllEvents}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Schedule
