// Test suite for Calendar Subscription Manager
import 'fake-indexeddb/auto'
import {
  addCalendarSubscription,
  getCalendarSubscriptions,
  getCalendarSubscription,
  updateCalendarSubscription,
  deleteCalendarSubscription,
  parseICS,
  syncCalendar
} from '../utils/calendarSubscriptionManager'
import { clear, STORES } from '../utils/indexedDBManager'

// Mock fetch for testing
global.fetch = jest.fn()

describe('Calendar Subscription Manager', () => {
  beforeEach(async () => {
    await clear(STORES.CALENDAR_SUBSCRIPTIONS)
    await clear(STORES.SCHEDULE)
    jest.clearAllMocks()
  })

  describe('parseICS', () => {
    test('should parse basic ICS event with DATE-TIME format', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:Team Meeting
DESCRIPTION:Weekly standup
LOCATION:Office
UID:event-123
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Team Meeting')
      expect(events[0].description).toBe('Weekly standup')
      expect(events[0].location).toBe('Office')
      expect(events[0].uid).toBe('event-123')
      expect(events[0].dtstart).toBeInstanceOf(Date)
      expect(events[0].dtend).toBeInstanceOf(Date)
    })

    test('should parse ICS event with DATE format', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115
DTEND:20250116
SUMMARY:All Day Event
UID:event-456
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('All Day Event')
      expect(events[0].dtstart).toBeInstanceOf(Date)
    })

    test('should sanitize HTML in event fields', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:<script>alert('xss')</script>Meeting
DESCRIPTION:<img src=x onerror=alert('xss')>
LOCATION:Room <b>101</b>
UID:event-789
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(1)
      // Check that HTML characters are escaped
      expect(events[0].summary).toContain('&lt;script&gt;')
      expect(events[0].description).toContain('&lt;img')
      expect(events[0].location).toContain('&lt;b&gt;')
    })

    test('should handle invalid datetime gracefully', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:INVALID
DTEND:20250115T100000Z
SUMMARY:Bad Event
UID:event-bad
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      // Event should be filtered out if dtstart is invalid
      expect(events).toHaveLength(0)
    })

    test('should parse valid events even when invalid events are present', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:INVALID
SUMMARY:Bad Event
UID:event-bad
END:VEVENT
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:Good Event
UID:event-good
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      // Only the valid event should be parsed
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Good Event')
    })

    test('should handle DTSTART with VALUE parameter', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20250115
DTEND;VALUE=DATE:20250116
SUMMARY:All Day Event
UID:event-allday
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('All Day Event')
    })

    test('should handle DTSTART with TZID parameter', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;TZID=America/New_York:20250115T090000
DTEND;TZID=America/New_York:20250115T100000
SUMMARY:Meeting with Timezone
UID:event-tz
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(1)
      expect(events[0].summary).toBe('Meeting with Timezone')
    })

    test('should correctly unfold line-folded content (RFC 5545 compliance)', () => {
      // RFC 5545 section 3.1: Long lines can be folded with a leading space or tab
      // The node-ical library properly implements line folding
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:This is a very long summary that would normally be folded
 across multiple lines with leading spaces
DESCRIPTION:This description also has line folding
 with a continuation line here
 and another one here
UID:event-folded
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(1)

      // With node-ical, line folding is properly handled per RFC 5545:
      // Leading spaces are removed and lines are concatenated (no extra spaces added)
      expect(events[0].summary).toBe(
        'This is a very long summary that would normally be foldedacross multiple lines with leading spaces'
      )
      expect(events[0].description).toBe(
        'This description also has line foldingwith a continuation line hereand another one here'
      )
    })

    test('should parse multiple events', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:Event 1
UID:event-1
END:VEVENT
BEGIN:VEVENT
DTSTART:20250116T140000Z
DTEND:20250116T150000Z
SUMMARY:Event 2
UID:event-2
END:VEVENT
END:VCALENDAR`

      const events = parseICS(icsData)
      expect(events).toHaveLength(2)
      expect(events[0].summary).toBe('Event 1')
      expect(events[1].summary).toBe('Event 2')
    })
  })

  describe('addCalendarSubscription', () => {
    test('should add a calendar subscription', async () => {
      // Mock successful fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:Test Event
UID:test-123
END:VEVENT
END:VCALENDAR`
      })

      const subscription = {
        name: 'Work Calendar',
        url: 'https://example.com/calendar.ics',
        color: '#86f5e0',
        enabled: true
      }

      const id = await addCalendarSubscription(subscription)
      expect(id).toBeDefined()

      const subs = await getCalendarSubscriptions()
      expect(subs).toHaveLength(1)
      expect(subs[0].name).toBe('Work Calendar')
      expect(subs[0].url).toBe('https://example.com/calendar.ics')
    })
  })

  describe('URL validation', () => {
    test('should reject localhost URLs', async () => {
      const subscription = {
        name: 'Local Calendar',
        url: 'http://localhost:8080/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject private IP addresses', async () => {
      const subscription = {
        name: 'Private Calendar',
        url: 'http://192.168.1.1/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject 10.x.x.x private IP range', async () => {
      const testAddresses = ['10.0.0.1', '10.255.255.255', '10.128.0.1']

      for (const address of testAddresses) {
        const subscription = {
          name: 'Private Calendar',
          url: `http://${address}/calendar.ics`,
          color: '#86f5e0'
        }

        await expect(addCalendarSubscription(subscription)).rejects.toThrow(
          'Invalid or unsafe calendar URL'
        )
      }
    })

    test('should reject 172.16-31.x.x private IP range', async () => {
      const subscription = {
        name: 'Private Calendar',
        url: 'http://172.20.0.1/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject file:// protocol', async () => {
      const subscription = {
        name: 'File Calendar',
        url: 'file:///etc/passwd',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject invalid IPv4 addresses (octets > 255)', async () => {
      const subscription = {
        name: 'Invalid IP Calendar',
        url: 'http://999.999.999.999/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject private IPv6 addresses', async () => {
      const testAddresses = ['fc00::1', 'fd00::1', 'fe80::1']

      for (const address of testAddresses) {
        const subscription = {
          name: 'Private IPv6 Calendar',
          url: `http://[${address}]/calendar.ics`,
          color: '#86f5e0'
        }

        await expect(addCalendarSubscription(subscription)).rejects.toThrow(
          'Invalid or unsafe calendar URL'
        )
      }
    })

    test('should reject IPv4-mapped IPv6 addresses pointing to private ranges', async () => {
      const subscription = {
        name: 'IPv4-mapped IPv6 Calendar',
        url: 'http://[::ffff:192.168.1.1]/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject link-local IP addresses (169.254.x.x)', async () => {
      const subscription = {
        name: 'Link-local Calendar',
        url: 'http://169.254.169.254/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should reject loopback range (127.x.x.x)', async () => {
      const testAddresses = ['127.0.0.1', '127.1.1.1', '127.255.255.255']

      for (const address of testAddresses) {
        const subscription = {
          name: 'Loopback Calendar',
          url: `http://${address}/calendar.ics`,
          color: '#86f5e0'
        }

        await expect(addCalendarSubscription(subscription)).rejects.toThrow(
          'Invalid or unsafe calendar URL'
        )
      }
    })

    test('should reject carrier-grade NAT range (100.64.x.x - 100.127.x.x)', async () => {
      const testAddresses = ['100.64.0.1', '100.100.100.100', '100.127.255.255']

      for (const address of testAddresses) {
        const subscription = {
          name: 'CGN Calendar',
          url: `http://${address}/calendar.ics`,
          color: '#86f5e0'
        }

        await expect(addCalendarSubscription(subscription)).rejects.toThrow(
          'Invalid or unsafe calendar URL'
        )
      }
    })

    test('should reject IETF protocol assignments range (192.0.0.x)', async () => {
      const subscription = {
        name: 'IETF Calendar',
        url: 'http://192.0.0.1/calendar.ics',
        color: '#86f5e0'
      }

      await expect(addCalendarSubscription(subscription)).rejects.toThrow(
        'Invalid or unsafe calendar URL'
      )
    })

    test('should accept valid HTTPS URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      })

      const subscription = {
        name: 'Valid Calendar',
        url: 'https://calendar.google.com/calendar.ics',
        color: '#86f5e0'
      }

      const id = await addCalendarSubscription(subscription)
      expect(id).toBeDefined()
    })
  })

  describe('getCalendarSubscription', () => {
    test('should get a single subscription by ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      })

      const id = await addCalendarSubscription({
        name: 'Test Calendar',
        url: 'https://example.com/cal.ics',
        color: '#86f5e0'
      })

      const sub = await getCalendarSubscription(id)
      expect(sub).toBeDefined()
      expect(sub.name).toBe('Test Calendar')
    })

    test('should return null for non-existent ID', async () => {
      const sub = await getCalendarSubscription('non-existent-id')
      expect(sub).toBeNull()
    })
  })

  describe('updateCalendarSubscription', () => {
    test('should update a subscription', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      })

      const id = await addCalendarSubscription({
        name: 'Old Name',
        url: 'https://example.com/cal.ics',
        color: '#86f5e0'
      })

      const sub = await getCalendarSubscription(id)
      await updateCalendarSubscription({
        ...sub,
        name: 'New Name'
      })

      const updated = await getCalendarSubscription(id)
      expect(updated.name).toBe('New Name')
    })
  })

  describe('deleteCalendarSubscription', () => {
    test('should delete a subscription and its events', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T100000Z
SUMMARY:Test Event
UID:test-123
END:VEVENT
END:VCALENDAR`
      })

      const id = await addCalendarSubscription({
        name: 'Test Calendar',
        url: 'https://example.com/cal.ics',
        color: '#86f5e0'
      })

      await deleteCalendarSubscription(id)

      const subs = await getCalendarSubscriptions()
      expect(subs).toHaveLength(0)
    })
  })

  describe('syncCalendar error handling', () => {
    test('should handle fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'BEGIN:VCALENDAR\nEND:VCALENDAR'
      })

      const id = await addCalendarSubscription({
        name: 'Test Calendar',
        url: 'https://example.com/cal.ics',
        color: '#86f5e0'
      })

      // Mock fetch failure for sync
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      })

      await expect(syncCalendar(id)).rejects.toThrow('Failed to fetch calendar')
    })
  })
})
