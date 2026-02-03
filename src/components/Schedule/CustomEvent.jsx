/**
 * Custom Event Component for React Big Calendar
 * Displays events with type-specific styling
 */

import React from 'react'
import PropTypes from 'prop-types'

function CustomEvent({ event }) {
  const { title, resource } = event
  const eventType = resource?.type || 'task'

  return (
    <div className={`rbc-event-content event-${eventType}`}>
      <div className="event-title">{title}</div>
    </div>
  )
}

CustomEvent.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    resource: PropTypes.shape({
      type: PropTypes.string
    })
  }).isRequired
}

export default CustomEvent
