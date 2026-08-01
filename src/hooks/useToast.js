import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook for managing toast notifications
 */
export function useToast() {
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const timeoutRef = useRef(null)

  const showToastNotification = useCallback((message, duration = 3000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setToastMessage(message)
    setShowToast(true)
    timeoutRef.current = setTimeout(() => {
      setShowToast(false)
      timeoutRef.current = null
    }, duration)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    toastMessage,
    showToast,
    showToastNotification
  }
}
