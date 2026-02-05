import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SolidEventCard from '../components/Schedule/SolidEventCard'

describe('SolidEventCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render event title', () => {
      const event = {
        title: 'Test Event',
        resource: {
          type: 'task'
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    it('should render without resource object', () => {
      const event = {
        title: 'Simple Event'
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('Simple Event')).toBeInTheDocument()
    })

    it('should render event title in strong tag', () => {
      const event = {
        title: 'Important Event',
        resource: { type: 'meeting' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const strongElement = container.querySelector('strong.event-title')
      expect(strongElement).toBeInTheDocument()
      expect(strongElement).toHaveTextContent('Important Event')
    })
  })

  describe('Event Type Styling', () => {
    it('should apply task type class', () => {
      const event = {
        title: 'Complete Project',
        resource: {
          type: 'task'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.solid-event-card.event-type-task')
      ).toBeInTheDocument()
    })

    it('should apply routine type class', () => {
      const event = {
        title: 'Morning Routine',
        resource: {
          type: 'routine'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.solid-event-card.event-type-routine')
      ).toBeInTheDocument()
    })

    it('should apply meeting type class', () => {
      const event = {
        title: 'Team Meeting',
        resource: {
          type: 'meeting'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.solid-event-card.event-type-meeting')
      ).toBeInTheDocument()
    })

    it('should apply habit type class', () => {
      const event = {
        title: 'Daily Exercise',
        resource: {
          type: 'habit'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.solid-event-card.event-type-habit')
      ).toBeInTheDocument()
    })

    it('should default to task type when no type provided', () => {
      const event = {
        title: 'Default Event',
        resource: {}
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.solid-event-card.event-type-task')
      ).toBeInTheDocument()
    })

    it('should default to task type when resource is undefined', () => {
      const event = {
        title: 'No Resource Event'
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.solid-event-card.event-type-task')
      ).toBeInTheDocument()
    })
  })

  describe('Preparation Time Indicators', () => {
    it('should show preparation time indicator when prepTime > 0', () => {
      const event = {
        title: 'Event with Prep',
        resource: {
          type: 'meeting',
          preparationTime: 15
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('🎯 15m')).toBeInTheDocument()
    })

    it('should not show preparation indicator when prepTime is 0', () => {
      const event = {
        title: 'Event without Prep',
        resource: {
          type: 'task',
          preparationTime: 0
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.queryByText(/🎯/)).not.toBeInTheDocument()
    })

    it('should not show preparation indicator when prepTime is undefined', () => {
      const event = {
        title: 'Event without Prep',
        resource: {
          type: 'task'
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.queryByText(/🎯/)).not.toBeInTheDocument()
    })

    it('should have correct title attribute for preparation time', () => {
      const event = {
        title: 'Event with Prep',
        resource: {
          type: 'meeting',
          preparationTime: 30
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const prepIndicator = container.querySelector('.prep-indicator')
      expect(prepIndicator).toHaveAttribute('title', 'Preparation: 30 min')
    })
  })

  describe('Travel Time Indicators', () => {
    it('should show travel time indicator when travelTime > 0', () => {
      const event = {
        title: 'Event with Travel',
        resource: {
          type: 'meeting',
          travelTime: 20
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('🚗 20m')).toBeInTheDocument()
    })

    it('should not show travel indicator when travelTime is 0', () => {
      const event = {
        title: 'Event without Travel',
        resource: {
          type: 'task',
          travelTime: 0
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.queryByText(/🚗/)).not.toBeInTheDocument()
    })

    it('should not show travel indicator when travelTime is undefined', () => {
      const event = {
        title: 'Event without Travel',
        resource: {
          type: 'task'
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.queryByText(/🚗/)).not.toBeInTheDocument()
    })

    it('should have correct title attribute for travel time', () => {
      const event = {
        title: 'Event with Travel',
        resource: {
          type: 'meeting',
          travelTime: 45
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const travelIndicator = container.querySelector('.travel-indicator')
      expect(travelIndicator).toHaveAttribute('title', 'Travel: 45 min')
    })
  })

  describe('Combined Preparation and Travel Time', () => {
    it('should show both prep and travel indicators', () => {
      const event = {
        title: 'Full Event',
        resource: {
          type: 'meeting',
          preparationTime: 15,
          travelTime: 30
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('🎯 15m')).toBeInTheDocument()
      expect(screen.getByText('🚗 30m')).toBeInTheDocument()
    })

    it('should have pre-activities container when either prep or travel exists', () => {
      const event = {
        title: 'Event with Activities',
        resource: {
          type: 'meeting',
          preparationTime: 10,
          travelTime: 0
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.event-pre-activities')
      ).toBeInTheDocument()
    })

    it('should not have pre-activities container when neither prep nor travel', () => {
      const event = {
        title: 'Simple Event',
        resource: {
          type: 'task',
          preparationTime: 0,
          travelTime: 0
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.event-pre-activities')
      ).not.toBeInTheDocument()
    })
  })

  describe('Accessibility Attributes', () => {
    it('should have role="article"', () => {
      const event = {
        title: 'Accessible Event',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      expect(card).toHaveAttribute('role', 'article')
    })

    it('should have correct aria-label for task', () => {
      const event = {
        title: 'Complete Documentation',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      expect(card).toHaveAttribute('aria-label', 'task: Complete Documentation')
    })

    it('should have correct aria-label for meeting', () => {
      const event = {
        title: 'Weekly Standup',
        resource: { type: 'meeting' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      expect(card).toHaveAttribute('aria-label', 'meeting: Weekly Standup')
    })

    it('should have correct aria-label for routine', () => {
      const event = {
        title: 'Morning Routine',
        resource: { type: 'routine' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      expect(card).toHaveAttribute('aria-label', 'routine: Morning Routine')
    })

    it('should have correct aria-label for habit', () => {
      const event = {
        title: 'Daily Meditation',
        resource: { type: 'habit' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      expect(card).toHaveAttribute('aria-label', 'habit: Daily Meditation')
    })

    it('should default aria-label to task when type is undefined', () => {
      const event = {
        title: 'Default Event'
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      expect(card).toHaveAttribute('aria-label', 'task: Default Event')
    })
  })

  describe('Component Structure', () => {
    it('should have solid-event-card class on root element', () => {
      const event = {
        title: 'Test Event',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.solid-event-card')).toBeInTheDocument()
    })

    it('should render title before pre-activities', () => {
      const event = {
        title: 'Ordered Event',
        resource: {
          type: 'meeting',
          preparationTime: 10,
          travelTime: 15
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const card = container.querySelector('.solid-event-card')
      const children = Array.from(card.children)

      expect(children[0].className).toBe('event-title')
      expect(children[1].className).toBe('event-pre-activities')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long event titles', () => {
      const event = {
        title: 'This is a very long event title that might need truncation',
        resource: { type: 'task' }
      }

      render(<SolidEventCard event={event} />)
      expect(
        screen.getByText(
          'This is a very long event title that might need truncation'
        )
      ).toBeInTheDocument()
    })

    it('should handle event with only title property', () => {
      const event = {
        title: 'Minimal Event'
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('Minimal Event')).toBeInTheDocument()
    })

    it('should handle large preparation times', () => {
      const event = {
        title: 'Big Prep Event',
        resource: {
          type: 'meeting',
          preparationTime: 120
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('🎯 120m')).toBeInTheDocument()
    })

    it('should handle large travel times', () => {
      const event = {
        title: 'Long Travel Event',
        resource: {
          type: 'meeting',
          travelTime: 180
        }
      }

      render(<SolidEventCard event={event} />)
      expect(screen.getByText('🚗 180m')).toBeInTheDocument()
    })
  })

  describe('PropTypes Validation', () => {
    // PropTypes only validate in development mode
    it('should accept valid event object', () => {
      const event = {
        title: 'Valid Event',
        resource: {
          type: 'task',
          preparationTime: 10,
          travelTime: 5
        }
      }

      expect(() => render(<SolidEventCard event={event} />)).not.toThrow()
    })

    it('should accept event with minimal properties', () => {
      const event = {
        title: 'Minimal Event'
      }

      expect(() => render(<SolidEventCard event={event} />)).not.toThrow()
    })
  })
})
