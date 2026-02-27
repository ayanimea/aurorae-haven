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
 * Schedule Page - Calendar view for events using FullCalendar
 * Manages routines, tasks, meetings, and habits with a clean, accessible interface
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
// NOTE: FullCalendar v6 still ships CSS that is typically imported explicitly
// (for example: '@fullcalendar/core/index.css', '@fullcalendar/timegrid/index.css').
// In this project we intentionally do NOT import FullCalendar's default CSS here.
// Instead, '../assets/styles/fullcalendar-custom.css' provides the required styles,
// redefining or replacing the stock styles to match our spec. See:
// https://fullcalendar.io/docs/upgrading-from-v5 for background on v6 CSS entrypoints.
import { format, startOfWeek, addDays } from 'date-fns'
import EventModal from '../components/Schedule/EventModal'
import ItemActionModal from '../components/ItemActionModal'
import CustomToolbar from '../components/Schedule/CustomToolbar'
import SolidEventCard from '../components/Schedule/SolidEventCard'
import TimeBands from '../components/Schedule/TimeBands'
import ErrorBoundary from '../components/ErrorBoundary'
import EventService from '../services/EventService'
import {
  toFullCalendarEvents,
  createEventFromSlot
} from '../utils/eventAdapter'
import { EVENT_TYPES, TIME_ZONE_HOURS, DEFAULT_EVENT_DURATION_MINUTES } from '../utils/scheduleConstants'
import { getSettings } from '../utils/settingsManager'
import { isDevelopment } from '../utils/environment'
import { addTaskToStorage } from '../utils/scheduleHelpers'
import { createRoutine } from '../utils/routinesManager'
import { timeToMinutes } from '../utils/timeUtils'
import '../assets/styles/fullcalendar-custom.css'
import '../components/ErrorBoundary.css'

// Dev-only helpers are loaded via dynamic import behind an isDevelopment() guard.
// With Vite, these modules are still included in the production build as separate
// code-split chunks; the guard only controls whether they are requested at runtime.
// This reduces initial bundle size but does NOT remove dev-only code from production.

// Console statements are intentionally used throughout this file for production debugging
// and error handling. They replaced a custom logger utility that was causing issues in
// production builds where Vite's minification was removing the logger module entirely,
// resulting in "logger is not defined" runtime errors. Direct console usage is immune
// to tree-shaking and ensures reliable error reporting in production environments.
// See commit 511b225 for the migration from custom logger to console methods.

function Schedule() {
  // FullCalendar ref for API access
  const calendarRef = useRef(null)

  // WeakMap for storing context menu handlers (better memory management than DOM properties)
  const contextMenuHandlersRef = useRef(new WeakMap())

  // Success message timeout ref for cleanup on unmount
  const successMessageTimeoutRef = useRef(null)
  // Ref that always points to the latest loadEvents callback so storage event
  // handlers (defined before loadEvents) can call it without stale closures.
  const loadEventsRef = useRef(null)

  // State management
  const [view, setView] = useState('day') // Normalized view name for loadEvents (day/week/month)
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)

  // Dev-only: Lazy-loaded FloatingDevButtons component
  const [FloatingDevButtons, setFloatingDevButtons] = useState(null)

  // Get time format preference from settings (default to 24-hour)
  // Reactive settings: useState + storage listener for cross-tab updates
  // Settings changes in Settings page or other tabs now reflect immediately
  const [use24HourFormat, setUse24HourFormat] = useState(
    () => getSettings().schedule?.use24HourFormat ?? true
  )

  useEffect(() => {
    // Handle cross-tab updates via 'storage' event (fires when localStorage changes in another tab)
    const handleStorage = (event) => {
      try {
        const updatedValue = getSettings().schedule?.use24HourFormat
        if (typeof updatedValue === 'boolean') {
          setUse24HourFormat(updatedValue)
        }
      } catch (_err) {}

      // Reload schedule events when tasks or routines are modified in another
      // tab so the Schedule view stays in sync without requiring a page refresh.
      if (event?.key === 'aurorae_tasks' || event?.key === 'aurorae_routines') {
        loadEventsRef.current?.()
      }
    }

    // Handle same-tab updates via custom 'settingsUpdated' event
    // Settings page should dispatch: window.dispatchEvent(new CustomEvent('settingsUpdated'))
    const handleSettingsUpdated = () => {
      try {
        const updatedValue = getSettings().schedule?.use24HourFormat
        if (typeof updatedValue === 'boolean') {
          setUse24HourFormat(updatedValue)
        }
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

  // Convert events to FullCalendar format
  const fullCalendarEvents = useMemo(
    () => toFullCalendarEvents(events),
    [events]
  )

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
          new Date(date.getFullYear(), date.getMonth(), 1)
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

  // Event handlers
  const handleEventContextMenu = useCallback((event, x, y) => {
    try {
      const originalEvent = event.resource?.originalEvent || event
      if (originalEvent) {
        setEventToDelete({
          ...originalEvent,
          isContextMenu: true,
          contextMenuX: x,
          contextMenuY: y
        })
        setShowActionModal(true)
      } else {
      }
    } catch (_err) {}
  }, [])

  const handleSaveEvent = async (eventData) => {
    try {
      // Ensure we have a valid event object
      if (!eventData) {
        throw new Error('No event data provided')
      }

      // Strip the internal flag before persisting to avoid polluting IndexedDB
      const { _isNewCreation, ...cleanEventData } = eventData

      // Check if this is an update or create
      // For updates, we need both an ID and it must be a string/number
      const isUpdate =
        cleanEventData.id &&
        (typeof cleanEventData.id === 'string' ||
          typeof cleanEventData.id === 'number')

      if (isUpdate) {
        await EventService.updateEvent(cleanEventData)
      } else {
        await EventService.createEvent(cleanEventData)

        // When user created a brand-new task/routine from the schedule, also
        // persist it in its native store so it appears in the respective tab.
        if (_isNewCreation) {
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

  // Compute min/max times for the schedule view (07:00 to 24:00)
  const slotMinTime = '07:00:00'
  const slotMaxTime = '24:00:00'

  // Map normalized view names to FullCalendar view names
  const getFullCalendarView = useCallback((normalizedView) => {
    const viewMap = {
      day: 'timeGridDay',
      week: 'timeGridWeek',
      month: 'dayGridMonth'
    }
    return viewMap[normalizedView] || 'timeGridDay'
  }, [])

  // Sync view state changes with FullCalendar
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      const fullCalendarView = getFullCalendarView(view)
      if (calendarApi.view.type !== fullCalendarView) {
        calendarApi.changeView(fullCalendarView)
      }
    }
  }, [view, getFullCalendarView])

  // Sync date state changes with FullCalendar
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      const currentDate = calendarApi.getDate()
      // Only update if dates differ significantly (avoid infinite loops)
      if (Math.abs(currentDate.getTime() - date.getTime()) > 1000) {
        calendarApi.gotoDate(date)
      }
    }
  }, [date])

  // Handle view change from toolbar (receives FullCalendar view name, converts to normalized)
  const handleViewChange = useCallback((newFullCalendarView) => {
    const normalizedViewMap = {
      timeGridDay: 'day',
      timeGridWeek: 'week',
      dayGridMonth: 'month'
    }
    const normalizedView = normalizedViewMap[newFullCalendarView] || 'day'
    setView(normalizedView)
  }, [])

  // Handle event click (FullCalendar)
  const handleEventClick = useCallback((clickInfo) => {
    const event = clickInfo.event
    const originalEvent = event.extendedProps?.originalEvent

    if (originalEvent) {
      setSelectedEvent(originalEvent)
      setSelectedEventType(originalEvent.type || EVENT_TYPES.TASK)
      setIsModalOpen(true)
    }
  }, [])

  // Handle date select (FullCalendar equivalent of onSelectSlot)
  const handleDateSelect = useCallback((selectInfo) => {
    const slotInfo = {
      start: selectInfo.start,
      end: selectInfo.end
    }
    const newEvent = createEventFromSlot(slotInfo)
    if (newEvent) {
      setSelectedEvent(newEvent)
      setSelectedEventType(newEvent.type || EVENT_TYPES.TASK)
      setIsModalOpen(true)
    }
    // Clear the selection
    selectInfo.view.calendar.unselect()
  }, [])

  // Handle event unmount for cleanup
  const handleEventWillUnmount = useCallback((unmountInfo) => {
    const el = unmountInfo.el
    if (!el) return

    // Remove event listener when event is unmounted
    const handler = contextMenuHandlersRef.current.get(el)
    if (typeof handler === 'function') {
      el.removeEventListener('contextmenu', handler)
      contextMenuHandlersRef.current.delete(el)
    }
  }, [])

  // Handle event context menu (right-click) using WeakMap for better memory management
  const handleEventMouseEnter = useCallback(
    (mouseEnterInfo) => {
      const el = mouseEnterInfo.el

      if (!el) {
        return
      }

      // Remove any existing contextmenu handler
      const previousHandler = contextMenuHandlersRef.current.get(el)
      if (typeof previousHandler === 'function') {
        el.removeEventListener('contextmenu', previousHandler)
      }

      const contextMenuHandler = (e) => {
        e.preventDefault()
        const originalEvent = mouseEnterInfo.event.extendedProps?.originalEvent
        if (originalEvent) {
          handleEventContextMenu(originalEvent, e.clientX, e.clientY)
        }
      }

      // Store the handler in WeakMap for proper garbage collection
      contextMenuHandlersRef.current.set(el, contextMenuHandler)
      el.addEventListener('contextmenu', contextMenuHandler)
    },
    [handleEventContextMenu]
  )

  // Handle event drag-and-drop (FullCalendar).
  // Note: drag-and-drop is mouse-driven. Keyboard users can edit event times
  // via the EventModal (click → open → edit start/end time fields).
  const handleEventDrop = useCallback(
    async (dropInfo) => {
      const originalEvent = dropInfo.event.extendedProps?.originalEvent
      if (!originalEvent) {
        dropInfo.revert()
        return
      }
      try {
        const newStart = dropInfo.event.start
        const defaultEndMs = newStart.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000
        const newEnd = dropInfo.event.end ?? new Date(defaultEndMs)
        const updated = {
          ...originalEvent,
          day: format(newStart, 'yyyy-MM-dd'),
          startTime: format(newStart, 'HH:mm'),
          // endTime uses HH:mm; if event crosses midnight the adapter handles display correctly
          endTime: format(newEnd, 'HH:mm')
        }
        await EventService.updateEvent(updated)
        await loadEvents()
      } catch (_err) {
        dropInfo.revert()
        setError('Failed to move event. Please try again.')
      }
    },
    [loadEvents]
  )

  // Handle event resize (FullCalendar)
  const handleEventResize = useCallback(
    async (resizeInfo) => {
      const originalEvent = resizeInfo.event.extendedProps?.originalEvent
      if (!originalEvent) {
        resizeInfo.revert()
        return
      }
      try {
        const newStart = resizeInfo.event.start
        const defaultEndMs = newStart.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000
        const newEnd = resizeInfo.event.end ?? new Date(defaultEndMs)
        const updated = {
          ...originalEvent,
          day: format(newStart, 'yyyy-MM-dd'),
          startTime: format(newStart, 'HH:mm'),
          // endTime uses HH:mm; if event crosses midnight the adapter handles display correctly
          endTime: format(newEnd, 'HH:mm')
        }
        await EventService.updateEvent(updated)
        await loadEvents()
      } catch (_err) {
        resizeInfo.revert()
        setError('Failed to resize event. Please try again.')
      }
    },
    [loadEvents]
  )

  return (
    <ErrorBoundary>
      <div className='page page-schedule'>
        <div className='schedule-container'>
          <div className='schedule-wrapper'>
            {/* Custom Toolbar */}
            <div>
              <CustomToolbar
                date={date}
                view={getFullCalendarView(view)}
                views={['timeGridDay', 'timeGridWeek', 'dayGridMonth']}
                onNavigate={(action) => {
                  const calendarApi = calendarRef.current?.getApi()
                  if (!calendarApi) return

                  switch (action) {
                    case 'PREV':
                      calendarApi.prev()
                      setDate(calendarApi.getDate())
                      break
                    case 'NEXT':
                      calendarApi.next()
                      setDate(calendarApi.getDate())
                      break
                    case 'TODAY':
                      calendarApi.today()
                      setDate(calendarApi.getDate())
                      break
                    default:
                      break
                  }
                }}
                onView={handleViewChange}
                onScheduleEvent={handleScheduleEvent}
                isLoading={isLoading}
                EVENT_TYPES={EVENT_TYPES}
              />
            </div>

            {/* Calendar area: TimeBands + FullCalendar wrapped in a positioned container
                 so bands (z-index: 0, position: absolute) sit behind .fc which renders
                 on top via DOM order within the same stack level. */}
            <div className='schedule-calendar-container'>
              {/* Only render time-of-day bands for time grid views (not month view) */}
              {(view === 'day' || view === 'week') && <TimeBands />}

              {/* FullCalendar - Wrapped for aria-label support */}
              <div role='region' aria-label='Event calendar'>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                  initialView={getFullCalendarView(view)}
                  initialDate={date}
                  events={fullCalendarEvents}
                  nowIndicator={true}
                  slotMinTime={slotMinTime}
                  slotMaxTime={slotMaxTime}
                  slotDuration='00:15:00'
                  slotLabelInterval='01:00:00'
                  allDaySlot={false}
                  headerToolbar={false}
                  height='auto'
                  expandRows={true}
                  slotLabelFormat={{
                    hour: use24HourFormat ? '2-digit' : 'numeric',
                    minute: '2-digit',
                    hour12: !use24HourFormat,
                    meridiem: use24HourFormat ? false : 'short'
                  }}
                  eventTimeFormat={{
                    hour: use24HourFormat ? '2-digit' : 'numeric',
                    minute: '2-digit',
                    hour12: !use24HourFormat
                  }}
                  firstDay={1}
                  selectable={true}
                  selectMirror={true}
                  editable={true}
                  eventOverlap={true}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  select={handleDateSelect}
                  eventMouseEnter={handleEventMouseEnter}
                  eventWillUnmount={handleEventWillUnmount}
                  eventDidMount={(info) => {
                    if (!info.event.start) return
                    const hour = info.event.start.getHours()
                    if (
                      hour < TIME_ZONE_HOURS.MORNING ||
                      hour >= TIME_ZONE_HOURS.NIGHT
                    ) {
                      info.el.dataset.timezone = 'night'
                    } else if (hour < TIME_ZONE_HOURS.AFTERNOON) {
                      info.el.dataset.timezone = 'morning'
                    } else if (hour < TIME_ZONE_HOURS.EVENING) {
                      info.el.dataset.timezone = 'afternoon'
                    } else {
                      info.el.dataset.timezone = 'evening'
                    }
                  }}
                  eventContent={(eventInfo) => (
                    <SolidEventCard
                      use24HourFormat={use24HourFormat}
                      event={{
                        ...eventInfo.event,
                        title: eventInfo.event.title, // Explicitly pass title from FullCalendar event
                        resource: {
                          type: eventInfo.event.extendedProps?.type,
                          originalEvent:
                            eventInfo.event.extendedProps?.originalEvent,
                          preparationTime:
                            eventInfo.event.extendedProps?.preparationTime,
                          travelTime: eventInfo.event.extendedProps?.travelTime
                        }
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {isLoading && (
            <div className='loading-overlay'>
              <p>Loading events...</p>
            </div>
          )}

          {error && (
            <div className='fc-error-toast' role='alert'>
              {error}
              <button
                type='button'
                onClick={() => setError('')}
                className='error-dismiss'
                aria-label='Dismiss error'
              >
                ×
              </button>
            </div>
          )}

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
        </div>

        {/* Event Modal */}
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteFromModal}
          eventType={selectedEventType}
          initialData={selectedEvent}
        />

        {/* Action Modal for Edit/Delete */}
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

        {/* Floating Dev Buttons - Only visible in development mode */}
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
