/**
 * Custom Event Component for React Big Calendar
 * Displays events with type-specific styling
 */

import React from 'react'
import PropTypes from 'prop-types'

function CustomEvent({ event }) {
  const { title, resource } = event
  const eventType = resource?.type || 'task'
  const prepTime = resource?.preparationTime || 0
  const travelTime = resource?.travelTime || 0
  
  const hasPreActivities = prepTime > 0 || travelTime > 0

  return (
    <div className={`rbc-event-content event-${eventType}`}>
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
