/**
 * Custom Event Component for React Big Calendar
 * Displays events with type-specific styling
 */

import React from 'react'
import PropTypes from 'prop-types'
import { VALID_EVENT_TYPES } from '../../utils/scheduleConstants'

function CustomEvent({ event }) {
  const { title, resource } = event
  // Validate event type to prevent injection attacks
  const rawEventType = resource?.type || 'task'
  const eventType = VALID_EVENT_TYPES.includes(rawEventType) ? rawEventType : 'task'
  const prepTime = resource?.preparationTime || 0
  const travelTime = resource?.travelTime || 0
  
  const hasPreActivities = prepTime > 0 || travelTime > 0

  return (
    <div className={`rbc-event-content event-${eventType}`}>
      {/* Security note: event.title may contain user-provided text. React's JSX automatically
          escapes text content to prevent XSS attacks. We intentionally render it as plain text
          here and do NOT use dangerouslySetInnerHTML. If this title needs HTML rendering in
          the future, it MUST be sanitized first with DOMPurify or equivalent. */}
      <div className="event-title">{title}</div>
      {hasPreActivities && (
        <div className="event-pre-activities">
          {prepTime > 0 && <span className="prep-time" title={`Preparation time: ${prepTime} min`}>🎯 {prepTime}m</span>}
          {travelTime > 0 && <span className="travel-time" title={`Travel time: ${travelTime} min`}>🚗 {travelTime}m</span>}
        </div>
      )}
    </div>
  )
}

CustomEvent.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    resource: PropTypes.shape({
      type: PropTypes.string,
      preparationTime: PropTypes.number,
      travelTime: PropTypes.number
    })
  }).isRequired
}

export default CustomEvent
