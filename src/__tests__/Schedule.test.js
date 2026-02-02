import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Schedule from '../pages/Schedule'

// Mock Icon component
jest.mock('../components/common/Icon', () => {
  return function Icon({ name }) {
    return <span data-testid={`icon-${name}`}>{name}</span>
  }
})

// Mock EventModal component
jest.mock('../components/Schedule/EventModal', () => {
  return function EventModal() {
    return null
  }
})

// Mock EventService
jest.mock('../services/EventService', () => ({
  __esModule: true,
  default: {
    getEventsForDate: jest.fn().mockResolvedValue([]),
    getEventsForWeek: jest.fn().mockResolvedValue([]),
    getEventsForRange: jest.fn().mockResolvedValue([]),
    getEventsForDays: jest.fn().mockResolvedValue([]),
    createEvent: jest.fn(),
    clearTestData: jest.fn().mockResolvedValue(0)
  }
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }))
}))

// Mock getCurrentDateISO to return consistent date for testing
jest.mock('../utils/timeUtils', () => ({
  getCurrentDateISO: jest.fn(() => '2025-09-16')
}))

describe('Schedule Component', () => {
  const EventService = require('../services/EventService').default

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

  test('renders Schedule component with header', () => {
    render(<Schedule />)
    const scheduleElements = screen.getAllByText(/Schedule/)
    expect(scheduleElements.length).toBeGreaterThan(0)
    expect(screen.getByText('Today · 16/09/2025')).toBeInTheDocument()
  })

  test('renders action buttons', () => {
    render(<Schedule />)
    // View mode dropdown button
    expect(screen.getByRole('button', { name: 'Change view mode' })).toBeInTheDocument()
    // Schedule event dropdown button
    expect(
      screen.getByRole('button', { name: /Schedule an event/i })
    ).toBeInTheDocument()
  })

  test('renders sidebar sections', () => {
    render(<Schedule />)
    // Sidebar should render without demo items
    // Demo items "Today's queue" and "Deep Work Warmup" were removed
    const sidebar = document.querySelector('.sidebar')
    expect(sidebar).toBeInTheDocument()
  })

  test('renders time labels for schedule', () => {
    render(<Schedule />)
    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('Morning')).toBeInTheDocument()
    expect(screen.getByText('Afternoon')).toBeInTheDocument()
    expect(screen.getByText('Evening')).toBeInTheDocument()
  })

  test('renders current time indicator during business hours', () => {
    render(<Schedule />)
    const timeIndicator = screen.getByLabelText('Current time')
    expect(timeIndicator).toBeInTheDocument()
    expect(screen.getByText('Now')).toBeInTheDocument()
  })

  test('hides current time indicator outside business hours', () => {
    // Set time to 01:00 (1 AM - outside schedule range of 7am-midnight)
    jest.setSystemTime(new Date('2025-09-16T01:00:00'))
    render(<Schedule />)
    expect(screen.queryByLabelText('Current time')).not.toBeInTheDocument()
  })

  test('renders time period backgrounds', () => {
    const { container } = render(<Schedule />)
    const morningPeriod = container.querySelector('.time-period-morning')
    const afternoonPeriod = container.querySelector('.time-period-afternoon')
    const eveningPeriod = container.querySelector('.time-period-evening')

    expect(morningPeriod).toBeInTheDocument()
    expect(afternoonPeriod).toBeInTheDocument()
    expect(eveningPeriod).toBeInTheDocument()
  })

  test('renders time period separators', () => {
    const { container } = render(<Schedule />)
    const separators = container.querySelectorAll('.time-period-separator')
    expect(separators).toHaveLength(3)
  })


  describe('Button Functionality', () => {
    test('View mode dropdown shows current mode', () => {
      render(<Schedule />)
      const viewButton = screen.getByRole('button', {
        name: 'Change view mode'
      })
      // Should display "1 Day" by default
      expect(viewButton).toHaveTextContent('1 Day')
    })

    test('View mode dropdown has correct ARIA attributes', () => {
      render(<Schedule />)
      const viewButton = screen.getByRole('button', {
        name: 'Change view mode'
      })
      expect(viewButton).toHaveAttribute('aria-expanded', 'false')
      expect(viewButton).toHaveAttribute('aria-haspopup', 'menu')
    })

    test('Schedule dropdown button has correct ARIA attributes', () => {
      render(<Schedule />)
      const scheduleButton = screen.getByRole('button', {
        name: /Schedule an event/i
      })
      expect(scheduleButton).toBeInTheDocument()
      expect(scheduleButton).toHaveAttribute('aria-expanded', 'false')
      expect(scheduleButton).toHaveAttribute('aria-haspopup', 'menu')
    })

    test('loads day events on initial render', () => {
      render(<Schedule />)
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-16')
      expect(EventService.getEventsForWeek).not.toHaveBeenCalled()
    })

    test('clicking view dropdown opens menu', async () => {
      render(<Schedule />)
      const viewButton = screen.getByRole('button', {
        name: 'Change view mode'
      })

      // Click to open dropdown
      fireEvent.click(viewButton)

      // Menu should now be visible with menuitem options
      const dayMenuItem = await screen.findByRole('menuitem', { name: 'View 1 day' })
      const weekMenuItem = await screen.findByRole('menuitem', { name: 'View 1 week' })
      expect(dayMenuItem).toBeInTheDocument()
      expect(weekMenuItem).toBeInTheDocument()
    })

    test('clicking week menu item switches view mode and loads week events', async () => {
      render(<Schedule />)
      const viewButton = screen.getByRole('button', {
        name: 'Change view mode'
      })

      // Click to open dropdown
      fireEvent.click(viewButton)

      // Click week menu item
      const weekMenuItem = await screen.findByRole('menuitem', { name: 'View 1 week' })
      fireEvent.click(weekMenuItem)

      // Check that week events were loaded
      expect(EventService.getEventsForWeek).toHaveBeenCalled()
      
      // Button should now show "1 Week"
      expect(viewButton).toHaveTextContent('1 Week')
    })

    test('clicking day menu item after week keeps day view active', async () => {
      render(<Schedule />)
      const viewButton = screen.getByRole('button', {
        name: 'Change view mode'
      })

      // Initially should show 1 Day
      expect(viewButton).toHaveTextContent('1 Day')

      // Click to open dropdown
      fireEvent.click(viewButton)

      // Click day menu item (already active)
      const dayMenuItem = await screen.findByRole('menuitem', { name: 'View 1 day' })
      fireEvent.click(dayMenuItem)

      // Should still be on day view
      expect(viewButton).toHaveTextContent('1 Day')
      expect(EventService.getEventsForDate).toHaveBeenCalledWith('2025-09-16')
    })
  })
})
