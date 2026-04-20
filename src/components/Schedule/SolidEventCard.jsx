/**
 * SolidEventCard Component - Canonical Event Card Implementation
 *
 * Renders a single FullCalendar event as a segmented block:
 *   prep segment (top) → main segment → travel segment (bottom)
 * Heights are strictly proportional to durations with a 1-minute safety floor
 * for the main segment to avoid zero/negative-height rendering edge cases.
 * Glow/shadow/border are applied once at the wrapper level only.
 *
 * Data model (canonical):
 *   resource.mainStart / resource.mainEnd  — actual event times
 *   resource.prepDuration / resource.travelDuration — buffer minutes
 *   event.start = renderStart = mainStart − prep
 *   event.end   = renderEnd   = mainEnd + travel
 */

import PropTypes from 'prop-types'
import { createLogger } from '../../utils/logger'
import { VALID_EVENT_TYPES } from '../../utils/scheduleConstants'
import './SolidEventCard.css'

const logger = createLogger('SolidEventCard')

const MILLISECONDS_PER_MINUTE = 60000
const DEFAULT_MAIN_DURATION_MINUTES = 60

function SolidEventCard({ event, onContextMenu }) {
  const { title, resource } = event

  // Validate event type to prevent injection attacks - provides defense-in-depth
  const rawEventType = resource?.type || 'task'
  const eventType = VALID_EVENT_TYPES.includes(rawEventType)
    ? rawEventType
    : 'task'

  // Log warning for invalid event types to detect data corruption or injection attempts
  if (rawEventType && !VALID_EVENT_TYPES.includes(rawEventType)) {
    logger.warn(
      `Invalid event type "${rawEventType}" on event "${title}" (id: ${event.id}), falling back to "task". Valid types: ${VALID_EVENT_TYPES.join(', ')}`
    )
  }

  // Prefer canonical prepDuration/travelDuration; fall back to legacy fields
  const prepDuration = resource?.prepDuration ?? resource?.preparationTime ?? 0
  const travelDuration = resource?.travelDuration ?? resource?.travelTime ?? 0
  const mainStart = resource?.mainStart ?? null
  const mainEnd = resource?.mainEnd ?? null

  // Strict proportional ratios with a minimal safety floor for mainDuration.
  // If canonical mainStart/mainEnd are missing, assume a 60-minute main segment so that
  // proportions remain reasonable regardless of buffer values.
  const mainDuration = mainStart && mainEnd
    ? Math.max(1, (mainEnd.getTime() - mainStart.getTime()) / MILLISECONDS_PER_MINUTE)
    : DEFAULT_MAIN_DURATION_MINUTES

  const totalDuration = travelDuration + prepDuration + mainDuration
  const travelRatio = (travelDuration / totalDuration) * 100
  const prepRatio = (prepDuration / totalDuration) * 100
  const mainRatio = (mainDuration / totalDuration) * 100

  // Sanitize title: coerce null/undefined to empty string so aria-label and
  // display never expose literal "null" or "undefined" to users or screen readers.
  const safeTitle = title != null ? String(title) : ''

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (onContextMenu) {
      onContextMenu(event, e)
    }
  }

  return (
    <div
      className={`fc-event-wrapper event-type-${eventType}`}
      role='article'
      aria-label={`${eventType}: ${safeTitle}`}
      onContextMenu={handleContextMenu}
    >
      {prepDuration > 0 && (
        <div
          className='event-segment event-prep'
          style={{ height: `${prepRatio}%` }}
          aria-hidden='true'
        />
      )}
      <div
        className='event-segment event-main'
        style={{ height: `${mainRatio}%` }}
      >
        <strong className='event-title'>
          {safeTitle}
        </strong>
      </div>
      {travelDuration > 0 && (
        <div
          className='event-segment event-travel'
          style={{ height: `${travelRatio}%` }}
          aria-hidden='true'
        />
      )}
    </div>
  )
}

SolidEventCard.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    resource: PropTypes.shape({
      type: PropTypes.string,
      preparationTime: PropTypes.number,
      travelTime: PropTypes.number,
      prepDuration: PropTypes.number,
      travelDuration: PropTypes.number,
      mainStart: PropTypes.instanceOf(Date),
      mainEnd: PropTypes.instanceOf(Date)
    })
  }).isRequired,
  onContextMenu: PropTypes.func
}

export default SolidEventCard
