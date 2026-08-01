import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook for managing toast notifications
 */
export function useToast() {
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const timeoutRef = useRef(null)

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setShowToast(false)
  }, [])

  const showToastNotification = useCallback((message, duration = 3000) => {
    hideToast()
    setToastMessage(message)
    setShowToast(true)
    timeoutRef.current = setTimeout(() => {
      hideToast()
    }, duration)
  }, [hideToast])

  useEffect(() => {
    return hideToast
  }, [hideToast])

  return {
    toastMessage,
    showToast,
    showToastNotification,
    hideToast
  }
}
