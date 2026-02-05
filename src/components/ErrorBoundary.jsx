/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing
 */

import React from 'react'
import PropTypes from 'prop-types'
import { createLogger } from '../utils/logger'

const logger = createLogger('ErrorBoundary')

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI and capture the error
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and logger
    logger.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className='error-boundary-fallback' role='alert'>
          <div className='error-boundary-content'>
            <h2>Something went wrong</h2>
            <p>We&apos;re sorry, but something unexpected happened.</p>

            {this.state.error && (
              <details className='error-details'>
                <summary>Error details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className='error-actions'>
              <button onClick={this.handleReset} className='btn btn-primary'>
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className='btn btn-secondary'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

export default ErrorBoundary
