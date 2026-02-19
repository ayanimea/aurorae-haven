import { vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Schedule from '../pages/Schedule'
import EventService from '../services/EventService'

// Mock FullCalendar to avoid ESM parsing issues
vi.mock('@fullcalendar/react', () => {
  return {
    default: function FullCalendar(props) {
      return (
        <div className='fc' data-testid='fullcalendar'>
          <div className='fc-view'>{props.initialView}</div>
        </div>
      )
    }
  }
})

vi.mock('@fullcalendar/timegrid', () => ({ default: {} }))
vi.mock('@fullcalendar/daygrid', () => ({ default: {} }))
vi.mock('@fullcalendar/interaction', () => ({ default: {} }))

// Mock Icon component
vi.mock('../components/common/Icon', () => {
  return {
    default: function Icon({ name }) {
      return <span data-testid={`icon-${name}`}>{name}</span>
    }
  }
})

// Mock EventModal component
vi.mock('../components/Schedule/EventModal', () => {
  return {
    default: function EventModal() {
      return null
    }
  }
})

// Mock CustomToolbar component
vi.mock('../components/Schedule/CustomToolbar', () => {
  return {
    default: function CustomToolbar({
      date,
      view,
      views,
      onNavigate,
      onView,
      onScheduleEvent,
      EVENT_TYPES
    }) {
      return (
        <div className='calendar-toolbar'>
          <div className='toolbar-left'>
            <h2>Schedule</h2>
            <p className='date-display'>
              {date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className='toolbar-center'>
            <button onClick={() => onNavigate('PREV')}>Previous</button>
            <button onClick={() => onNavigate('TODAY')}>Today</button>
            <button onClick={() => onNavigate('NEXT')}>Next</button>
            <select value={view} onChange={(e) => onView(e.target.value)}>
              {views.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className='toolbar-right'>
            <button
              onClick={() => onScheduleEvent(EVENT_TYPES?.TASK || 'task')}
              aria-label='Schedule an event'
            >
              + Schedule
            </button>
          </div>
        </div>
      )
    }
  }
})

// Mock CustomEvent component
vi.mock('../components/Schedule/CustomEvent', () => {
  return {
    default: function CustomEvent({ event }) {
      return <div>{event.title}</div>
    }
  }
})

// Mock ItemActionModal component
vi.mock('../components/ItemActionModal', () => {
  return {
    default: function ItemActionModal() {
      return null
    }
  }
})

// Mock EventService
vi.mock('../services/EventService', () => ({
  __esModule: true,
  default: {
    getEventsForDate: vi.fn().mockResolvedValue([]),
    getEventsForWeek: vi.fn().mockResolvedValue([]),
    getEventsForRange: jest.fn().mockResolvedValue([]),
    getEventsForDays: jest.fn().mockResolvedValue([]),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    clearTestData: jest.fn().mockResolvedValue(0)
  }
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: jest.fn()
  }))
}))

describe('Schedule Component with FullCalendar', () => {
  beforeEach(() => {
    // Mock Date to return a consistent time for testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    // Reset EventService mocks
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue([])
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
    EventService.getEventsForDays.mockResolvedValue([])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders Schedule component with header', async () => {
    render(<Schedule />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Schedule' })
      ).toBeInTheDocument()
    })

    // Date should be formatted as DD/MM/YYYY
    expect(screen.getByText(/16\/09\/2025/)).toBeInTheDocument()
  })

  test('renders calendar container', async () => {
    const { container } = render(<Schedule />)

    await waitFor(() => {
      expect(container.querySelector('.schedule-container')).toBeInTheDocument()
      expect(container.querySelector('.fc')).toBeInTheDocument()
    })
  })

  test('renders toolbar with schedule button', async () => {
    render(<Schedule />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Schedule an event' })
      ).toBeInTheDocument()
    })
  })

  test('calls EventService.getEventsForDate on mount with day view', async () => {
    render(<Schedule />)

    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-16')
    })
  })

  test('shows loading state initially', () => {
    render(<Schedule />)

    // Loading overlay should be visible initially
    expect(screen.getByText('Loading events...')).toBeInTheDocument()
  })

  test('renders without errors when events are loaded', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Test Event',
        day: '2025-09-16',
        startTime: '09:00',
        endTime: '10:00',
        type: 'task'
      }
    ]

    EventService.getEventsForDate.mockResolvedValue(mockEvents)

    render(<Schedule />)

    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalled()
    })
  })
})
