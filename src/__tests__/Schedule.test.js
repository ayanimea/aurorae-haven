import { vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Schedule from '../pages/Schedule'
import EventService from '../services/EventService'

// Hoisted so the mock factory below can reference it before module init
const capturedHandlers = vi.hoisted(() => ({
  eventDidMount: null,
  eventDrop: null,
  eventResize: null,
  dayHeaderClassNames: null,
  dayHeaderDidMount: null,
  dayHeaderWillUnmount: null
}))

// Mock FullCalendar to avoid ESM parsing issues
vi.mock('@fullcalendar/react', () => {
  return {
    default: React.forwardRef(function FullCalendar(props, _ref) {
      capturedHandlers.eventDidMount = props.eventDidMount
      capturedHandlers.eventDrop = props.eventDrop
      capturedHandlers.eventResize = props.eventResize
      capturedHandlers.dayHeaderClassNames = props.dayHeaderClassNames
      capturedHandlers.dayHeaderDidMount = props.dayHeaderDidMount
      capturedHandlers.dayHeaderWillUnmount = props.dayHeaderWillUnmount
      return (
        <div className='fc' data-testid='fullcalendar'>
          <div className='fc-view'>{props.initialView}</div>
        </div>
      )
    })
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

  test('shows loading state initially', async () => {
    render(<Schedule />)

    // Loading overlay should be visible initially (before async effects resolve)
    expect(screen.getByText('Loading events...')).toBeInTheDocument()

    // Flush pending async effects so they don't leak into the next test
    await act(async () => {})
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
    capturedHandlers.eventDidMount({
      event: { start: new Date(2025, 0, 1, hour) },
      el
    })
    expect(el.dataset.timezone).toBe(expected)
  })

  test('skips events with no start time (no data-timezone set)', () => {
    const el = document.createElement('div')
    capturedHandlers.eventDidMount({ event: { start: null }, el })
    expect(el.dataset.timezone).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Tests for handleEventDrop and handleEventResize (drag-and-drop / resize)
// ---------------------------------------------------------------------------
describe('handleEventDrop and handleEventResize', () => {
  beforeEach(async () => {
    capturedHandlers.eventDrop = null
    capturedHandlers.eventResize = null
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue([])
    EventService.updateEvent = vi.fn().mockResolvedValue(undefined)
    render(<Schedule />)
    await waitFor(() => expect(capturedHandlers.eventDrop).not.toBeNull())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const makeOriginalEvent = () => ({
    id: 'evt-1',
    title: 'Team Standup',
    day: '2025-09-16',
    startTime: '09:00',
    endTime: '09:30',
    type: 'task'
  })

  const makeDropInfo = (originalEvent, startDate, endDate) => ({
    event: {
      start: startDate,
      end: endDate,
      extendedProps: { originalEvent }
    },
    revert: vi.fn()
  })

  test('handleEventDrop updates event via EventService with new day/startTime/endTime', async () => {
    const original = makeOriginalEvent()
    const newStart = new Date('2025-09-17T10:00:00')
    const newEnd = new Date('2025-09-17T10:30:00')
    const dropInfo = makeDropInfo(original, newStart, newEnd)

    await act(async () => {
      await capturedHandlers.eventDrop(dropInfo)
    })

    expect(EventService.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-1',
        day: '2025-09-17',
        startTime: '10:00',
        endTime: '10:30'
      })
    )
    expect(dropInfo.revert).not.toHaveBeenCalled()
  })

  test('handleEventDrop calls revert on EventService failure', async () => {
    EventService.updateEvent.mockRejectedValue(new Error('DB error'))
    const original = makeOriginalEvent()
    const newStart = new Date('2025-09-17T10:00:00')
    const dropInfo = makeDropInfo(original, newStart, null)

    await act(async () => {
      await capturedHandlers.eventDrop(dropInfo)
    })

    expect(dropInfo.revert).toHaveBeenCalled()
  })

  test('handleEventDrop calls revert when no originalEvent is present', async () => {
    const dropInfo = {
      event: { start: new Date(), end: new Date(), extendedProps: {} },
      revert: vi.fn()
    }

    await act(async () => {
      await capturedHandlers.eventDrop(dropInfo)
    })

    expect(dropInfo.revert).toHaveBeenCalled()
    expect(EventService.updateEvent).not.toHaveBeenCalled()
  })

  test('handleEventResize updates event via EventService with new endTime', async () => {
    const original = makeOriginalEvent()
    const newStart = new Date('2025-09-16T09:00:00')
    const newEnd = new Date('2025-09-16T10:00:00')
    const resizeInfo = makeDropInfo(original, newStart, newEnd)

    await act(async () => {
      await capturedHandlers.eventResize(resizeInfo)
    })

    expect(EventService.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-1',
        day: '2025-09-16',
        startTime: '09:00',
        endTime: '10:00'
      })
    )
    expect(resizeInfo.revert).not.toHaveBeenCalled()
  })

  test('handleEventResize calls revert on EventService failure', async () => {
    EventService.updateEvent.mockRejectedValue(new Error('DB error'))
    const original = makeOriginalEvent()
    const resizeInfo = makeDropInfo(original, new Date('2025-09-16T09:00:00'), null)

    await act(async () => {
      await capturedHandlers.eventResize(resizeInfo)
    })

    expect(resizeInfo.revert).toHaveBeenCalled()
  })

  test('handleEventResize calls revert when no originalEvent is present', async () => {
    const resizeInfo = {
      event: { start: new Date(), end: new Date(), extendedProps: {} },
      revert: vi.fn()
    }

    await act(async () => {
      await capturedHandlers.eventResize(resizeInfo)
    })

    expect(resizeInfo.revert).toHaveBeenCalled()
    expect(EventService.updateEvent).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Buffer-aware drop: event.start is renderStart; mainStart must be recovered
  // ---------------------------------------------------------------------------
  test('handleEventDrop recovers mainStart from renderStart + buffers', async () => {
    // prep=15min + travel=30min → totalBuffer=45min
    const original = makeOriginalEvent()
    const mainStart = new Date('2025-09-17T10:00:00')
    const mainEnd = new Date('2025-09-17T11:00:00')
    const renderStart = new Date(mainStart.getTime() - 45 * 60000) // 09:15

    const dropInfo = {
      event: {
        start: renderStart,
        end: mainEnd,
        extendedProps: {
          originalEvent: original,
          prepDuration: 15,
          travelDuration: 30,
          mainStart,
          mainEnd
        }
      },
      revert: vi.fn()
    }

    await act(async () => {
      await capturedHandlers.eventDrop(dropInfo)
    })

    // startTime must reflect mainStart (10:00), not renderStart (09:15)
    expect(EventService.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        day: '2025-09-17',
        startTime: '10:00',
        endTime: '11:00'
      })
    )
    expect(dropInfo.revert).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Buffer-aware resize — bottom handle: only mainEnd changes
  // ---------------------------------------------------------------------------
  test('handleEventResize bottom-handle updates endTime only, buffers unchanged', async () => {
    const original = makeOriginalEvent()
    const mainStart = new Date('2025-09-16T09:00:00')
    const mainEnd = new Date('2025-09-16T10:00:00')
    const newMainEnd = new Date('2025-09-16T10:30:00')
    const renderStart = new Date(mainStart.getTime() - 45 * 60000) // 08:15

    const resizeInfo = {
      event: {
        start: renderStart,
        end: newMainEnd,
        extendedProps: {
          originalEvent: original,
          prepDuration: 15,
          travelDuration: 30,
          mainStart,
          mainEnd
        }
      },
      // Bottom handle: endDelta non-zero, startDelta zero
      startDelta: { valueOf: () => 0 },
      endDelta: { valueOf: () => 30 * 60000 },
      revert: vi.fn()
    }

    await act(async () => {
      await capturedHandlers.eventResize(resizeInfo)
    })

    expect(EventService.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '09:00', // mainStart unchanged
        endTime: '10:30'   // new mainEnd from event.end
      })
    )
    expect(resizeInfo.revert).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Buffer-aware resize — top handle: only mainStart changes, buffers preserved
  // ---------------------------------------------------------------------------
  test('handleEventResize top-handle updates startTime only, buffers preserved', async () => {
    const original = makeOriginalEvent()
    // After top resize: new renderStart = 07:45, so new mainStart = 07:45 + 45min = 08:30
    const newRenderStart = new Date('2025-09-16T07:45:00')
    const mainEnd = new Date('2025-09-16T10:00:00')

    const resizeInfo = {
      event: {
        start: newRenderStart,
        end: mainEnd,
        extendedProps: {
          originalEvent: original,
          prepDuration: 15,
          travelDuration: 30,
          mainStart: new Date('2025-09-16T09:00:00'), // canonical before resize
          mainEnd
        }
      },
      // Top handle: startDelta non-zero, endDelta zero
      startDelta: { valueOf: () => -15 * 60000 },
      endDelta: { valueOf: () => 0 },
      revert: vi.fn()
    }

    await act(async () => {
      await capturedHandlers.eventResize(resizeInfo)
    })

    // mainStart = newRenderStart + (prep + travel) = 07:45 + 45min = 08:30
    expect(EventService.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '08:30', // new mainStart recovered from renderStart + buffers
        endTime: '10:00'    // mainEnd unchanged
      })
    )
    expect(resizeInfo.revert).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tests for week-view load indicator callbacks
// (dayHeaderClassNames, dayHeaderDidMount, dayHeaderWillUnmount)
// ---------------------------------------------------------------------------
describe('week-view load indicator callbacks', () => {
  beforeEach(async () => {
    capturedHandlers.dayHeaderClassNames = null
    capturedHandlers.dayHeaderDidMount = null
    capturedHandlers.dayHeaderWillUnmount = null
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue([])
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
    EventService.getEventsForDays.mockResolvedValue([])
    render(<Schedule />)
    await waitFor(() => expect(capturedHandlers.dayHeaderClassNames).not.toBeNull())
  })

  afterEach(() => jest.useRealTimers())

  // dayHeaderClassNames prop is passed to FullCalendar
  test('dayHeaderClassNames prop is captured from FullCalendar', () => {
    expect(capturedHandlers.dayHeaderClassNames).toBeTypeOf('function')
  })

  // In day view (default) dayHeaderClassNames returns []
  test('dayHeaderClassNames returns [] in day view (default)', () => {
    const result = capturedHandlers.dayHeaderClassNames({
      date: new Date('2025-09-16T00:00:00')
    })
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  // In week view with no load data, dayHeaderClassNames returns []
  test('dayHeaderClassNames returns [] for a day with no load data in week view', async () => {
    // Switch to week view via the mock toolbar's <select>
    const select = screen.getByRole('combobox')
    await act(async () => {
      fireEvent.change(select, { target: { value: 'timeGridWeek' } })
    })
    await waitFor(() => expect(EventService.getEventsForWeek).toHaveBeenCalled())

    const result = capturedHandlers.dayHeaderClassNames({
      date: new Date('2025-09-16T00:00:00')
    })
    // No events → load = 0 → no class
    expect(result).toEqual([])
  })

  // dayHeaderDidMount prop is a function
  test('dayHeaderDidMount prop is captured as a function', () => {
    expect(capturedHandlers.dayHeaderDidMount).toBeTypeOf('function')
  })

  // dayHeaderDidMount does NOT inject span in day view (default)
  test('dayHeaderDidMount does not inject sr-only span in day view', () => {
    const cushion = document.createElement('a')
    cushion.className = 'fc-col-header-cell-cushion'
    const el = document.createElement('th')
    el.appendChild(cushion)

    capturedHandlers.dayHeaderDidMount({
      el,
      date: new Date('2025-09-16T00:00:00')
    })

    expect(cushion.querySelector('.sr-only-day-header')).toBeNull()
  })

  // dayHeaderWillUnmount removes an existing .sr-only-day-header span
  test('dayHeaderWillUnmount removes existing sr-only span', () => {
    const el = document.createElement('th')
    const srSpan = document.createElement('span')
    srSpan.className = 'sr-only sr-only-day-header'
    el.appendChild(srSpan)

    capturedHandlers.dayHeaderWillUnmount({ el })

    expect(el.querySelector('.sr-only-day-header')).toBeNull()
  })

  // dayHeaderWillUnmount is safe when no span exists
  test('dayHeaderWillUnmount is a no-op when no sr-only span present', () => {
    const el = document.createElement('th')
    expect(() => capturedHandlers.dayHeaderWillUnmount({ el })).not.toThrow()
    expect(el.childNodes).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Tests for structural validation wired into handleEventDrop / handleEventResize
// ---------------------------------------------------------------------------
describe('structural validation in handleEventDrop and handleEventResize', () => {
  // Two events on 2025-09-16 both at 09:00–10:00 (concurrent)
  const existingEvents = [
    { id: '1', day: '2025-09-16', startTime: '09:00', endTime: '10:00', title: 'A', type: 'task' },
    { id: '2', day: '2025-09-16', startTime: '09:00', endTime: '10:00', title: 'B', type: 'task' }
  ]

  beforeEach(async () => {
    capturedHandlers.eventDrop = null
    capturedHandlers.eventResize = null
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue(existingEvents)
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
    EventService.getEventsForDays.mockResolvedValue([])
    EventService.updateEvent = vi.fn().mockResolvedValue(undefined)
    render(<Schedule />)
    await waitFor(() => expect(capturedHandlers.eventDrop).not.toBeNull())
    // Wait for events to be loaded into state
    await waitFor(() => expect(EventService.getEventsForDate).toHaveBeenCalled())
  })

  afterEach(() => jest.useRealTimers())

  test('handleEventDrop reverts when dragging a 3rd timed event into a full slot', async () => {
    const revert = vi.fn()
    const originalEvent = {
      id: '3',
      day: '2025-09-16',
      startTime: '08:00',
      endTime: '09:00',
      title: 'C',
      type: 'task'
    }

    // Drag event 3 to overlap with both existing events (09:00–10:00)
    const dropInfo = {
      event: {
        start: new Date('2025-09-16T09:00:00'), // renderStart = mainStart (no buffers)
        end: new Date('2025-09-16T10:00:00'),
        extendedProps: {
          originalEvent,
          prepDuration: 0,
          travelDuration: 0
        }
      },
      revert
    }

    await act(async () => {
      await capturedHandlers.eventDrop(dropInfo)
    })

    // Should revert because limit of 2 simultaneous events is exceeded
    expect(revert).toHaveBeenCalled()
    expect(EventService.updateEvent).not.toHaveBeenCalled()
  })

  test('handleEventResize reverts when resize creates a structural conflict', async () => {
    const revert = vi.fn()
    const originalEvent = {
      id: '3',
      day: '2025-09-16',
      startTime: '08:00',
      endTime: '08:30',
      title: 'C',
      type: 'task'
    }

    // Resize event 3 end down to overlap with both existing events
    const resizeInfo = {
      event: {
        start: new Date('2025-09-16T08:00:00'),
        end: new Date('2025-09-16T10:00:00'), // extended into the full slot
        extendedProps: {
          originalEvent,
          prepDuration: 0,
          travelDuration: 0,
          mainStart: new Date('2025-09-16T08:00:00'),
          mainEnd: new Date('2025-09-16T08:30:00')
        }
      },
      startDelta: { valueOf: () => 0 },
      endDelta: { valueOf: () => 90 * 60000 }, // extended by 90min
      revert
    }

    await act(async () => {
      await capturedHandlers.eventResize(resizeInfo)
    })

    expect(revert).toHaveBeenCalled()
    expect(EventService.updateEvent).not.toHaveBeenCalled()
  })
})
