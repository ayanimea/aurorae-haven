/**
 * SolidEventCard Component - Canonical Event Card Implementation
 *
 * Purpose: Primary visual anchor - events are the most dominant elements
 * Visual characteristics:
 * - Solid dark background (#161b22)
 * - Clear borders (#2a3240)
 * - Rounded rectangles (14px radius)
 * - Soft elevation (dual-layer shadows)
 * - Neutral background (no type-specific colors on background)
 * - Clear separation from time bands
 *
 * This is the "hero" of the schedule - everything else is context
 */

import React from 'react'
import PropTypes from 'prop-types'
import { VALID_EVENT_TYPES } from '../../utils/scheduleConstants'
import './SolidEventCard.css'

function SolidEventCard({ event, onContextMenu }) {
  const { title, resource } = event
  // Validate event type to prevent injection attacks - provides defense-in-depth
  const rawEventType = resource?.type || 'task'
  const eventType = VALID_EVENT_TYPES.includes(rawEventType) ? rawEventType : 'task'
  const prepTime = resource?.preparationTime || 0
  const travelTime = resource?.travelTime || 0

  const hasPreActivities = prepTime > 0 || travelTime > 0

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (onContextMenu) {
      onContextMenu(event, e)
    }
  }

  return (
    <div
      className={`solid-event-card event-type-${eventType}`}
      role='article'
      aria-label={`${eventType}: ${title}`}
      onContextMenu={handleContextMenu}
    >
      {/* Security note: event.title may contain user-provided text. React's JSX automatically
          escapes text content to prevent XSS attacks. We intentionally render it as plain text
          and do NOT use dangerouslySetInnerHTML. If HTML rendering is needed in the future,
          the title MUST be sanitized first with DOMPurify or equivalent.
          Type validation: title is validated as string in parent component before rendering. */}
      <strong className='event-title'>{String(title || '')}</strong>
      {hasPreActivities && (
        <div className='event-pre-activities'>
          {prepTime > 0 && (
            <span
              className='prep-indicator'
              title={`Preparation: ${prepTime} min`}
            >
              🎯 {prepTime}m
            </span>
          )}
          {travelTime > 0 && (
            <span
              className='travel-indicator'
              title={`Travel: ${travelTime} min`}
            >
              🚗 {travelTime}m
            </span>
          )}
        </div>
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
      travelTime: PropTypes.number
    })
  }).isRequired,
  onContextMenu: PropTypes.func
}

export default SolidEventCard
