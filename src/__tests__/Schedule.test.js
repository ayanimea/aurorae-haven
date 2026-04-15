import { vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Schedule from '../pages/Schedule'
import EventService from '../services/EventService'

// Mock Icon component
vi.mock('../components/common/Icon', () => ({
  default: function Icon({ name }) {
    return <span data-testid={`icon-${name}`}>{name}</span>
  }
}))

// Mock GlassPanel (renders children)
vi.mock('../components/common/GlassPanel', () => ({
  default: function GlassPanel({ children, className }) {
    return <div className={`glass-panel ${className ?? ''}`}>{children}</div>
  }
}))

// Mock FigmaScheduleGrid
vi.mock('../components/Schedule/FigmaScheduleGrid', () => ({
  default: function FigmaScheduleGrid({ events, viewMode, onEventClick, onSlotClick }) {
    return (
      <div data-testid="figma-schedule-grid" data-view={viewMode}>
        {events.map((e) => (
          <button
            key={e.id}
            data-testid={`event-card-${e.id}`}
            onClick={() => onEventClick(e)}
          >
            {e.title}
          </button>
        ))}
        <button
          data-testid="empty-slot"
          onClick={() => onSlotClick({ day: '2025-09-16', startTime: '09:00', endTime: '10:00' })}
        >
          empty slot
        </button>
      </div>
    )
  },
  PERIOD_COLORS: {
    night: { dot: '#5550a0', text: 'rgba(140,135,180,0.9)', label: 'Night' },
    morning: { dot: '#e8b880', text: 'rgba(255,220,180,0.95)', label: 'Morning' },
    afternoon: { dot: '#a0d0d8', text: 'rgba(200,235,240,0.95)', label: 'Afternoon' },
    evening: { dot: '#c0a0d0', text: 'rgba(210,185,225,0.95)', label: 'Evening' }
  },
  EVENT_TYPE_COLORS: {
    task: { bg: 'rgba(230,65,65,0.22)', border: 'rgba(250,90,90,0.55)', text: 'rgba(255,165,155,0.95)' },
    routine: { bg: 'rgba(30,200,230,0.22)', border: 'rgba(50,220,250,0.55)', text: 'rgba(120,240,255,0.95)' },
    habit: { bg: 'rgba(160,55,235,0.22)', border: 'rgba(185,85,255,0.55)', text: 'rgba(215,160,255,0.95)' },
    event: { bg: 'rgba(55,100,240,0.22)', border: 'rgba(75,130,255,0.55)', text: 'rgba(150,190,255,0.95)' }
  }
}))

// Mock EventModal
vi.mock('../components/Schedule/EventModal', () => ({
  default: function EventModal({ isOpen }) {
    return isOpen ? <div data-testid="event-modal">EventModal</div> : null
  }
}))

// Mock ItemActionModal
vi.mock('../components/ItemActionModal', () => ({
  default: function ItemActionModal({ item, onClose, onEdit, onDelete }) {
    return (
      <div data-testid="item-action-modal">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}))

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
    getAllEvents: vi.fn().mockResolvedValue([]),
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

// ─────────────────────────────────────────────────────────────────────────────
// Basic render tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Schedule Component with Figma UI', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue([])
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
    EventService.getEventsForDays.mockResolvedValue([])
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders Schedule component with heading', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Schedule' })).toBeInTheDocument()
    })
  })

  test('renders Figma schedule grid', async () => {
    const { container } = render(<Schedule />)
    await waitFor(() => {
      expect(container.querySelector('.page-schedule')).toBeInTheDocument()
      expect(screen.getByTestId('figma-schedule-grid')).toBeInTheDocument()
    })
  })

  test('renders Schedule+ add button', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add event/i })).toBeInTheDocument()
    })
  })

  test('calls EventService.getEventsForDate on mount with day view', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-16')
    })
  })

  test('shows loading indicator initially', async () => {
    render(<Schedule />)
    expect(screen.getByRole('status')).toBeInTheDocument()
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

  test('renders period legend items', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(screen.getByText('Night')).toBeInTheDocument()
      expect(screen.getByText('Morning')).toBeInTheDocument()
      expect(screen.getByText('Afternoon')).toBeInTheDocument()
      expect(screen.getByText('Evening')).toBeInTheDocument()
    })
  })

  test('renders event type legend items', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(screen.getByText('Task')).toBeInTheDocument()
      expect(screen.getByText('Routine')).toBeInTheDocument()
      expect(screen.getByText('Habit')).toBeInTheDocument()
      expect(screen.getByText('Event')).toBeInTheDocument()
    })
  })

  test('renders navigation buttons', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument()
    })
  })

  test('renders view selector with day/week/month options', async () => {
    render(<Schedule />)
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: 'View mode' })
      expect(select).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Day' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Week' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Month' })).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Schedule navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue([])
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
  })

  afterEach(() => jest.useRealTimers())

  test('Today button sets date to today', async () => {
    render(<Schedule />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    })

    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-16')
    })
  })

  test('Next button advances date by one day in day view', async () => {
    render(<Schedule />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    })

    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-17')
    })
  })

  test('Prev button moves date back by one day in day view', async () => {
    render(<Schedule />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    })

    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-15')
    })
  })

  test('changing view to week calls EventService.getEventsForWeek', async () => {
    render(<Schedule />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'View mode' })).toBeInTheDocument())

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'View mode' }), {
        target: { value: 'week' }
      })
    })

    await waitFor(() => {
      expect(EventService.getEventsForWeek).toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Interaction tests (event click → modal)
// ─────────────────────────────────────────────────────────────────────────────
describe('Schedule event interactions', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
  })

  afterEach(() => jest.useRealTimers())

  test('clicking event card opens ItemActionModal', async () => {
    const mockEvents = [
      { id: '1', title: 'Test Event', day: '2025-09-16', startTime: '09:00', endTime: '10:00', type: 'task' }
    ]
    EventService.getEventsForDate.mockResolvedValue(mockEvents)

    render(<Schedule />)

    await waitFor(() => {
      expect(screen.getByTestId('event-card-1')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('event-card-1'))
    })

    expect(screen.getByTestId('item-action-modal')).toBeInTheDocument()
  })

  test('clicking empty slot opens EventModal', async () => {
    EventService.getEventsForDate.mockResolvedValue([])

    render(<Schedule />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-slot')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('empty-slot'))
    })

    expect(screen.getByTestId('event-modal')).toBeInTheDocument()
  })

  test('clicking Schedule+ button opens EventModal', async () => {
    EventService.getEventsForDate.mockResolvedValue([])

    render(<Schedule />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add event/i })).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add event/i }))
    })

    expect(screen.getByTestId('event-modal')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Structural validation in handleSaveEvent
// ─────────────────────────────────────────────────────────────────────────────
describe('structural validation in handleSaveEvent', () => {
  const existingEvents = [
    { id: '1', day: '2025-09-16', startTime: '09:00', endTime: '10:00', title: 'A', type: 'task' },
    { id: '2', day: '2025-09-16', startTime: '09:00', endTime: '10:00', title: 'B', type: 'task' }
  ]

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-16T09:15:00'))
    jest.clearAllMocks()
    EventService.getEventsForDate.mockResolvedValue(existingEvents)
    EventService.getEventsForWeek.mockResolvedValue([])
    EventService.getEventsForRange.mockResolvedValue([])
    EventService.createEvent = vi.fn().mockResolvedValue(undefined)
    EventService.updateEvent = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => jest.useRealTimers())

  test('renders without crashing when events are loaded', async () => {
    render(<Schedule />)
    await waitFor(() => {
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-16')
    })
    expect(screen.getByTestId('figma-schedule-grid')).toBeInTheDocument()
  })
})
