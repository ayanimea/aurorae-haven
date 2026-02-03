/**
 * Schedule Page - Calendar view for events using React Big Calendar
 * Manages routines, tasks, meetings, and habits with a clean, accessible interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfDay } from 'date-fns'
import EventModal from '../components/Schedule/EventModal'
import ItemActionModal from '../components/ItemActionModal'
import CustomToolbar from '../components/Schedule/CustomToolbar'
import CustomEvent from '../components/Schedule/CustomEvent'
import EventService from '../services/EventService'
import { toRBCEvents, createEventFromSlot } from '../utils/eventAdapter'
import { createLogger } from '../utils/logger'
import { EVENT_TYPES } from '../utils/scheduleConstants'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../assets/styles/schedule-rbc.css'

const logger = createLogger('Schedule')

// Configure date-fns localizer for React Big Calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {}
})

// Custom view for 3-day
class ThreeDayView extends React.Component {
  render() {
    const { date, ...props } = this.props
    const start = startOfDay(date)
    const range = [start, addDays(start, 1), addDays(start, 2)]
    
    return <Views.Week {...props} date={date} range={range} />
  }
}

ThreeDayView.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired
}

ThreeDayView.range = (date) => {
  const start = startOfDay(date)
  return [start, addDays(start, 1), addDays(start, 2)]
}

ThreeDayView.navigate = (date, action) => {
  switch (action) {
    case 'PREV':
      return addDays(date, -3)
    case 'NEXT':
      return addDays(date, 3)
    default:
      return date
  }
}

ThreeDayView.title = (date, { localizer }) => {
  const start = startOfDay(date)
  const end = addDays(start, 2)
  return localizer.format({ start, end }, 'dayRangeHeaderFormat')
}

function Schedule() {
  // State management
  const [view, setView] = useState('day')
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [show24Hours, setShow24Hours] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)

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
      } else if (view === '3days') {
        loadedEvents = await EventService.getEventsForDays(dateStr, 3)
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

  const handleToggle24Hours = () => {
    setShow24Hours((prev) => !prev)
  }

  // Calendar configuration
  const views = useMemo(
    () => ({
      day: true,
      '3days': ThreeDayView,
      week: true,
      month: true
    }),
    []
  )

  const formats = useMemo(
    () => ({
      timeGutterFormat: show24Hours ? 'HH:mm' : 'h a',
      eventTimeRangeFormat: ({ start, end }) => {
        const formatStr = show24Hours ? 'HH:mm' : 'h:mm a'
        return `${format(start, formatStr)} - ${format(end, formatStr)}`
      },
      agendaTimeRangeFormat: ({ start, end }) => {
        const formatStr = show24Hours ? 'HH:mm' : 'h:mm a'
        return `${format(start, formatStr)} - ${format(end, formatStr)}`
      },
      dayFormat: 'EEE dd',
      dayHeaderFormat: 'EEEE, MMMM d',
      monthHeaderFormat: 'MMMM yyyy'
    }),
    [show24Hours]
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
          max={new Date(2000, 0, 1, 24, 0)}
          formats={formats}
          components={{
            toolbar: (props) => (
              <CustomToolbar
                {...props}
                show24Hours={show24Hours}
                onToggle24Hours={handleToggle24Hours}
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
