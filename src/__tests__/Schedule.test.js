import { vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Schedule from '../pages/Schedule'
import EventService from '../services/EventService'

// Hoisted so the mock factory below can reference it before module init
const capturedHandlers = vi.hoisted(() => ({ eventDidMount: null }))

// Mock FullCalendar to avoid ESM parsing issues
vi.mock('@fullcalendar/react', () => {
  return {
    default: function FullCalendar(props) {
      capturedHandlers.eventDidMount = props.eventDidMount
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
    getEventsForRange: vi.fn().mockResolvedValue([]),
    getEventsForDays: vi.fn().mockResolvedValue([]),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    clearTestData: vi.fn().mockResolvedValue(0)
  }
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
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

// ---------------------------------------------------------------------------
// Integration tests for the eventDidMount hour→timezone boundary logic.
// We capture the real eventDidMount prop from the FullCalendar mock and call
// it with a fake info object, asserting the resulting dataset.timezone value.
// This guarantees divergence between the TIME_ZONE_HOURS constant and the CSS
// gradient selectors is caught immediately — a local classify() helper would
// not detect mismatches in the production component.
// ---------------------------------------------------------------------------
describe('eventDidMount hour→timezone classification', () => {
  beforeEach(async () => {
    capturedHandlers.eventDidMount = null
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue([])
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
    EventService.getEventsForDays.mockResolvedValue([])
    render(<Schedule />)
    await waitFor(() => expect(capturedHandlers.eventDidMount).not.toBeNull())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const cases = [
    // night band (00:00–06:59)
    [0, 'night'],
    [1, 'night'],
    [6, 'night'],
    // morning band (07:00–11:59)
    [7, 'morning'],
    [9, 'morning'],
    [11, 'morning'],
    // afternoon band (12:00–17:59)
    [12, 'afternoon'],
    [15, 'afternoon'],
    [17, 'afternoon'],
    // evening band (18:00–22:59)
    [18, 'evening'],
    [20, 'evening'],
    [22, 'evening'],
    // night band (23:00–23:59)
    [23, 'night']
  ]

  test.each(cases)('hour %i → %s', (hour, expected) => {
    const el = document.createElement('div')
    capturedHandlers.eventDidMount({ event: { start: new Date(2025, 0, 1, hour) }, el })
    expect(el.dataset.timezone).toBe(expected)
  })

  test('skips events with no start time (no data-timezone set)', () => {
    const el = document.createElement('div')
    capturedHandlers.eventDidMount({ event: { start: null }, el })
    expect(el.dataset.timezone).toBeUndefined()
  })
})
