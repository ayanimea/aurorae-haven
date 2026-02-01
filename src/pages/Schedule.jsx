import React, { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import Icon from '../components/common/Icon'
import EventModal from '../components/Schedule/EventModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import {
  createEvent,
  deleteEvent,
  getEventsForDay,
  getEventsForWeek,
  getEventsForRange
} from '../utils/scheduleManager'
import {
  getCalendarSubscriptions,
  addCalendarSubscription,
  deleteCalendarSubscription,
  updateCalendarSubscription,
  syncCalendar
} from '../utils/calendarSubscriptionManager'
import { createLogger } from '../utils/logger'
import { subtractDuration } from '../utils/timeUtils'
import { generateTestData } from '../utils/testDataGenerator'
import dayjs from 'dayjs'
import {
  EVENT_TYPES,
  SCHEDULE_START_HOUR,
  SCHEDULE_END_HOUR,
  PIXELS_PER_HOUR,
  SCHEDULE_VERTICAL_OFFSET,
  MINUTES_PER_HOUR
} from '../utils/scheduleConstants'

const logger = createLogger('Schedule')

// Reusable ScheduleBlock component
function ScheduleBlock({
  type,
  className = '',
  title,
  time,
  top,
  height,
  isNext = false,
  onClick
}) {
  const blockClasses = `block ${type} ${className}`.trim()
  const ariaLabel = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${title} at ${time}${isNext ? ' - Next up' : ''}`

  return (
    <div
      className={blockClasses}
      style={{ top: `${top}px`, height: `${height}px` }}
      aria-label={ariaLabel}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e)
              }
            }
          : undefined
      }
    >
      {isNext && <div className='next-badge'>Next</div>}
      <div className='title'>{title}</div>
      <div className='meta'>{time}</div>
    </div>
  )
}

ScheduleBlock.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
  title: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  top: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  isNext: PropTypes.bool,
  onClick: PropTypes.func
}

// Reusable component for travel/preparation time blocks
function TimePreparationBlock({ type, top, height, time }) {
  const blockClasses = `block block-preparation ${type}`
  const label = type === 'travel' ? 'Travel' : 'Prep'
  const ariaLabel = `${label} time: ${time}`

  return (
    <div
      className={blockClasses}
      style={{ top: `${top}px`, height: `${height}px` }}
      aria-label={ariaLabel}
      role='note'
    >
      <div className='title preparation-label'>{label}</div>
      <div className='meta'>{time}</div>
    </div>
  )
}

TimePreparationBlock.propTypes = {
  type: PropTypes.oneOf(['travel', 'preparation']).isRequired,
  top: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  time: PropTypes.string.isRequired
}

// Static demo blocks removed - use "Generate Test Data" for realistic events

// Get dynamic hour height from CSS custom property
// Falls back to PIXELS_PER_HOUR constant if CSS variable not available
const getHourHeight = () => {
  if (typeof window === 'undefined') return PIXELS_PER_HOUR
  const rootStyles = getComputedStyle(document.documentElement)
  const hourHeight = rootStyles.getPropertyValue('--hour-height').trim()
  if (hourHeight) {
    const parsed = parseInt(hourHeight, 10)
    return isNaN(parsed) ? PIXELS_PER_HOUR : parsed
  }
  return PIXELS_PER_HOUR
}

// Get dynamic schedule range based on 24-hour setting
const getScheduleHours = (show24Hours) => {
  if (show24Hours) {
    return {
      start: 0,
      end: 24,
      total: 24
    }
  }
  return {
    start: SCHEDULE_START_HOUR,
    end: SCHEDULE_END_HOUR,
    total: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR
  }
}

// Generate hour labels based on 24-hour display setting
const generateHourLabels = (show24Hours) => {
  if (show24Hours) {
    // 24-hour mode: 00:00 to 23:00, no period labels
    return Array.from({ length: 24 }, (_, i) => ({
      label: `${String(i).padStart(2, '0')}:00`,
      isLabel: false
    }))
  }
  
  // 7am-midnight mode with period labels
  return [
    { label: '07:00', isLabel: false },
    { label: 'Morning', isLabel: true },
    { label: '09:00', isLabel: false },
    { label: '10:00', isLabel: false },
    { label: '11:00', isLabel: false },
    { label: 'Afternoon', isLabel: true },
    { label: '13:00', isLabel: false },
    { label: '14:00', isLabel: false },
    { label: '15:00', isLabel: false },
    { label: '16:00', isLabel: false },
    { label: '17:00', isLabel: false },
    { label: 'Evening', isLabel: true },
    { label: '19:00', isLabel: false },
    { label: '20:00', isLabel: false },
    { label: '21:00', isLabel: false },
    { label: '22:00', isLabel: false },
    { label: '23:00', isLabel: false },
    { label: '00:00', isLabel: false }
  ]
}

// Helper function to get visual row index for a given hour in 7am-midnight mode
// Accounts for "Morning", "Afternoon", "Evening" label rows
const getVisualRowForHour = (hour) => {
  // Map of hour to visual row index
  const hourToRow = {
    7: 0,   // 07:00
    8: 1,   // Falls in "Morning" label row
    9: 2,   // 09:00
    10: 3,  // 10:00
    11: 4,  // 11:00
    12: 5,  // Falls in "Afternoon" label row
    13: 6,  // 13:00
    14: 7,  // 14:00
    15: 8,  // 15:00
    16: 9,  // 16:00
    17: 10, // 17:00
    18: 11, // Falls in "Evening" label row
    19: 12, // 19:00
    20: 13, // 20:00
    21: 14, // 21:00
    22: 15, // 22:00
    23: 16, // 23:00
    0: 17,  // 00:00 (midnight)
    24: 17  // 24:00 (also midnight)
  }
  return hourToRow[hour] ?? 0
}

// TODO: Extract timeToPosition and durationToHeight to a testable utility module
// These functions contain complex logic for time-to-pixel conversion and boundary clamping
// that should be thoroughly unit tested with various edge cases

// Convert time string (HH:MM) to pixel position
// Returns -1 if time is invalid or outside schedule range
const timeToPosition = (timeString, scheduleStartHour = SCHEDULE_START_HOUR, scheduleEndHour = SCHEDULE_END_HOUR, use24HourMode = false) => {
  // Input validation: check for null, type, and format
  if (
    !timeString ||
    typeof timeString !== 'string' ||
    !timeString.includes(':')
  ) {
    return -1
  }
  const parts = timeString.split(':')
  if (parts.length !== 2) return -1

  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  // Validate numeric conversion
  if (isNaN(hours) || isNaN(minutes)) return -1
  // Check if time falls within schedule window
  if (hours < scheduleStartHour || hours >= scheduleEndHour) return -1

  const pixelsPerHour = getHourHeight() // Get dynamic hour height

  // Calculate pixel position from schedule start time
  if (use24HourMode) {
    // 24-hour mode: direct calculation, no label rows
    return (
      (hours - scheduleStartHour) * pixelsPerHour +
      (minutes / MINUTES_PER_HOUR) * pixelsPerHour +
      SCHEDULE_VERTICAL_OFFSET
    )
  } else {
    // 6am-10pm mode: use visual row mapping to account for label rows
    const visualRow = getVisualRowForHour(hours)
    const minuteOffset = (minutes / MINUTES_PER_HOUR) * pixelsPerHour
    return visualRow * pixelsPerHour + minuteOffset + SCHEDULE_VERTICAL_OFFSET
  }
}

// Convert duration in minutes to pixel height
// Clamps event times to visible schedule window (07:00-00:00) to prevent overflow
const durationToHeight = (startTime, endTime) => {
  // Input validation: check for null, type, and format
  if (
    !startTime ||
    !endTime ||
    typeof startTime !== 'string' ||
    typeof endTime !== 'string'
  ) {
    return 0
  }
  if (!startTime.includes(':') || !endTime.includes(':')) {
    return 0
  }

  const startParts = startTime.split(':')
  const endParts = endTime.split(':')

  if (startParts.length !== 2 || endParts.length !== 2) return 0

  const startHours = Number(startParts[0])
  const startMinutes = Number(startParts[1])
  const endHours = Number(endParts[0])
  const endMinutes = Number(endParts[1])

  // Validate numeric conversion
  if (
    isNaN(startHours) ||
    isNaN(startMinutes) ||
    isNaN(endHours) ||
    isNaN(endMinutes)
  ) {
    return 0
  }

  // Convert schedule hours to minutes for easier calculation
  const scheduleStartMinutes = SCHEDULE_START_HOUR * MINUTES_PER_HOUR // 420 minutes (07:00)
  const scheduleEndMinutes = SCHEDULE_END_HOUR * MINUTES_PER_HOUR // 1440 minutes (00:00/24:00)

  let startTotalMinutes = startHours * MINUTES_PER_HOUR + startMinutes
  let endTotalMinutes = endHours * MINUTES_PER_HOUR + endMinutes

  // If the event is completely outside the visible schedule, height is zero
  if (
    endTotalMinutes <= scheduleStartMinutes ||
    startTotalMinutes >= scheduleEndMinutes
  ) {
    return 0
  }

  // Clamp event times to the visible schedule window to prevent overflow rendering
  // This handles events that start before 07:00 or end after 00:00
  if (startTotalMinutes < scheduleStartMinutes) {
    startTotalMinutes = scheduleStartMinutes
  }
  if (endTotalMinutes > scheduleEndMinutes) {
    endTotalMinutes = scheduleEndMinutes
  }

  // Calculate the visible duration and convert to pixels
  const visibleDurationMinutes = Math.max(
    0,
    endTotalMinutes - startTotalMinutes
  )
  return (visibleDurationMinutes / MINUTES_PER_HOUR) * getHourHeight()
}

function Schedule() {
  // View mode state - 'day', '3days', 'week', or 'month'
  const [viewMode, setViewMode] = useState('day')

  // Date navigation state - track selected date (industry standard)
  const [selectedDate, setSelectedDate] = useState(dayjs())

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState(null)

  // Events state
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Display settings
  const [show24Hours, setShow24Hours] = useState(false) // Toggle for 24-hour display
  
  // Dynamic hour height (recalculated on mount and resize)
  const [hourHeight, setHourHeight] = useState(PIXELS_PER_HOUR)
  
  // Calculate hour height dynamically to fit content on screen without scrolling
  // Update hour height on mount, resize, and view mode change
  useEffect(() => {
    const calculateDynamicHourHeight = () => {
      if (typeof window === 'undefined') return PIXELS_PER_HOUR
      
      // Get available viewport height
      const viewportHeight = window.innerHeight
      
      // Account for header and controls (navbar ~80px + controls ~60px + padding ~20px = ~160px)
      const headerOffset = 160
      const availableHeight = viewportHeight - headerOffset
      
      // Calculate hour height based on number of visual rows (18 for 7am-midnight mode, 24 for 24-hour mode)
      const numRows = show24Hours ? 24 : 18
      const calculatedHeight = Math.floor(availableHeight / numRows)
      
      // Set reasonable bounds: minimum 40px, maximum 120px per hour
      const minHeight = 40
      const maxHeight = 120
      return Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
    }
    
    const updateHourHeight = () => {
      const dynamicHeight = calculateDynamicHourHeight()
      setHourHeight(dynamicHeight)
      
      // Update CSS custom property so CSS can use the same value
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--hour-height', `${dynamicHeight}px`)
      }
    }
    
    updateHourHeight()
    window.addEventListener('resize', updateHourHeight)
    return () => window.removeEventListener('resize', updateHourHeight)
  }, [show24Hours]) // Recalculate when 24-hour mode changes
  
  // Calculate dynamic slot heights based on hour height
  const slotHeight = show24Hours ? hourHeight * 24 : hourHeight * 18 // 18 visual rows for 7am-midnight with labels

  // Calculate time periods dynamically based on hour height
  // Rows 0-4 (07:00-11:00): 5 rows for morning
  // Rows 5-10 (12:00-17:00): 6 rows for afternoon  
  // Rows 11-17 (18:00-00:00): 7 rows for evening
  const timePeriods = [
    { className: 'time-period-morning', top: 0, height: hourHeight * 5 },
    { className: 'time-period-afternoon', top: hourHeight * 5, height: hourHeight * 6 },
    { className: 'time-period-evening', top: hourHeight * 11, height: hourHeight * 7 }
  ]
  
  // Separator positions after each period label (rows 1, 5, 11)
  const separatorPositions = [
    hourHeight * 1 + 4, // After "Morning" label (row 1) + 4px visual offset
    hourHeight * 5 + 4, // After "Afternoon" label (row 5) + 4px visual offset
    hourHeight * 11 + 4 // After "Evening" label (row 11) + 4px visual offset
  ]

  // Dropdown state for event type selector
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Settings dropdown state (mobile only)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // View mode dropdown state
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false)

  // Calendar subscriptions sidebar state
  const [showCalendars, setShowCalendars] = useState(false)
  const [subscriptions, setSubscriptions] = useState([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    color: '#86f5e0',
    enabled: true
  })

  // Refs for timeout cleanup and menu items caching
  const tabTimeoutRef = useRef(null)
  const autoFocusTimeoutRef = useRef(null)
  const menuItemsRef = useRef(null)

  // Calculate current time position for time indicator
  const [currentTimePosition, setCurrentTimePosition] = useState(0)

  // Load events function (extracted so it can be reused)
  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      let loadedEvents
      if (viewMode === 'day') {
        loadedEvents = await getEventsForDay(selectedDate.format('YYYY-MM-DD'))
      } else if (viewMode === '3days') {
        // Load events for 3 consecutive days starting from selectedDate
        const startDate = selectedDate.format('YYYY-MM-DD')
        const endDate = selectedDate.add(2, 'day').format('YYYY-MM-DD')
        loadedEvents = await getEventsForRange(startDate, endDate)
      } else if (viewMode === 'week') {
        loadedEvents = await getEventsForWeek()
      } else if (viewMode === 'month') {
        // Get first and last day of the month view (includes prev/next month days)
        const startOfMonth = selectedDate.startOf('month').startOf('week')
        const endOfMonth = selectedDate.endOf('month').endOf('week')
        loadedEvents = await getEventsForRange(
          startOfMonth.format('YYYY-MM-DD'),
          endOfMonth.format('YYYY-MM-DD')
        )
      }
      // Ensure loadedEvents is always an array
      setEvents(Array.isArray(loadedEvents) ? loadedEvents : [])
    } catch (err) {
      logger.error('Failed to load events:', err)
      setEvents([])
      setError('Failed to load schedule events')
    } finally {
      setIsLoading(false)
    }
  }, [viewMode, selectedDate])

  // Load events based on view mode and selected date
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      const scheduleHours = getScheduleHours(show24Hours)
      const pixelsPerHour = getHourHeight() // Get dynamic hour height

      if (hours >= scheduleHours.start && hours < scheduleHours.end) {
        let position
        if (show24Hours) {
          // 24-hour mode: direct calculation
          position =
            (hours - scheduleHours.start) * pixelsPerHour +
            (minutes / MINUTES_PER_HOUR) * pixelsPerHour +
            SCHEDULE_VERTICAL_OFFSET
        } else {
          // 7am-midnight mode: use visual row mapping
          const visualRow = getVisualRowForHour(hours)
          const minuteOffset = (minutes / MINUTES_PER_HOUR) * pixelsPerHour
          position = visualRow * pixelsPerHour + minuteOffset + SCHEDULE_VERTICAL_OFFSET
        }
        
        // No scaling needed - hour heights are now calculated dynamically
        
        setCurrentTimePosition(position)
      } else {
        setCurrentTimePosition(-1) // Hide if outside schedule range
      }
    }

    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 60000) // Update every minute
    
    // Update on window resize to handle crossing 1024px breakpoint
    window.addEventListener('resize', updateCurrentTime)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updateCurrentTime)
    }
  }, [show24Hours, viewMode])

  // Load calendar subscriptions when calendars section is shown
  useEffect(() => {
    if (showCalendars) {
      const loadSubscriptions = async () => {
        setSubsLoading(true)
        try {
          const subs = await getCalendarSubscriptions()
          setSubscriptions(subs)
        } catch (err) {
          logger.error('Failed to load subscriptions:', err)
        } finally {
          setSubsLoading(false)
        }
      }
      loadSubscriptions()
    }
  }, [showCalendars])

  // Handle opening modal for adding events
  const handleAddEvent = (eventType) => {
    setSelectedEventType(eventType)
    setIsModalOpen(true)
    setIsDropdownOpen(false) // Close dropdown when opening modal
  }

  // Toggle dropdown menu with keyboard support
  const toggleDropdown = (event) => {
    // Prevent default for Space key to avoid page scrolling
    if (event?.key === ' ') {
      event.preventDefault()
    }

    const wasClosedBefore = !isDropdownOpen
    setIsDropdownOpen(!isDropdownOpen)

    // When dropdown opens (via keyboard or mouse), cache menu items for performance
    if (wasClosedBefore) {
      // Use setTimeout to ensure the menu is rendered before querying/focusing, store ref for cleanup
      autoFocusTimeoutRef.current = setTimeout(() => {
        const menuButtons = document.querySelectorAll(
          '.schedule-dropdown-menu button'
        )
        // Cache menu items in ref for performance (avoid repeated DOM queries in arrow key nav)
        menuItemsRef.current = Array.from(menuButtons)

        // Only auto-focus first menu item when opened via keyboard (Space or Enter) to preserve UX
        if (event?.key === 'Enter' || event?.key === ' ') {
          menuItemsRef.current[0]?.focus()
        }
      }, 0)
    } else {
      // Clear cached menu items when dropdown closes
      menuItemsRef.current = null
    }
  }

  // Close dropdown when clicking outside or using keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.schedule-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (!isDropdownOpen) {
        return
      }

      // Allow users to close the dropdown with Escape
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        // Return focus to the dropdown button
        const dropdownButton = document.querySelector(
          '.schedule-dropdown button[aria-haspopup="menu"]'
        )
        if (dropdownButton) {
          dropdownButton.focus()
        }
        return
      }

      // When tabbing, close the dropdown once focus leaves it
      if (event.key === 'Tab') {
        // Clear any existing timeout
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current)
        }

        // Wait for focus to move before checking the active element
        tabTimeoutRef.current = window.setTimeout(() => {
          const activeElement = document.activeElement
          const isInsideDropdown =
            activeElement &&
            activeElement.closest &&
            activeElement.closest('.schedule-dropdown')

          if (!isInsideDropdown) {
            setIsDropdownOpen(false)
          }
          tabTimeoutRef.current = null
        }, 0)
      }

      // Arrow key navigation within menu - use cached menu items if available
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Home' ||
        event.key === 'End'
      ) {
        // Use cached menu items or query DOM if not cached
        const menuItems =
          menuItemsRef.current ||
          Array.from(
            document.querySelectorAll('.schedule-dropdown-menu button')
          )

        if (!menuItems.length) {
          return
        }

        const currentIndex = menuItems.indexOf(document.activeElement)

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          const nextIndex =
            currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
          menuItems[nextIndex]?.focus()
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
          menuItems[prevIndex]?.focus()
        } else if (event.key === 'Home') {
          event.preventDefault()
          menuItems[0]?.focus()
        } else if (event.key === 'End') {
          event.preventDefault()
          menuItems[menuItems.length - 1]?.focus()
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      // Cleanup any pending dropdown-related timeouts
      if (tabTimeoutRef.current) {
        clearTimeout(tabTimeoutRef.current)
      }
      if (autoFocusTimeoutRef.current) {
        clearTimeout(autoFocusTimeoutRef.current)
      }
    }
  }, [isDropdownOpen])

  // Handle saving event
  const handleSaveEvent = async (eventData) => {
    try {
      await createEvent(eventData)
      // Reload events after creating new one, keeping the current view/date
      const loadedEvents =
        viewMode === 'day'
          ? await getEventsForDay(selectedDate.format('YYYY-MM-DD'))
          : await getEventsForWeek()
      // Ensure loadedEvents is always an array
      setEvents(Array.isArray(loadedEvents) ? loadedEvents : [])
      logger.log(`${eventData.type} event created successfully`)
    } catch (err) {
      logger.error('Failed to save event:', err)
      // Provide specific error message if available
      const reason = err && err.message ? err.message : 'Unknown error'
      throw new Error(`Failed to save event: ${reason}. Please try again.`)
    }
  }

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEventType(null)
  }

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
  }

  // Navigation handlers (industry standard)
  const goToToday = () => {
    setSelectedDate(dayjs())
  }

  const goToPrevious = () => {
    if (viewMode === 'day') {
      setSelectedDate((prev) => prev.subtract(1, 'day'))
    } else if (viewMode === '3days') {
      setSelectedDate((prev) => prev.subtract(3, 'day'))
    } else if (viewMode === 'week') {
      setSelectedDate((prev) => prev.subtract(1, 'week'))
    } else if (viewMode === 'month') {
      setSelectedDate((prev) => prev.subtract(1, 'month'))
    }
  }

  const goToNext = () => {
    if (viewMode === 'day') {
      setSelectedDate((prev) => prev.add(1, 'day'))
    } else if (viewMode === '3days') {
      setSelectedDate((prev) => prev.add(3, 'day'))
    } else if (viewMode === 'week') {
      setSelectedDate((prev) => prev.add(1, 'week'))
    } else if (viewMode === 'month') {
      setSelectedDate((prev) => prev.add(1, 'month'))
    }
  }

  // Calendar subscription handlers
  const handleToggleCalendars = () => {
    setShowCalendars(!showCalendars)
  }

  const handleAddSubscription = async () => {
    if (!formData.name || !formData.url) return

    try {
      await addCalendarSubscription(formData)
      setShowAddForm(false)
      setFormData({ name: '', url: '', color: '#86f5e0', enabled: true })
      // Reload subscriptions
      const subs = await getCalendarSubscriptions()
      setSubscriptions(subs)
    } catch (err) {
      logger.error('Failed to add subscription:', err)
    }
  }

  const handleDeleteSubscription = async () => {
    if (!confirmDelete) return

    try {
      await deleteCalendarSubscription(confirmDelete.id)
      setConfirmDelete(null)
      // Reload subscriptions
      const subs = await getCalendarSubscriptions()
      setSubscriptions(subs)
    } catch (err) {
      logger.error('Failed to delete subscription:', err)
    }
  }

  const handleToggleSubscription = async (id, enabled) => {
    try {
      await updateCalendarSubscription(id, { enabled: !enabled })
      // Reload subscriptions
      const subs = await getCalendarSubscriptions()
      setSubscriptions(subs)
    } catch (err) {
      logger.error('Failed to toggle subscription:', err)
    }
  }

  const handleSyncSubscription = async (id, name) => {
    try {
      await syncCalendar(id)
      logger.info(`Synced calendar: ${name}`)
      // Could show a success toast here
    } catch (err) {
      logger.error(`Failed to sync calendar ${name}:`, err)
      // Could show an error toast here
    }
  }

  // Test data handler
  const handleGenerateTestData = async () => {
    try {
      const count = await generateTestData()
      logger.info(`Generated ${count} test events`)
      
      // Reload events
      await loadEvents()
      
      // Close settings menu
      setIsSettingsOpen(false)
      
      // Show success message (optional - could add a toast notification)
      // Successfully generated test events
    } catch (error) {
      logger.error('Failed to generate test data:', error)
      // Error generating test data
    }
  }

  const handleClearTestData = async () => {
    try {
      // Delete all test data events from database
      const testEvents = events.filter(event => event.isTestData)
      
      for (const event of testEvents) {
        await deleteEvent(event.id)
      }
      
      logger.info(`Cleared ${testEvents.length} test events`)
      
      // Reload events
      await loadEvents()
      
      // Close settings menu
      setIsSettingsOpen(false)
      
      // Successfully cleared test data
    } catch (error) {
      logger.error('Failed to clear test data:', error)
      // Error clearing test data
    }
  }

  // Generate month calendar grid (6 weeks x 7 days = 42 days)
  const generateMonthGrid = () => {
    const startOfMonth = selectedDate.startOf('month')
    const startOfGrid = startOfMonth.startOf('week') // Sunday of first week
    const grid = []

    for (let i = 0; i < 42; i++) {
      const day = startOfGrid.add(i, 'day')
      const dayEvents = events.filter((event) => event.day === day.format('YYYY-MM-DD'))
      grid.push({
        date: day,
        isCurrentMonth: day.month() === selectedDate.month(),
        isToday: day.isSame(dayjs(), 'day'),
        events: dayEvents
      })
    }

    return grid
  }

  // Generate week grid (7 days starting from selected date's week start)
  const generateWeekGrid = () => {
    // Start from Monday (add 1 day to Sunday start)
    const startOfWeek = selectedDate.startOf('week').add(1, 'day') // Monday
    const weekDays = []
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.add(i, 'day')
      const dayEvents = events.filter((event) => event.day === day.format('YYYY-MM-DD'))
      weekDays.push({
        date: day,
        isToday: day.isSame(dayjs(), 'day'),
        events: dayEvents
      })
    }
    
    return weekDays // Returns Mon, Tue, Wed, Thu, Fri, Sat, Sun
  }

  const generate3DaysGrid = () => {
    // Generate 3 consecutive days starting from selectedDate
    const threeDays = []
    
    for (let i = 0; i < 3; i++) {
      const day = selectedDate.add(i, 'day')
      const dayEvents = events.filter((event) => event.day === day.format('YYYY-MM-DD'))
      threeDays.push({
        date: day,
        isToday: day.isSame(dayjs(), 'day'),
        events: dayEvents
      })
    }
    
    return threeDays
  }

  return (
    <>
      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        eventType={selectedEventType}
      />

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={!!confirmDelete}
          title='Delete Calendar'
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          confirmLabel='Delete'
          onConfirm={handleDeleteSubscription}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Error notification */}
      {error && (
        <div className='error-notification' role='alert' aria-live='assertive'>
          <Icon name='alertCircle' />
          <span>{error}</span>
          <button
            type='button'
            className='error-notification__close'
            onClick={() => setError('')}
            aria-label='Dismiss error notification'
          >
            <Icon name='x' />
          </button>
        </div>
      )}

      <div className='card'>
        <div className='card-h'>
          {/* Button groups for clear visual hierarchy - Industry standard UX */}
          
          {/* Left: Navigation Group */}
          <div className='button-group nav-group'>
            <button
              className='btn btn-icon'
              onClick={goToPrevious}
              aria-label={`Previous ${viewMode}`}
              title={`Previous ${viewMode}`}
            >
              <Icon name='chevronLeft' />
            </button>
            <button
              className='btn btn-today'
              onClick={goToToday}
              aria-label='Go to today'
              title='Go to today'
            >
              {viewMode === 'month'
                ? selectedDate.format('MMMM YYYY')
                : viewMode === '3days'
                  ? `${selectedDate.format('MMM D')} - ${selectedDate.add(2, 'day').format('MMM D, YYYY')}`
                  : selectedDate.isSame(dayjs(), 'day')
                    ? `Today · ${selectedDate.format('DD/MM/YYYY')}`
                    : selectedDate.format('DD/MM/YYYY')}
            </button>
            <button
              className='btn btn-icon'
              onClick={goToNext}
              aria-label={`Next ${viewMode}`}
              title={`Next ${viewMode}`}
            >
              <Icon name='chevronRight' />
            </button>
          </div>

          {/* Center-Left: Action Group */}
          <div className='button-group action-group'>
            {/* Calendars button - desktop only */}
            <button
              className={`btn btn-calendars ${showCalendars ? 'btn-active' : ''}`}
              onClick={handleToggleCalendars}
              aria-label='Manage calendar subscriptions'
              aria-pressed={showCalendars}
            >
              <Icon name='calendar' /> Calendars
            </button>
            
            {/* Unified dropdown for scheduling all event types */}
            <div className='schedule-dropdown'>
              <button
                className='btn'
                onClick={(e) => {
                  if (e.detail !== 0) {
                    toggleDropdown(e)
                  }
                }}
                onKeyDown={(e) => {
                  const key = e.key
                  if (key === 'Enter' || key === ' ') {
                    e.preventDefault()
                    toggleDropdown(e)
                  }
                }}
                aria-label='Schedule an event'
                aria-expanded={isDropdownOpen}
                aria-haspopup='menu'
              >
                <Icon name='plus' /> Schedule <Icon name='chevronDown' />
              </button>
              {isDropdownOpen && (
                <div className='schedule-dropdown-menu' role='menu'>
                  <button
                    className='schedule-dropdown-item'
                    role='menuitem'
                    onClick={() => handleAddEvent(EVENT_TYPES.ROUTINE)}
                    aria-label='Schedule a routine'
                  >
                    <Icon name='repeat' /> Routine
                  </button>
                  <button
                    className='schedule-dropdown-item'
                    role='menuitem'
                    onClick={() => handleAddEvent(EVENT_TYPES.TASK)}
                    aria-label='Schedule a task'
                  >
                    <Icon name='checkCircle' /> Task
                  </button>
                  <button
                    className='schedule-dropdown-item'
                    role='menuitem'
                    onClick={() => handleAddEvent(EVENT_TYPES.MEETING)}
                    aria-label='Schedule a meeting'
                  >
                    <Icon name='users' /> Meeting
                  </button>
                  <button
                    className='schedule-dropdown-item'
                    role='menuitem'
                    onClick={() => handleAddEvent(EVENT_TYPES.HABIT)}
                    aria-label='Schedule a habit'
                  >
                    <Icon name='target' /> Habit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: View Mode + Settings Group */}
          <div className='button-group settings-group'>
            {/* View Mode Dropdown */}
            <div className='view-mode-dropdown'>
              <button
                className='btn btn-view-mode'
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                aria-label='Change view mode'
                aria-expanded={isViewDropdownOpen}
                aria-haspopup='menu'
              >
                {viewMode === 'day' && '1 Day'}
                {viewMode === '3days' && '3 Days'}
                {viewMode === 'week' && '1 Week'}
                {viewMode === 'month' && '1 Month'}
                <Icon name='chevronDown' />
              </button>
              {isViewDropdownOpen && (
                <div className='view-dropdown-menu' role='menu'>
                  <button
                    className={`view-dropdown-item ${viewMode === 'day' ? 'active' : ''}`}
                    role='menuitem'
                    onClick={() => {
                      handleViewModeChange('day')
                      setIsViewDropdownOpen(false)
                    }}
                    aria-label='View 1 day'
                  >
                    1 Day
                  </button>
                  <button
                    className={`view-dropdown-item ${viewMode === '3days' ? 'active' : ''}`}
                    role='menuitem'
                    onClick={() => {
                      handleViewModeChange('3days')
                      setIsViewDropdownOpen(false)
                    }}
                    aria-label='View 3 days'
                  >
                    3 Days
                  </button>
                  <button
                    className={`view-dropdown-item ${viewMode === 'week' ? 'active' : ''}`}
                    role='menuitem'
                    onClick={() => {
                      handleViewModeChange('week')
                      setIsViewDropdownOpen(false)
                    }}
                    aria-label='View 1 week'
                  >
                    1 Week
                  </button>
                  <button
                    className={`view-dropdown-item ${viewMode === 'month' ? 'active' : ''}`}
                    role='menuitem'
                    onClick={() => {
                      handleViewModeChange('month')
                      setIsViewDropdownOpen(false)
                    }}
                    aria-label='View 1 month'
                  >
                    1 Month
                  </button>
                </div>
              )}
            </div>
            
            {/* Settings button with dropdown */}
            <div className='settings-dropdown'>
              <button
                className='btn btn-icon btn-settings'
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                aria-label='Settings'
                aria-expanded={isSettingsOpen}
                title='Settings'
              >
                <Icon name='settings' />
              </button>
              {isSettingsOpen && (
                <div className='settings-dropdown-menu'>
                  <button
                    onClick={() => {
                      setShowCalendars(!showCalendars)
                      setIsSettingsOpen(false)
                    }}
                    aria-label='Manage calendars'
                  >
                    <Icon name='calendar' /> Calendars
                  </button>
                  <button
                    onClick={() => {
                      setShow24Hours(!show24Hours)
                      setIsSettingsOpen(false)
                    }}
                    aria-label='Toggle 24-hour display'
                    title={show24Hours ? 'Switch to 7am-midnight view' : 'Switch to 24-hour view'}
                  >
                    🕐 {show24Hours ? 'Switch to 7am-midnight' : 'Switch to 24 Hours'}
                  </button>
                  <button
                    onClick={handleGenerateTestData}
                    aria-label='Generate test data'
                    title='Populate schedule with sample events'
                  >
                    🎨 Generate Test Data
                  </button>
                  <button
                    onClick={handleClearTestData}
                    aria-label='Clear test data'
                    title='Remove all test events from schedule'
                  >
                    🗑️ Clear Test Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className='card-b layout-schedule'>
          {isLoading && (
            <div className='loading-indicator' role='status' aria-live='polite'>
              <span>Loading schedule...</span>
            </div>
          )}
          <aside className='sidebar'>
            {/* Calendar Subscriptions Section */}
            {showCalendars && (
              <div className='card'>
                <div className='card-h'>
                  <strong>Calendars</strong>
                  <button
                    className='btn btn-sm'
                    onClick={() => setShowAddForm(!showAddForm)}
                    aria-label={showAddForm ? 'Cancel add calendar' : 'Add calendar'}
                  >
                    <Icon name={showAddForm ? 'x' : 'plus'} />
                  </button>
                </div>
                <div className='card-b'>
                  {subsLoading ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-dimmed)' }}>
                      Loading...
                    </div>
                  ) : (
                    <>
                      {/* Add Form */}
                      {showAddForm && (
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                          <input
                            type='text'
                            placeholder='Calendar name'
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', marginBottom: '8px' }}
                            className='input'
                          />
                          <input
                            type='url'
                            placeholder='Calendar URL (iCal/ics)'
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            style={{ width: '100%', marginBottom: '8px' }}
                            className='input'
                          />
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type='color'
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              style={{ width: '40px', height: '32px' }}
                            />
                            <button
                              className='btn btn-primary'
                              onClick={handleAddSubscription}
                              style={{ flex: 1 }}
                            >
                              Add Calendar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Subscriptions List */}
                      {subscriptions.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-dimmed)' }}>
                          No calendars yet. Click + to add one.
                        </div>
                      ) : (
                        <div className='list'>
                          {subscriptions.map((sub) => (
                            <div key={sub.id} className='list-row' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: sub.color,
                                  flexShrink: 0
                                }}
                              />
                              <input
                                type='checkbox'
                                checked={sub.enabled}
                                onChange={() => handleToggleSubscription(sub.id, sub.enabled)}
                                aria-label={`Toggle ${sub.name}`}
                              />
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sub.name}
                              </span>
                              <button
                                className='btn btn-sm btn-icon'
                                onClick={() => handleSyncSubscription(sub.id, sub.name)}
                                aria-label={`Sync ${sub.name}`}
                                title='Sync calendar'
                              >
                                <Icon name='refresh' />
                              </button>
                              <button
                                className='btn btn-sm btn-icon'
                                onClick={() => setConfirmDelete({ id: sub.id, name: sub.name })}
                                aria-label={`Delete ${sub.name}`}
                                title='Delete calendar'
                              >
                                <Icon name='trash' />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </aside>
          <section>
            {viewMode === 'month' ? (
              /* Month View */
              <div className='calendar month-view'>
                <div className='month-grid'>
                  {/* Day headers */}
                  <div className='month-header'>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className='month-day-header'>
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Date cells */}
                  <div className='month-body'>
                    {generateMonthGrid().map((cell, index) => (
                      <div
                        key={index}
                        className={`month-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}`}
                        onClick={() => {
                          setSelectedDate(cell.date)
                          setViewMode('day')
                        }}
                        role='button'
                        tabIndex={0}
                        aria-label={`${cell.date.format('MMMM D, YYYY')}${cell.events.length > 0 ? `, ${cell.events.length} event${cell.events.length > 1 ? 's' : ''}` : ''}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedDate(cell.date)
                            setViewMode('day')
                          }
                        }}
                      >
                        <div className='month-cell-date'>{cell.date.format('D')}</div>
                        {cell.events.length > 0 && (
                          <div className='month-cell-events'>
                            {cell.events.slice(0, 3).map((event, idx) => (
                              <div key={idx} className={`month-event ${event.type}`}>
                                {event.title}
                              </div>
                            ))}
                            {cell.events.length > 3 && (
                              <div className='month-event-more'>
                                +{cell.events.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : viewMode === 'week' || viewMode === '3days' ? (
              /* Week View or 3 Days View - 7 or 3 columns for each day */
              <div className={`calendar ${viewMode === 'week' ? 'week-view' : 'threeday-view'}`}>
                <div className={viewMode === 'week' ? 'week-grid' : 'threeday-grid'}>
                  {/* Day headers */}
                  <div className={viewMode === 'week' ? 'week-header' : 'threeday-header'}>
                    {/* Empty cell for hour column - aligns with hours below */}
                    <div className='week-header-spacer'></div>
                    {/* Day headers */}
                    {(viewMode === 'week' ? generateWeekGrid() : generate3DaysGrid()).map((day, index) => (
                      <div key={index} className={`week-day-header ${day.isToday ? 'today' : ''}`}>
                        <div className='week-day-name'>{day.date.format('ddd')}</div>
                        <div className='week-day-date'>{day.date.format('D')}</div>
                      </div>
                    ))}
                  </div>
                  {/* Week/3-day grid body with time slots */}
                  <div className={viewMode === 'week' ? 'week-body' : 'threeday-body'}>
                    {/* Hour labels column */}
                    <div className='week-hours'>
                      {generateHourLabels(show24Hours).map((hour, index) => (
                        <div 
                          key={index} 
                          className={`week-hour ${hour.isLabel ? 'time-period-label' : ''}`}
                        >
                          {hour.label}
                        </div>
                      ))}
                    </div>
                    {/* Day columns */}
                    {(viewMode === 'week' ? generateWeekGrid() : generate3DaysGrid()).map((day, dayIndex) => (
                      <div key={dayIndex} className='week-day-column'>
                        <div className='week-slots' style={{ height: `${slotHeight}px`, position: 'relative' }}>
                          {/* Time period backgrounds */}
                          {timePeriods.map((period) => (
                            <div
                              key={period.className}
                              className={period.className}
                              style={{
                                position: 'absolute',
                                top: `${period.top}px`,
                                left: '0',
                                right: '0',
                                height: `${period.height}px`
                              }}
                              aria-hidden='true'
                            />
                          ))}
                          
                          {/* Current time indicator - only show on today's column */}
                          {day.isToday && currentTimePosition > 0 && (
                            <div
                              className='current-time-indicator'
                              style={{ top: `${currentTimePosition}px` }}
                              aria-label='Current time'
                            >
                              <span className='current-time-label'>Now</span>
                            </div>
                          )}
                          
                          {/* Events for this day */}
                          {day.events.map((event, eventIndex) => {
                            const hours = getScheduleHours(show24Hours)
                            const eventStart = new Date(`2000-01-01T${event.startTime}`)
                            const eventEnd = new Date(`2000-01-01T${event.endTime}`)
                            const startHour = eventStart.getHours()
                            const startMinute = eventStart.getMinutes()
                            const endHour = eventEnd.getHours()
                            const endMinute = eventEnd.getMinutes()

                            const pixelsPerHour = getHourHeight() // Get dynamic hour height
                            
                            let eventTop
                            if (show24Hours) {
                              // 24-hour mode: direct calculation, no label rows
                              eventTop =
                                (startHour - hours.start) * pixelsPerHour +
                                (startMinute / MINUTES_PER_HOUR) * pixelsPerHour +
                                SCHEDULE_VERTICAL_OFFSET
                            } else {
                              // 7am-midnight mode: use visual row mapping to account for label rows
                              const visualRow = getVisualRowForHour(startHour)
                              // Calculate position within the hour based on minutes
                              const minuteOffset = (startMinute / MINUTES_PER_HOUR) * pixelsPerHour
                              eventTop = visualRow * pixelsPerHour + minuteOffset + SCHEDULE_VERTICAL_OFFSET
                            }

                            const durationMinutes =
                              (endHour - startHour) * MINUTES_PER_HOUR + (endMinute - startMinute)
                            const eventHeight = (durationMinutes / MINUTES_PER_HOUR) * pixelsPerHour

                            return (
                              <ScheduleBlock
                                key={eventIndex}
                                type={event.type}
                                title={event.title}
                                time={`${event.startTime}–${event.endTime}`}
                                top={eventTop}
                                height={eventHeight}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Day View */
              <div className='calendar'>
              <div className='hours'>
                <div className='hour-col'>
                  {generateHourLabels(show24Hours).map((hour, index) => (
                    <div 
                      key={index} 
                      className={`h ${hour.isLabel ? 'time-period-label' : ''}`}
                    >
                      {hour.label}
                    </div>
                  ))}
                </div>
                <div className='slots' style={{ height: `${slotHeight}px` }}>
                  {/* Time period backgrounds */}
                  {timePeriods.map((period) => (
                    <div
                      key={period.className}
                      className={period.className}
                      style={{
                        position: 'absolute',
                        top: `${period.top}px`,
                        left: '0',
                        right: '0',
                        height: `${period.height}px`
                      }}
                      aria-hidden='true'
                    />
                  ))}

                  {/* Time period separators */}
                  {separatorPositions.map((position) => (
                    <div
                      key={`separator-${position}`}
                      className='time-period-separator'
                      style={{ top: `${position}px` }}
                      aria-hidden='true'
                    />
                  ))}

                  {/* Current time indicator */}
                  {currentTimePosition > 0 && (
                    <div
                      className='current-time-indicator'
                      style={{ top: `${currentTimePosition}px` }}
                      aria-label='Current time'
                    >
                      <span className='current-time-label'>Now</span>
                    </div>
                  )}

                  {/* Dynamic events from database */}
                  {/* Note: User event interactions are logged (event ID only) for debugging purposes.
                       See PRIVACY.md for detailed information about our logging practices and data handling. */}
                  {events.reduce((acc, event) => {
                    // Filter out invalid events with proper ID validation
                    // Allow ID >= 0 (0 can be valid in some database systems)
                    const hasValidId =
                      typeof event?.id === 'number' &&
                      Number.isFinite(event.id) &&
                      event.id >= 0

                    if (
                      !event ||
                      !event.startTime ||
                      !event.endTime ||
                      !event.title ||
                      !hasValidId
                    ) {
                      return acc
                    }

                    // Get dynamic schedule hours based on display mode
                    const hours = getScheduleHours(show24Hours)

                    // Compute layout metrics once per event (performance optimization)
                    const top = timeToPosition(event.startTime, hours.start, hours.end, show24Hours)
                    const height = durationToHeight(
                      event.startTime,
                      event.endTime
                    )

                    // Filter out events completely outside schedule range
                    if (top < 0 || height <= 0) {
                      return acc
                    }

                    // Calculate start time for all pre-event activities (travel + preparation)
                    // This represents when the user needs to start preparing/traveling for the event
                    const prepStartTime = subtractDuration(
                      event.startTime,
                      event.preparationTime || 0
                    )

                    // Render preparation time block if present
                    if (event.preparationTime && event.preparationTime > 0) {
                      const prepTop = timeToPosition(prepStartTime, hours.start, hours.end, show24Hours)
                      const prepHeight = durationToHeight(
                        prepStartTime,
                        event.startTime
                      )

                      if (prepTop >= 0 && prepHeight > 0) {
                        acc.push(
                          <TimePreparationBlock
                            key={`prep-${event.id}`}
                            type='preparation'
                            top={prepTop}
                            height={prepHeight}
                            time={`${event.preparationTime}m`}
                          />
                        )
                      }
                    }

                    // Render travel time block if present
                    if (event.travelTime && event.travelTime > 0) {
                      const travelStartTime = subtractDuration(
                        prepStartTime,
                        event.travelTime
                      )
                      const travelTop = timeToPosition(travelStartTime, hours.start, hours.end, show24Hours)
                      const travelHeight = durationToHeight(
                        travelStartTime,
                        prepStartTime
                      )

                      if (travelTop >= 0 && travelHeight > 0) {
                        acc.push(
                          <TimePreparationBlock
                            key={`travel-${event.id}`}
                            type='travel'
                            top={travelTop}
                            height={travelHeight}
                            time={`${event.travelTime}m`}
                          />
                        )
                      }
                    }

                    // Render main event block
                    acc.push(
                      <ScheduleBlock
                        key={`dynamic-event-${event.id}`}
                        type={event.type || EVENT_TYPES.TASK}
                        title={event.title}
                        time={`${event.startTime}–${event.endTime}`}
                        top={top}
                        height={height}
                        onClick={() =>
                          // Log interaction for debugging (event ID only, no PII)
                          logger.info('User interacted with schedule event', {
                            id: event.id
                          })
                        }
                      />
                    )
                    return acc
                  }, [])}
                </div>
              </div>
            </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export default Schedule
