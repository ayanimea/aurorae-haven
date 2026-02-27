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

    it('should render event title in strong tag inside event-main segment', () => {
      const event = {
        title: 'Important Event',
        resource: { type: 'meeting' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const strongElement = container.querySelector('.event-main strong.event-title')
      expect(strongElement).toBeInTheDocument()
      expect(strongElement).toHaveTextContent('Important Event')
    })

    it('should always render the event-main segment', () => {
      const event = {
        title: 'Test Event',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-main')).toBeInTheDocument()
    })
  })

  describe('Event Type Styling', () => {
    it('should apply task type class on wrapper', () => {
      const event = {
        title: 'Complete Project',
        resource: {
          type: 'task'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.fc-event-wrapper.event-type-task')
      ).toBeInTheDocument()
    })

    it('should apply routine type class on wrapper', () => {
      const event = {
        title: 'Morning Routine',
        resource: {
          type: 'routine'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.fc-event-wrapper.event-type-routine')
      ).toBeInTheDocument()
    })

    it('should apply meeting type class on wrapper', () => {
      const event = {
        title: 'Team Meeting',
        resource: {
          type: 'meeting'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.fc-event-wrapper.event-type-meeting')
      ).toBeInTheDocument()
    })

    it('should apply habit type class on wrapper', () => {
      const event = {
        title: 'Daily Exercise',
        resource: {
          type: 'habit'
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.fc-event-wrapper.event-type-habit')
      ).toBeInTheDocument()
    })

    it('should default to task type when no type provided', () => {
      const event = {
        title: 'Default Event',
        resource: {}
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.fc-event-wrapper.event-type-task')
      ).toBeInTheDocument()
    })

    it('should default to task type when resource is undefined', () => {
      const event = {
        title: 'No Resource Event'
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(
        container.querySelector('.fc-event-wrapper.event-type-task')
      ).toBeInTheDocument()
    })
  })

  describe('Prep Segment', () => {
    it('should render prep segment when prepDuration > 0', () => {
      const event = {
        title: 'Event with Prep',
        resource: {
          type: 'meeting',
          prepDuration: 15
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-prep')).toBeInTheDocument()
    })

    it('should render prep segment using legacy preparationTime field', () => {
      const event = {
        title: 'Legacy Prep Event',
        resource: {
          type: 'meeting',
          preparationTime: 15
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-prep')).toBeInTheDocument()
    })

    it('should not render prep segment when prepDuration is 0', () => {
      const event = {
        title: 'No Prep Event',
        resource: {
          type: 'task',
          prepDuration: 0
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-prep')).not.toBeInTheDocument()
    })

    it('should not render prep segment when prepDuration is undefined', () => {
      const event = {
        title: 'No Prep Event',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-prep')).not.toBeInTheDocument()
    })

    it('should set aria-hidden on prep segment', () => {
      const event = {
        title: 'Event with Prep',
        resource: {
          type: 'meeting',
          prepDuration: 30
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const prepSegment = container.querySelector('.event-segment.event-prep')
      expect(prepSegment).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Travel Segment', () => {
    it('should render travel segment when travelDuration > 0', () => {
      const event = {
        title: 'Event with Travel',
        resource: {
          type: 'meeting',
          travelDuration: 20
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-travel')).toBeInTheDocument()
    })

    it('should render travel segment using legacy travelTime field', () => {
      const event = {
        title: 'Legacy Travel Event',
        resource: {
          type: 'meeting',
          travelTime: 20
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-travel')).toBeInTheDocument()
    })

    it('should not render travel segment when travelDuration is 0', () => {
      const event = {
        title: 'No Travel Event',
        resource: {
          type: 'task',
          travelDuration: 0
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-travel')).not.toBeInTheDocument()
    })

    it('should set aria-hidden on travel segment', () => {
      const event = {
        title: 'Event with Travel',
        resource: {
          type: 'meeting',
          travelDuration: 45
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const travelSegment = container.querySelector('.event-segment.event-travel')
      expect(travelSegment).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Proportional Heights', () => {
    it('should give event-main 100% height when no buffers', () => {
      const event = {
        title: 'No Buffer Event',
        resource: {
          type: 'task',
          prepDuration: 0,
          travelDuration: 0
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const main = container.querySelector('.event-segment.event-main')
      expect(main.style.height).toBe('100%')
    })

    it('should compute proportional heights with canonical mainStart/mainEnd', () => {
      const mainStart = new Date('2026-02-03T10:00:00')
      const mainEnd = new Date('2026-02-03T11:00:00') // 60 min main
      const prepDurationMin = 15
      const travelDurationMin = 15
      const mainDurationMin = (mainEnd.getTime() - mainStart.getTime()) / 60000
      const total = travelDurationMin + prepDurationMin + mainDurationMin
      const expectedTravelPct = (travelDurationMin / total) * 100
      const expectedPrepPct = (prepDurationMin / total) * 100
      const expectedMainPct = (mainDurationMin / total) * 100

      const event = {
        title: 'Proportional Event',
        resource: {
          type: 'meeting',
          prepDuration: prepDurationMin,
          travelDuration: travelDurationMin,
          mainStart,
          mainEnd
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const travel = container.querySelector('.event-segment.event-travel')
      const prep = container.querySelector('.event-segment.event-prep')
      const main = container.querySelector('.event-segment.event-main')

      const travelH = parseFloat(travel.style.height)
      const prepH = parseFloat(prep.style.height)
      const mainH = parseFloat(main.style.height)

      expect(travelH).toBeCloseTo(expectedTravelPct, 1)
      expect(prepH).toBeCloseTo(expectedPrepPct, 1)
      expect(mainH).toBeCloseTo(expectedMainPct, 1)
      expect(travelH + prepH + mainH).toBeCloseTo(100, 5)
    })

    it('should render both travel and prep segments together', () => {
      const event = {
        title: 'Full Buffer Event',
        resource: {
          type: 'meeting',
          prepDuration: 15,
          travelDuration: 30
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-travel')).toBeInTheDocument()
      expect(container.querySelector('.event-segment.event-prep')).toBeInTheDocument()
      expect(container.querySelector('.event-segment.event-main')).toBeInTheDocument()
    })

    it('should not render event-pre-activities container', () => {
      const event = {
        title: 'Any Event',
        resource: {
          type: 'meeting',
          prepDuration: 10,
          travelDuration: 15
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-pre-activities')).not.toBeInTheDocument()
    })
  })

  describe('Segment Order', () => {
    it('should render travel before prep before main', () => {
      const event = {
        title: 'Ordered Event',
        resource: {
          type: 'meeting',
          prepDuration: 10,
          travelDuration: 15
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      const segments = Array.from(wrapper.querySelectorAll('.event-segment'))

      expect(segments[0].classList.contains('event-travel')).toBe(true)
      expect(segments[1].classList.contains('event-prep')).toBe(true)
      expect(segments[2].classList.contains('event-main')).toBe(true)
    })

    it('should render main as the only segment when no buffers', () => {
      const event = {
        title: 'Main Only',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      const segments = Array.from(wrapper.querySelectorAll('.event-segment'))

      expect(segments).toHaveLength(1)
      expect(segments[0].classList.contains('event-main')).toBe(true)
    })
  })

  describe('Accessibility Attributes', () => {
    it('should have role="article" on the wrapper', () => {
      const event = {
        title: 'Accessible Event',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('role', 'article')
    })

    it('should have correct aria-label for task', () => {
      const event = {
        title: 'Complete Documentation',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('aria-label', 'task: Complete Documentation')
    })

    it('should have correct aria-label for meeting', () => {
      const event = {
        title: 'Weekly Standup',
        resource: { type: 'meeting' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('aria-label', 'meeting: Weekly Standup')
    })

    it('should have correct aria-label for routine', () => {
      const event = {
        title: 'Morning Routine',
        resource: { type: 'routine' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('aria-label', 'routine: Morning Routine')
    })

    it('should have correct aria-label for habit', () => {
      const event = {
        title: 'Daily Meditation',
        resource: { type: 'habit' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('aria-label', 'habit: Daily Meditation')
    })

    it('should default aria-label to task when type is undefined', () => {
      const event = {
        title: 'Default Event'
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('aria-label', 'task: Default Event')
    })

    it('should not expose literal "null" or "undefined" in aria-label when title is empty string', () => {
      const event = {
        title: '',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const wrapper = container.querySelector('.fc-event-wrapper')
      expect(wrapper).toHaveAttribute('aria-label', 'task: ')
      expect(wrapper.getAttribute('aria-label')).not.toContain('null')
      expect(wrapper.getAttribute('aria-label')).not.toContain('undefined')
    })

    it('should coerce null title to empty string in aria-label', () => {
      // Suppress PropTypes isRequired warning for this null-title edge-case test
      const origError = console.error
      console.error = vi.fn()
      try {
        const event = { title: null, resource: { type: 'task' } }
        const { container } = render(<SolidEventCard event={event} />)
        const wrapper = container.querySelector('.fc-event-wrapper')
        expect(wrapper).toHaveAttribute('aria-label', 'task: ')
        expect(wrapper.getAttribute('aria-label')).not.toContain('null')
        expect(wrapper.getAttribute('aria-label')).not.toContain('undefined')
      } finally {
        console.error = origError
      }
    })
  })

  describe('Component Structure', () => {
    it('should have fc-event-wrapper class on root element', () => {
      const event = {
        title: 'Test Event',
        resource: { type: 'task' }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.fc-event-wrapper')).toBeInTheDocument()
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

    it('should handle large preparation durations without crashing', () => {
      const event = {
        title: 'Big Prep Event',
        resource: {
          type: 'meeting',
          prepDuration: 120
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-prep')).toBeInTheDocument()
    })

    it('should handle large travel durations without crashing', () => {
      const event = {
        title: 'Long Travel Event',
        resource: {
          type: 'meeting',
          travelDuration: 180
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      expect(container.querySelector('.event-segment.event-travel')).toBeInTheDocument()
    })

    it('should guard against zero main duration', () => {
      // Even with zero-duration mainStart/mainEnd, mainDuration is floored to 1 min
      const ts = new Date('2026-02-03T10:00:00')
      const event = {
        title: 'Zero Duration',
        resource: {
          type: 'task',
          mainStart: ts,
          mainEnd: ts
        }
      }

      const { container } = render(<SolidEventCard event={event} />)
      const main = container.querySelector('.event-segment.event-main')
      expect(parseFloat(main.style.height)).toBeGreaterThan(0)
    })
  })

  describe('PropTypes Validation', () => {
    it('should accept valid event object with canonical fields', () => {
      const event = {
        title: 'Valid Event',
        resource: {
          type: 'task',
          prepDuration: 10,
          travelDuration: 5,
          mainStart: new Date('2026-02-03T09:00:00'),
          mainEnd: new Date('2026-02-03T10:00:00')
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

