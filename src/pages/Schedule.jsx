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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format, startOfWeek, addDays } from 'date-fns'
import EventModal from '../components/Schedule/EventModal'
import ItemActionModal from '../components/ItemActionModal'
import CustomToolbar from '../components/Schedule/CustomToolbar'
import SolidEventCard from '../components/Schedule/SolidEventCard'
import TimeBands from '../components/Schedule/TimeBands'
import FloatingDevButtons from '../components/Schedule/FloatingDevButtons'
import ErrorBoundary from '../components/ErrorBoundary'
import EventService from '../services/EventService'
import { toFullCalendarEvents, createEventFromSlot } from '../utils/eventAdapter'
import { EVENT_TYPES } from '../utils/scheduleConstants'
import { getSettings } from '../utils/settingsManager'
import { generateFakeEvents } from '../utils/fakeDataGenerator'
import { isDevelopment } from '../utils/environment'
import '../assets/styles/fullcalendar-custom.css'
import '../components/ErrorBoundary.css'

/* eslint-disable no-console */
// Console statements are intentionally used throughout this file for production debugging
// and error handling. They replaced a custom logger utility that was causing issues in
// production builds where Vite's minification was removing the logger module entirely,
// resulting in "logger is not defined" runtime errors. Direct console usage is immune
// to tree-shaking and ensures reliable error reporting in production environments.
// See commit 511b225 for the migration from custom logger to console methods.

function Schedule() {
  // FullCalendar ref for API access
  const calendarRef = useRef(null)
  
  // Toolbar ref for dynamic height measurement (aligns time-of-day bands)
  const toolbarRef = useRef(null)
  
  // WeakMap for storing context menu handlers (better memory management than DOM properties)
  const contextMenuHandlersRef = useRef(new WeakMap())
  
  // Track if fake data auto-population has already been attempted (prevents multiple calls)
  const hasAutoPopulatedRef = useRef(false)
  
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

  // Get time format preference from settings (default to 24-hour)
  // Reactive settings: useState + storage listener for cross-tab updates
  // Settings changes in Settings page or other tabs now reflect immediately
  const [use24HourFormat, setUse24HourFormat] = useState(
    () => getSettings().schedule?.use24HourFormat ?? true
  )

  useEffect(() => {
    // Handle cross-tab updates via 'storage' event (fires when localStorage changes in another tab)
    const handleStorage = () => {
      try {
        const updatedValue = getSettings().schedule?.use24HourFormat
        if (typeof updatedValue === 'boolean') {
          setUse24HourFormat(updatedValue)
        }
      } catch (err) {
        console.error(
          'Failed to sync 24-hour format from settings (storage):',
          err
        )
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
      } catch (err) {
        console.error(
          'Failed to sync 24-hour format from settings (custom event):',
          err
        )
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('settingsUpdated', handleSettingsUpdated)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('settingsUpdated', handleSettingsUpdated)
    }
  }, [])

  // Convert events to FullCalendar format
  const fullCalendarEvents = useMemo(() => toFullCalendarEvents(events), [events])

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
    } catch (err) {
      console.error('Failed to load events:', err)
      setError('Failed to load events. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [view, date])

  // Load events when view or date changes
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Dynamically measure and sync toolbar height with TimeBands CSS variable
  // This ensures time-of-day bands always align perfectly with the time grid,
  // regardless of toolbar content changes (new buttons, text wrapping, responsive layouts)
  useEffect(() => {
    const updateToolbarHeight = () => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight
        document.documentElement.style.setProperty('--toolbar-height', `${height}px`)
      }
    }
    
    // Measure on mount and view changes (toolbar may resize)
    updateToolbarHeight()
    
    // Re-measure on window resize (responsive toolbar height)
    window.addEventListener('resize', updateToolbarHeight)
    return () => window.removeEventListener('resize', updateToolbarHeight)
  }, [view]) // Re-run when view changes as toolbar buttons may affect height

  // Event handlers
  const handleEventContextMenu = useCallback((event) => {
    try {
      console.log('Event context menu:', event)
      const originalEvent = event.resource?.originalEvent || event
      if (originalEvent) {
        setEventToDelete({ ...originalEvent, isContextMenu: true })
        setShowActionModal(true)
      } else {
        console.warn('Context menu triggered but no originalEvent found')
      }
    } catch (err) {
      console.error('[Schedule] Error handling context menu:', err)
    }
  }, [])

  const handleSaveEvent = async (eventData) => {
    try {
      // Ensure we have a valid event object
      if (!eventData) {
        throw new Error('No event data provided')
      }

      // Check if this is an update or create
      // For updates, we need both an ID and it must be a string/number
      const isUpdate =
        eventData.id &&
        (typeof eventData.id === 'string' || typeof eventData.id === 'number')

      if (isUpdate) {
        console.log('Updating event:', eventData.id)
        await EventService.updateEvent(eventData.id, eventData)
      } else {
        console.log('Creating new event')
        await EventService.createEvent(eventData)
      }

      await loadEvents()
      setIsModalOpen(false)
      setSelectedEvent(null)
    } catch (err) {
      console.error('[Schedule] Failed to save event:', err)
      setError('Failed to save event. Please try again.')
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) {
      console.warn('handleDeleteEvent called with no eventToDelete')
      return
    }

    try {
      if (!eventToDelete.id) {
        throw new Error('Event ID is required for deletion')
      }

      console.log('Deleting event:', eventToDelete.id)
      await EventService.deleteEvent(eventToDelete.id)
      await loadEvents()
      setShowActionModal(false)
      setEventToDelete(null)
    } catch (err) {
      console.error('[Schedule] Failed to delete event:', err)
      setError('Failed to delete event. Please try again.')
    }
  }

  const handleEditEvent = () => {
    try {
      if (eventToDelete) {
        console.log('Editing event:', eventToDelete.id)
        setSelectedEvent(eventToDelete)
        setSelectedEventType(eventToDelete.type)
        setShowActionModal(false)
        setIsModalOpen(true)
      } else {
        console.warn('handleEditEvent called with no eventToDelete')
      }
    } catch (err) {
      console.error('[Schedule] Error handling edit event:', err)
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
    } catch (err) {
      console.error('[Schedule] Error closing modal:', err)
    }
  }

  const handleScheduleEvent = (eventType) => {
    try {
      console.log('Schedule event button clicked:', eventType)
      setSelectedEventType(eventType)
      setSelectedEvent(null)
      setIsModalOpen(true)
    } catch (err) {
      console.error('[Schedule] Error handling schedule event:', err)
      setError('Failed to open event creation. Please try again.')
    }
  }

  /**
   * Development-only: Populate calendar with fake events
   */
  const handlePopulateFakeData = useCallback(async () => {
    if (!isDevelopment()) {
      console.warn('Fake data population only available in development mode')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccessMessage('')
      
      console.log('Generating fake events...')
      const fakeEvents = generateFakeEvents(new Date(), 14) // 2 weeks of data
      
      console.log(`Creating ${fakeEvents.length} fake events...`)
      let successCount = 0
      let errorCount = 0
      
      for (const eventData of fakeEvents) {
        try {
          await EventService.createEvent(eventData)
          successCount++
        } catch (err) {
          console.error('Failed to create fake event:', err)
          errorCount++
        }
      }
      
      console.log(`Created ${successCount} events (${errorCount} errors)`)
      await loadEvents()
      
      if (successCount === 0) {
        setError('❌ Failed to create fake events')
      } else if (errorCount > 0) {
        setError(`⚠️ Created ${successCount} fake events, but ${errorCount} failed.`)
      } else {
        setSuccessMessage(`✅ Created ${successCount} fake events successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      console.error('[Schedule] Error populating fake data:', err)
      setError('Failed to populate fake data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [loadEvents])

  // Auto-populate fake data on first load (dev mode only)
  // Uses ref to prevent multiple auto-population attempts
  useEffect(() => {
    if (isDevelopment() && events.length === 0 && !isLoading && !hasAutoPopulatedRef.current) {
      hasAutoPopulatedRef.current = true
      console.log('[Schedule] Auto-populating fake data for development...')
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handlePopulateFakeData()
      }, 500)
      return () => clearTimeout(timer)
    }
    // Deliberately omit handlePopulateFakeData from deps to prevent re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, isLoading])

  /**
   * Development-only: Clear all events from calendar
   */
  const handleClearAllEvents = async () => {
    if (!isDevelopment()) {
      console.warn('Clear all events only available in development mode')
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
      
      console.log('Clearing all events...')
      
      // Get all events first
      const allEvents = await EventService.getAllEvents()
      console.log(`Found ${allEvents.length} events to delete`)
      
      let successCount = 0
      let errorCount = 0
      
      for (const event of allEvents) {
        try {
          await EventService.deleteEvent(event.id)
          successCount++
        } catch (err) {
          console.error('Failed to delete event:', err)
          errorCount++
        }
      }
      
      console.log(`Deleted ${successCount} events (${errorCount} errors)`)
      await loadEvents()
      
      if (successCount > 0) {
        setSuccessMessage(`✅ Cleared ${successCount} events successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setSuccessMessage('ℹ️ No events to clear')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      console.error('[Schedule] Error clearing all events:', err)
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
          handleEventContextMenu(originalEvent)
        }
      }

      // Store the handler in WeakMap for proper garbage collection
      contextMenuHandlersRef.current.set(el, contextMenuHandler)
      el.addEventListener('contextmenu', contextMenuHandler)
    },
    [handleEventContextMenu]
  )

  // Cleanup all context menu handlers on component unmount
  // Prevents memory leaks if component unmounts before eventWillUnmount fires
  useEffect(() => {
    return () => {
      // Note: WeakMap doesn't support iteration, but handlers will be garbage collected
      // when their associated DOM elements are removed
      console.log('[Schedule] Component unmounting, context menu handlers will be garbage collected')
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className='page page-schedule'>
        <div className='schedule-container'>
          <div className='schedule-wrapper'>
            <TimeBands />
            
            {/* Custom Toolbar - Wrapped for dynamic height measurement */}
            <div ref={toolbarRef}>
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

            {/* FullCalendar - Wrapped for aria-label support */}
            <div role="region" aria-label="Event calendar">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                initialView={getFullCalendarView(view)}
                initialDate={date}
                events={fullCalendarEvents}
                slotMinTime={slotMinTime}
                slotMaxTime={slotMaxTime}
                slotDuration="00:15:00"
                slotLabelInterval="01:00:00"
                headerToolbar={false}
                height="auto"
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
                editable={false}
                eventClick={handleEventClick}
                select={handleDateSelect}
                eventMouseEnter={handleEventMouseEnter}
                eventWillUnmount={handleEventWillUnmount}
                eventContent={(eventInfo) => (
                  <SolidEventCard
                    event={{
                      ...eventInfo.event,
                      title: eventInfo.event.title, // Explicitly pass title from FullCalendar event
                      resource: {
                        type: eventInfo.event.extendedProps?.type,
                        originalEvent: eventInfo.event.extendedProps?.originalEvent,
                        preparationTime: eventInfo.event.extendedProps?.preparationTime,
                        travelTime: eventInfo.event.extendedProps?.travelTime
                      }
                    }}
                  />
                )}
              />
            </div>

          </div>

          {isLoading && (
            <div className='loading-overlay'>
              <p>Loading events...</p>
            </div>
          )}

          {error && (
            <div className='error-message' role='alert'>
              {error}
              <button
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
        {isDevelopment() && (
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
