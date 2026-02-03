import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import CustomEvent from '../components/Schedule/CustomEvent'

describe('CustomEvent Component', () => {
  it('should render event title', () => {
    const event = {
      title: 'Test Event',
      resource: {
        type: 'task'
      }
    }

    render(<CustomEvent event={event} />)
    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })

  it('should apply routine type class', () => {
    const event = {
      title: 'Morning Routine',
      resource: {
        type: 'routine'
      }
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-routine')).toBeInTheDocument()
  })

  it('should apply task type class', () => {
    const event = {
      title: 'Complete Project',
      resource: {
        type: 'task'
      }
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-task')).toBeInTheDocument()
  })

  it('should apply meeting type class', () => {
    const event = {
      title: 'Team Meeting',
      resource: {
        type: 'meeting'
      }
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-meeting')).toBeInTheDocument()
  })

  it('should apply habit type class', () => {
    const event = {
      title: 'Exercise',
      resource: {
        type: 'habit'
      }
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-habit')).toBeInTheDocument()
  })

  it('should default to task type when type is missing', () => {
    const event = {
      title: 'Default Event',
      resource: {}
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-task')).toBeInTheDocument()
  })

  it('should display preparation time indicator', () => {
    const event = {
      title: 'Event with Prep',
      resource: {
        type: 'meeting',
        preparationTime: 15
      }
    }

    render(<CustomEvent event={event} />)
    expect(screen.getByText(/🎯 15m/)).toBeInTheDocument()
    expect(screen.getByTitle('Preparation time: 15 min')).toBeInTheDocument()
  })

  it('should display travel time indicator', () => {
    const event = {
      title: 'Event with Travel',
      resource: {
        type: 'meeting',
        travelTime: 10
      }
    }

    render(<CustomEvent event={event} />)
    expect(screen.getByText(/🚗 10m/)).toBeInTheDocument()
    expect(screen.getByTitle('Travel time: 10 min')).toBeInTheDocument()
  })

  it('should display both prep and travel time', () => {
    const event = {
      title: 'Event with Both',
      resource: {
        type: 'meeting',
        preparationTime: 20,
        travelTime: 15
      }
    }

    render(<CustomEvent event={event} />)
    expect(screen.getByText(/🎯 20m/)).toBeInTheDocument()
    expect(screen.getByText(/🚗 15m/)).toBeInTheDocument()
  })

  it('should not display indicators when times are zero', () => {
    const event = {
      title: 'Simple Event',
      resource: {
        type: 'task',
        preparationTime: 0,
        travelTime: 0
      }
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-pre-activities')).not.toBeInTheDocument()
  })

  it('should handle missing resource gracefully', () => {
    const event = {
      title: 'Event Without Resource'
    }

    render(<CustomEvent event={event} />)
    expect(screen.getByText('Event Without Resource')).toBeInTheDocument()
  })

  it('should handle event with resource but no times', () => {
    const event = {
      title: 'Event with Empty Resource',
      resource: {
        type: 'task'
      }
    }

    const { container } = render(<CustomEvent event={event} />)
    expect(container.querySelector('.event-pre-activities')).not.toBeInTheDocument()
  })
})
