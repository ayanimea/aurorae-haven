import PropTypes from 'prop-types'
import './FloatingDevButtons.css'

/**
 * FloatingDevButtons - Development-only floating action buttons
 * 
 * Provides unobtrusive access to dev tools without cluttering the main UI:
 * - Generate fake data for testing
 * - Clear all events for cleanup
 * 
 * Only rendered when isDevelopment() returns true.
 */
const FloatingDevButtons = ({ onPopulateData, onClearData }) => {
  return (
    <div className="floating-dev-buttons" role="group" aria-label="Development tools">
      <button
        className="fab fab-secondary"
        onClick={onClearData}
        aria-label="Clear all events"
        title="Clear all events"
      >
        🗑️
      </button>
      <button
        className="fab fab-primary"
        onClick={onPopulateData}
        aria-label="Generate fake data"
        title="Generate fake test data"
      >
        🎲
      </button>
    </div>
  )
}

FloatingDevButtons.propTypes = {
  onPopulateData: PropTypes.func.isRequired,
  onClearData: PropTypes.func.isRequired
}

export default FloatingDevButtons
