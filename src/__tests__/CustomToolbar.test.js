import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CustomToolbar from '../components/Schedule/CustomToolbar'

// Mock Icon component
jest.mock('../components/common/Icon', () => {
  return function Icon({ name }) {
    return <span data-testid={`icon-${name}`}>{name}</span>
  }
})

describe('CustomToolbar Component', () => {
  const defaultProps = {
    date: new Date('2026-02-03T12:00:00'),
    view: 'day',
    onNavigate: jest.fn(),
    onView: jest.fn(),
    onScheduleEvent: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the toolbar', () => {
    render(<CustomToolbar {...defaultProps} />)
    expect(screen.getByText('Schedule')).toBeInTheDocument()
  })

  it('should display formatted date', () => {
    render(<CustomToolbar {...defaultProps} />)
    // Date should be formatted as "03/02/2026" (DD/MM/YYYY)
    expect(screen.getByText(/03\/02\/2026/)).toBeInTheDocument()
  })

  it('should call onNavigate with PREV when previous button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const prevButton = screen.getByLabelText('Previous')
    fireEvent.click(prevButton)
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('PREV')
  })

  it('should call onNavigate with TODAY when today button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const todayButton = screen.getByText('Today')
    fireEvent.click(todayButton)
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('TODAY')
  })

  it('should call onNavigate with NEXT when next button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const nextButton = screen.getByLabelText('Next')
    fireEvent.click(nextButton)
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('NEXT')
  })

  it('should call onView with day when day button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const dayButton = screen.getByText('Day')
    fireEvent.click(dayButton)
    expect(defaultProps.onView).toHaveBeenCalledWith('day')
  })

  it('should call onView with week when week button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const weekButton = screen.getByText('Week')
    fireEvent.click(weekButton)
    expect(defaultProps.onView).toHaveBeenCalledWith('week')
  })

  it('should call onView with month when month button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const monthButton = screen.getByText('Month')
    fireEvent.click(monthButton)
    expect(defaultProps.onView).toHaveBeenCalledWith('month')
  })

  it('should apply active class to current view button', () => {
    const { container } = render(<CustomToolbar {...defaultProps} view="week" />)
    const weekButton = screen.getByText('Week')
    expect(weekButton.classList.contains('active')).toBe(true)
  })

  it('should call onScheduleEvent when schedule button is clicked', () => {
    render(<CustomToolbar {...defaultProps} />)
    const scheduleButton = screen.getByText('Schedule')
    fireEvent.click(scheduleButton)
    expect(defaultProps.onScheduleEvent).toHaveBeenCalled()
  })

  it('should render navigation icons', () => {
    render(<CustomToolbar {...defaultProps} />)
    expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument()
    expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument()
  })

  it('should render schedule icon', () => {
    render(<CustomToolbar {...defaultProps} />)
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
  })

  it('should have proper ARIA labels for navigation', () => {
    render(<CustomToolbar {...defaultProps} />)
    expect(screen.getByLabelText('Previous')).toBeInTheDocument()
    expect(screen.getByLabelText('Next')).toBeInTheDocument()
  })

  it('should render all view options', () => {
    render(<CustomToolbar {...defaultProps} />)
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
  })

  it('should format date correctly for different months', () => {
    const juneDate = new Date('2026-06-15T12:00:00')
    render(<CustomToolbar {...defaultProps} date={juneDate} />)
    expect(screen.getByText(/15\/06\/2026/)).toBeInTheDocument()
  })

  it('should handle single-digit dates with leading zeros', () => {
    const firstDay = new Date('2026-01-01T12:00:00')
    render(<CustomToolbar {...defaultProps} date={firstDay} />)
    expect(screen.getByText(/01\/01\/2026/)).toBeInTheDocument()
  })

  it('should update when view prop changes', () => {
    const { rerender } = render(<CustomToolbar {...defaultProps} view="day" />)
    expect(screen.getByText('Day').classList.contains('active')).toBe(true)

    rerender(<CustomToolbar {...defaultProps} view="month" />)
    expect(screen.getByText('Month').classList.contains('active')).toBe(true)
    expect(screen.getByText('Day').classList.contains('active')).toBe(false)
  })

  it('should update when date prop changes', () => {
    const { rerender } = render(<CustomToolbar {...defaultProps} date={new Date('2026-02-03')} />)
    expect(screen.getByText(/03\/02\/2026/)).toBeInTheDocument()

    rerender(<CustomToolbar {...defaultProps} date={new Date('2026-12-25')} />)
    expect(screen.getByText(/25\/12\/2026/)).toBeInTheDocument()
  })
})
