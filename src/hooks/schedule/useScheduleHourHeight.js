/**
 * React hook for reading the schedule grid row height from CSS design tokens.
 * Shared hook used by DayView, WeekView, and other schedule components.
 */
import { useState, useEffect } from 'react'

export const DEFAULT_ROW_H = 52

/** Read --hour-height / --minute-unit CSS variables from :root, falling back to DEFAULT_ROW_H. */
export function getScheduleHourHeight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return DEFAULT_ROW_H
  const styles = window.getComputedStyle(document.documentElement)
  const hourHeight = Number.parseFloat(styles.getPropertyValue('--hour-height'))
  if (Number.isFinite(hourHeight) && hourHeight > 0) return hourHeight
  const minuteUnit = Number.parseFloat(styles.getPropertyValue('--minute-unit'))
  if (Number.isFinite(minuteUnit) && minuteUnit > 0) return minuteUnit * 60
  return DEFAULT_ROW_H
}

/**
 * Returns the current schedule row height (px per hour) and automatically
 * updates when the viewport is resized or orientation changes.
 */
export function useScheduleHourHeight() {
  const [rowHeight, setRowHeight] = useState(() => getScheduleHourHeight())

  useEffect(() => {
    if (typeof window === 'undefined') return () => {}

    const update = () => {
      const next = getScheduleHourHeight()
      setRowHeight((prev) => (prev === next ? prev : next))
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return rowHeight
}
