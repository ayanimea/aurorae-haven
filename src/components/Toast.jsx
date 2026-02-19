import { useEffect } from 'react'
import PropTypes from 'prop-types'

function Toast({ message, visible, onClose }) {
  useEffect(() => {
    if (visible && message) {
      const timer = setTimeout(() => {
        onClose()
      }, 3800)
      return () => clearTimeout(timer)
    }
  }, [visible, message, onClose])

  if (!visible || !message) return null

  return (
    <div id='toast' className='toast' style={{ display: 'block' }}>
      {message}
    </div>
  )
}

Toast.propTypes = {
  message: PropTypes.string,
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default Toast
