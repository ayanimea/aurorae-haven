/**
 * Schedule Page - Calendar view for events using React Big Calendar
 * Manages routines, tasks, meetings, and habits with a clean, accessible interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns'
import EventModal from '../components/Schedule/EventModal'
import ItemActionModal from '../components/ItemActionModal'
import CustomToolbar from '../components/Schedule/CustomToolbar'
import SolidEventCard from '../components/Schedule/SolidEventCard'
import TimeBands from '../components/Schedule/TimeBands'
import ErrorBoundary from '../components/ErrorBoundary'
import EventService from '../services/EventService'
import { toRBCEvents, createEventFromSlot } from '../utils/eventAdapter'
import { EVENT_TYPES } from '../utils/scheduleConstants'
import { getSettings } from '../utils/settingsManager'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../assets/styles/schedule-rbc.css'
import '../components/ErrorBoundary.css'

// Format helper functions (module level to avoid recreation on each render)
const createTimeFormatter = (use24HourFormat) => {
  const timeFormat = use24HourFormat ? 'HH:mm' : 'h:mm a'
  return ({ start, end }) =>
    `${format(start, timeFormat)} - ${format(end, timeFormat)}`
}

// Configure date-fns localizer for React Big Calendar with European settings
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday start (European)
  getDay,
  locales: {}
})

function Schedule() {
  // State management
  const [view, setView] = useState('day')
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)

  // Get time format preference from settings (default to 24-hour)
  // Reading settings directly (no memo) - changes in localStorage only reflected
  // when this component re-renders. For automatic updates on external changes,
  // implement a settings subscription/refresh mechanism.
  const settings = getSettings()
  const use24HourFormat = settings.schedule?.use24HourFormat ?? true

  // Convert events to RBC format
  const rbcEvents = useMemo(() => toRBCEvents(events), [events])

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

  // Event handlers
  const handleSelectSlot = useCallback((slotInfo) => {
    try {
      console.log('Slot selected:', slotInfo)
      const eventData = createEventFromSlot(slotInfo)
      if (eventData) {
        setSelectedEvent(eventData)
        setSelectedEventType(EVENT_TYPES.TASK)
        setIsModalOpen(true)
      } else {
        console.warn('Failed to create event data from slot')
      }
    } catch (err) {
      console.error('[Schedule] Error handling slot selection:', err)
      setError('Failed to create event. Please try again.')
    }
  }, [])

  const handleSelectEvent = useCallback((event) => {
    try {
      console.log('Event selected:', event)
      const originalEvent = event.resource?.originalEvent
      if (originalEvent) {
        const isContextMenu =
          event.resource?.isContextMenu ?? event.isContextMenu ?? false
        setEventToDelete({ ...originalEvent, isContextMenu })
        setShowActionModal(true)
      } else {
        console.warn('Event selected but no originalEvent found in resource')
      }
    } catch (err) {
      console.error('[Schedule] Error handling event selection:', err)
      setError('Failed to select event. Please try again.')
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

  // Calendar configuration
  const views = useMemo(
    () => ({
      day: true,
      week: true,
      month: true
    }),
    []
  )

  const formats = useMemo(() => {
    const gutterFormat = use24HourFormat ? 'HH:mm' : 'h a'
    const timeFormatter = createTimeFormatter(use24HourFormat)

    return {
      timeGutterFormat: gutterFormat,
      eventTimeRangeFormat: timeFormatter,
      agendaTimeRangeFormat: timeFormatter,
      dayFormat: 'EEE dd',
      dayHeaderFormat: 'EEEE, MMMM d',
      monthHeaderFormat: 'MMMM yyyy'
    }
  }, [use24HourFormat])

  return (
    <ErrorBoundary>
      <div className='page page-schedule'>
        <div className='schedule-container'>
          <div className='schedule-wrapper'>
            <TimeBands />
            <Calendar
              localizer={localizer}
              events={rbcEvents}
              view={view}
              views={views}
              date={date}
              onNavigate={setDate}
              onView={setView}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              popup
              step={15}
              timeslots={4}
              min={new Date(2000, 0, 1, 7, 0)}
              max={new Date(2000, 0, 2, 0, 0)}
              formats={formats}
              aria-label='Event calendar'
              components={{
                toolbar: (props) => (
                  <CustomToolbar
                    {...props}
                    views={['day', 'week', 'month']}
                    onScheduleEvent={handleScheduleEvent}
                    EVENT_TYPES={EVENT_TYPES}
                  />
                ),
                event: SolidEventCard
              }}
              eventPropGetter={(event) => ({
                className: `event-${event.resource?.type || 'task'}`
              })}
            />
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
      </div>
    </ErrorBoundary>
  )
}

export default Schedule
