/**
 * Calendar Subscription Manager
 * Handles external calendar subscriptions (ICS, Google Calendar, etc.)
 */

/* global AbortController */

import { put, getAll, deleteById, openDB, STORES } from './indexedDBManager'
import { normalizeEntity, updateMetadata } from './idGenerator'
import { createLogger } from './logger'
import { createEvent } from './scheduleManager'
import { sanitizeText } from './sanitization'
import { DEFAULT_EVENT_DURATION_MINUTES } from './scheduleConstants'
import ical from 'node-ical'

const logger = createLogger('CalendarSubscription')

// Convert default event duration from minutes to milliseconds
const DEFAULT_EVENT_DURATION_MILLISECONDS =
  DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000

/**
 * Add or update a calendar subscription
 * @param {object} subscription - Subscription data
 * @param {string} subscription.name - Display name for the calendar
 * @param {string} subscription.url - URL to the ICS feed
 * @param {string} subscription.color - Color for events (hex color code)
 * @param {boolean} [subscription.enabled] - Whether the subscription is active
 * @returns {Promise<string>} Subscription ID
 */
export async function addCalendarSubscription(subscription) {
  const newSubscription = normalizeEntity({
    ...subscription,
    enabled: subscription.enabled !== false,
    lastSyncedAt: null,
    syncStatus: 'pending'
  })

  await put(STORES.CALENDAR_SUBSCRIPTIONS, newSubscription)

  // Trigger initial sync
  await syncCalendar(newSubscription.id)

  return newSubscription.id
}

/**
 * Get all calendar subscriptions
 * @returns {Promise<Array>} Array of subscriptions
 */
export async function getCalendarSubscriptions() {
  return await getAll(STORES.CALENDAR_SUBSCRIPTIONS)
}

/**
 * Get a single calendar subscription by ID
 * @param {string} id - Subscription ID
 * @returns {Promise<object|null>} Subscription or null if not found
 */
export async function getCalendarSubscription(id) {
  const subscriptions = await getAll(STORES.CALENDAR_SUBSCRIPTIONS)
  return subscriptions.find((sub) => sub.id === id) || null
}

/**
 * Update a calendar subscription
 * @param {object} subscription - Updated subscription data
 * @returns {Promise<string>} Subscription ID
 */
export async function updateCalendarSubscription(subscription) {
  const updated = updateMetadata(subscription)
  await put(STORES.CALENDAR_SUBSCRIPTIONS, updated)
  return updated.id
}

/**
 * Delete a calendar subscription and its events
 * @param {string} id - Subscription ID
 * @returns {Promise<void>}
 */
export async function deleteCalendarSubscription(id) {
  // Delete the subscription
  await deleteById(STORES.CALENDAR_SUBSCRIPTIONS, id)

  // Delete all events from this calendar
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCHEDULE, 'readwrite')
    const store = transaction.objectStore(STORES.SCHEDULE)
    const request = store.openCursor()

    request.onerror = () => reject(request.error)
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        const scheduleEvent = cursor.value
        if (scheduleEvent.externalCalendarId === id) {
          cursor.delete()
        }
        cursor.continue()
      }
    }

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = () => {
      db.close()
      const error =
        transaction.error ||
        new Error('Failed to delete calendar subscription events.')
      reject(error)
    }
  })
}

/**
 * Parse ICS (iCalendar) format and extract events
 * @param {string} icsData - Raw ICS data
 * @returns {Array<Object>} Array of parsed events
 *
 * Note: Uses node-ical library for full RFC 5545 compliance, including:
 * - Line folding (RFC 5545 section 3.1) — properly handles long lines split with leading space/tab
 * - Complex timezone handling (VTIMEZONE) with proper TZID parameter support
 * - Recurrence rules (RRULE, EXDATE, etc.) - note: recurrence expansion not included
 * - Proper date/time parsing and validation
 *
 * The node-ical library is MIT-licensed and provides robust, standards-compliant ICS parsing.
 */
export function parseICS(icsData) {
  try {
    // Parse ICS data using node-ical
    const parsed = ical.sync.parseICS(icsData)
    const events = []
    const MAX_EVENTS = 10000 // Limit to prevent memory exhaustion

    // Extract VEVENT entries
    for (const key in parsed) {
      const component = parsed[key]
      if (component.type === 'VEVENT') {
        // Limit number of events to prevent memory exhaustion
        if (events.length >= MAX_EVENTS) {
          logger.warn(
            `Reached maximum event limit (${MAX_EVENTS}). Stopping parse.`
          )
          break
        }

        // Validate that we have a start date and it's a valid Date object
        if (
          !component.start ||
          !(component.start instanceof Date) ||
          isNaN(component.start.getTime())
        ) {
          logger.warn('Skipping event with invalid or missing start date', {
            uid: component.uid
          })
          continue
        }

        // Convert to our simplified event format
        const event = {
          summary: sanitizeText(component.summary || ''),
          description: sanitizeText(component.description || ''),
          location: sanitizeText(component.location || ''),
          uid: component.uid,
          dtstart: component.start,
          dtend: component.end
        }

        // Only include events with required fields (summary and valid start date)
        if (event.summary && event.dtstart) {
          events.push(event)
        }
      }
    }

    return events
  } catch (error) {
    logger.error('Failed to parse ICS data', { error: error.message })
    return []
  }
}

/**
 * Convert ICS event to schedule event format
 * @param {object} icsEvent - Parsed ICS event from node-ical
 * @param {string} calendarId - Calendar subscription ID
 * @returns {object|null} Schedule event data or null if invalid
 */
function convertICSEventToScheduleEvent(icsEvent, calendarId) {
  // Validate dates (node-ical returns Date objects directly)
  if (!icsEvent.dtstart || !(icsEvent.dtstart instanceof Date)) {
    logger.warn('ICS event missing or invalid start time', { event: icsEvent })
    return null
  }

  const startDate = icsEvent.dtstart
  if (isNaN(startDate.getTime())) {
    logger.warn('Invalid start date in ICS event', { event: icsEvent })
    return null
  }

  // Use end date if available, otherwise default to 1 hour duration
  let endDate = icsEvent.dtend
  if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
    endDate = new Date(
      startDate.getTime() + DEFAULT_EVENT_DURATION_MILLISECONDS
    )
  }

  // Format date as YYYY-MM-DD using local time
  const year = startDate.getFullYear()
  const month = String(startDate.getMonth() + 1).padStart(2, '0')
  const date = String(startDate.getDate()).padStart(2, '0')
  const day = `${year}-${month}-${date}`

  // Format times as HH:MM in local timezone
  const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

  return {
    title: icsEvent.summary || 'Untitled Event',
    day,
    startTime,
    endTime,
    description: icsEvent.description || '',
    location: icsEvent.location || '',
    type: 'event',
    isExternal: true,
    externalCalendarId: calendarId,
    externalEventId: icsEvent.uid || `${calendarId}-${Date.now()}`
  }
}

/**
 * Validate calendar URL to prevent SSRF attacks
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe to fetch
 *
 * Note: This validation blocks:
 * - Localhost (e.g. 127.0.0.1, ::1)
 * - Private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Unique-local IPv6 addresses (fc00::/7, fd00::/7)
 * - Link-local IPv6 addresses (fe80::/10)
 * - IPv4-mapped IPv6 addresses (::ffff:0:0/96, e.g. ::ffff:192.168.1.1)
 *
 * It does NOT currently protect against:
 * - DNS rebinding attacks (domain initially resolves to public IP, later to private)
 *
 * For production use in security-sensitive contexts, consider additional safeguards.
 */
function validateCalendarURL(url) {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const parsedURL = new URL(url)

    // Only allow https:// and http:// protocols (no file://, javascript:, etc.)
    if (parsedURL.protocol !== 'https:' && parsedURL.protocol !== 'http:') {
      logger.warn('Invalid protocol for calendar URL', {
        protocol: parsedURL.protocol
      })
      return false
    }

    // Reject localhost and private IP ranges to prevent SSRF
    const hostname = parsedURL.hostname.toLowerCase()

    // Block localhost variations
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
      logger.warn('Localhost URLs not allowed for calendar subscriptions')
      return false
    }

    // Block private IPv6 ranges
    if (hostname.includes(':')) {
      // IPv6 addresses in URLs are wrapped in brackets [ipv6], so remove them for checking
      const ipv6Address = hostname.replace(/^\[|\]$/g, '')

      // Check for IPv6 private ranges and IPv4-mapped IPv6
      if (
        ipv6Address.startsWith('fc') ||
        ipv6Address.startsWith('fd') ||
        ipv6Address.startsWith('fe80') ||
        ipv6Address.includes('::ffff:')
      ) {
        logger.warn(
          'Private IPv6 ranges not allowed for calendar subscriptions'
        )
        return false
      }
    }

    // Block private IPv4 ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const ipMatch = hostname.match(ipv4Regex)
    if (ipMatch) {
      const a = Number(ipMatch[1])
      const b = Number(ipMatch[2])
      const c = Number(ipMatch[3])
      const d = Number(ipMatch[4])

      // Validate octets are in valid range (0-255)
      if (a > 255 || b > 255 || c > 255 || d > 255) {
        logger.warn('Invalid IPv4 address (octets out of range)')
        return false
      }

      // Check for private and reserved IPv4 ranges to prevent SSRF
      if (
        // RFC1918 private ranges
        a === 10 || // 10.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) || // 192.168.0.0/16
        // Loopback
        a === 127 || // 127.0.0.0/8 (full range, not just 127.0.0.1)
        // Link-local
        (a === 169 && b === 254) || // 169.254.0.0/16 (APIPA)
        // Carrier-grade NAT (RFC 6598)
        (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10
        // IETF Protocol Assignments
        (a === 192 && b === 0 && c === 0) // 192.0.0.0/24
      ) {
        logger.warn(
          'Private or reserved IP ranges not allowed for calendar subscriptions'
        )
        return false
      }
    }

    return true
  } catch (e) {
    logger.warn('Invalid URL format for calendar subscription', {
      url,
      error: e.message
    })
    return false
  }
}

/**
 * Sync a calendar subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<void>}
 */
export async function syncCalendar(subscriptionId) {
  const subscription = await getCalendarSubscription(subscriptionId)

  if (!subscription || !subscription.enabled) {
    return
  }

  // Validate URL before fetching
  if (!validateCalendarURL(subscription.url)) {
    const error = new Error(
      'Invalid or unsafe calendar URL. Only HTTPS/HTTP URLs to public servers are allowed.'
    )
    logger.error('Calendar URL validation failed', { url: subscription.url })

    await updateCalendarSubscription({
      ...subscription,
      syncStatus: 'error',
      lastSyncError: error.message
    })

    throw error
  }

  try {
    // Update sync status
    await updateCalendarSubscription({
      ...subscription,
      syncStatus: 'syncing'
    })

    let icsEvents

    // Fetch ICS data with timeout and size limit to prevent memory/hanging issues
    const controller = new AbortController()
    const timeoutMs = 30000 // 30 second timeout
    const maxSizeBytes = 10 * 1024 * 1024 // 10MB max response size
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(subscription.url, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.statusText}`)
      }

      // Check content-length header if available
      const contentLength = response.headers?.get('content-length')
      if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
        throw new Error(
          `Calendar feed too large (${Math.round(parseInt(contentLength, 10) / 1024 / 1024)}MB). Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`
        )
      }

      const icsData = await response.text()

      // Validate size after fetching (in case content-length wasn't provided)
      if (icsData.length > maxSizeBytes) {
        throw new Error(
          `Calendar feed too large (${Math.round(icsData.length / 1024 / 1024)}MB). Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`
        )
      }

      icsEvents = parseICS(icsData)
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Calendar sync request timed out. Please try again later.'
        )
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    // Delete old events from this calendar
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SCHEDULE, 'readwrite')
      const store = transaction.objectStore(STORES.SCHEDULE)
      const request = store.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          const scheduleEvent = cursor.value
          if (scheduleEvent.externalCalendarId === subscriptionId) {
            cursor.delete()
          }
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        db.close()
        resolve()
      }

      transaction.onerror = () => {
        db.close()
        const error =
          transaction.error ||
          new Error('Failed to delete old calendar events during sync.')
        reject(error)
      }
    })

    // Add new events
    for (const icsEvent of icsEvents) {
      const scheduleEvent = convertICSEventToScheduleEvent(
        icsEvent,
        subscriptionId
      )
      // Skip invalid events
      if (scheduleEvent) {
        await createEvent(scheduleEvent)
      }
    }

    // Update sync status
    await updateCalendarSubscription({
      ...subscription,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'success'
    })

    logger.log(`Successfully synced calendar: ${subscription.name}`)
  } catch (error) {
    logger.error(`Failed to sync calendar ${subscription.name}:`, error)

    // Update sync status to error
    await updateCalendarSubscription({
      ...subscription,
      syncStatus: 'error',
      lastSyncError: error.message
    })

    throw error
  }
}

/**
 * Sync all enabled calendar subscriptions
 * @returns {Promise<void>}
 */
export async function syncAllCalendars() {
  const subscriptions = await getCalendarSubscriptions()
  const enabledSubscriptions = subscriptions.filter((sub) => sub.enabled)

  const syncPromises = enabledSubscriptions.map((sub) =>
    syncCalendar(sub.id).catch((error) => {
      logger.error(`Failed to sync calendar ${sub.name}:`, error)
      // Continue with other calendars even if one fails
    })
  )

  await Promise.all(syncPromises)
}
