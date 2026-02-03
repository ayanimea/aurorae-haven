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
import CustomEvent from '../components/Schedule/CustomEvent'
import EventService from '../services/EventService'
import { toRBCEvents, createEventFromSlot } from '../utils/eventAdapter'
import { createLogger } from '../utils/logger'
import { EVENT_TYPES } from '../utils/scheduleConstants'
import { getSettings } from '../utils/settingsManager'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../assets/styles/schedule-rbc.css'

const logger = createLogger('Schedule')

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
  // Read directly without memo to ensure it updates when settings change
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
        const startOfMonth = startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1))
        const endOfMonth = addDays(startOfMonth, 41) // 6 weeks
        loadedEvents = await EventService.getEventsForRange(
          format(startOfMonth, 'yyyy-MM-dd'),
          format(endOfMonth, 'yyyy-MM-dd')
        )
      }

      setEvents(loadedEvents)
    } catch (err) {
      logger.error('Failed to load events:', err)
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
  const handleSelectSlot = useCallback(
    (slotInfo) => {
      const eventData = createEventFromSlot(slotInfo)
      if (eventData) {
        setSelectedEvent(eventData)
        setSelectedEventType(EVENT_TYPES.TASK)
        setIsModalOpen(true)
      }
    },
    []
  )

  const handleSelectEvent = useCallback((event) => {
    const originalEvent = event.resource?.originalEvent
    if (originalEvent) {
      setEventToDelete(originalEvent)
      setShowActionModal(true)
    }
  }, [])

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        await EventService.updateEvent(eventData.id, eventData)
      } else {
        await EventService.createEvent(eventData)
      }
      await loadEvents()
      setIsModalOpen(false)
      setSelectedEvent(null)
    } catch (err) {
      logger.error('Failed to save event:', err)
      setError('Failed to save event. Please try again.')
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      await EventService.deleteEvent(eventToDelete.id)
      await loadEvents()
      setShowActionModal(false)
      setEventToDelete(null)
    } catch (err) {
      logger.error('Failed to delete event:', err)
      setError('Failed to delete event. Please try again.')
    }
  }

  const handleEditEvent = () => {
    if (eventToDelete) {
      setSelectedEvent(eventToDelete)
      setSelectedEventType(eventToDelete.type)
      setShowActionModal(false)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
    setSelectedEventType(null)
  }

  const handleScheduleEvent = (eventType) => {
    setSelectedEventType(eventType)
    setSelectedEvent(null)
    setIsModalOpen(true)
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

  const formats = useMemo(
    () => {
      const timeFormat = use24HourFormat ? 'HH:mm' : 'h:mm a'
      const gutterFormat = use24HourFormat ? 'HH:mm' : 'h a'
      
      return {
        timeGutterFormat: gutterFormat,
        eventTimeRangeFormat: ({ start, end }) => {
          return `${format(start, timeFormat)} - ${format(end, timeFormat)}`
        },
        agendaTimeRangeFormat: ({ start, end }) => {
          return `${format(start, timeFormat)} - ${format(end, timeFormat)}`
        },
        dayFormat: 'EEE dd',
        dayHeaderFormat: 'EEEE, MMMM d',
        monthHeaderFormat: 'MMMM yyyy'
      }
    },
    [use24HourFormat]
  )

  return (
    <div className="page page-schedule">
      <div className="schedule-container">
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
          components={{
            toolbar: (props) => (
              <CustomToolbar
                {...props}
                views={['day', 'week', 'month']}
                onScheduleEvent={handleScheduleEvent}
                EVENT_TYPES={EVENT_TYPES}
              />
            ),
            event: CustomEvent
          }}
          eventPropGetter={(event) => ({
            className: `event-${event.resource?.type || 'task'}`
          })}
        />

        {isLoading && (
          <div className="loading-overlay">
            <p>Loading events...</p>
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
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
  )
}

export default Schedule
