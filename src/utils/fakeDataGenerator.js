/**
 * Fake Data Generator - Development Only
 * Generates realistic fake events for testing calendar UI
 */

import { addDays, addMinutes, setHours, setMinutes, format } from 'date-fns'
import { EVENT_TYPES } from './scheduleConstants'

/**
 * Event templates with realistic titles for different types and times of day
 */
const EVENT_TEMPLATES = {
  morning: {
    routine: [
      'Morning Routine',
      'Exercise',
      'Meditation',
      'Breakfast Prep',
      'Morning Walk',
      'Yoga Session'
    ],
    task: [
      'Email Review',
      'Daily Planning',
      'Check Messages',
      'Review Calendar',
      'Priority Tasks'
    ],
    meeting: [
      'Team Standup',
      'Morning Sync',
      'Strategy Session',
      'Client Call',
      'Weekly Planning'
    ],
    habit: [
      'Morning Pages',
      'Gratitude Journal',
      'Reading Time',
      'Learning Session'
    ]
  },
  afternoon: {
    routine: ['Lunch Break', 'Afternoon Walk', 'Coffee Break', 'Quick Stretch'],
    task: [
      'Project Work Session',
      'Code Review',
      'Documentation',
      'Research',
      'Design Work',
      'Bug Fixes',
      'Feature Development'
    ],
    meeting: [
      'Team Meeting',
      '1-on-1 Check-in',
      'Project Review',
      'Client Presentation',
      'Brainstorming Session',
      'Sprint Planning'
    ],
    habit: ['Hydration Check', 'Posture Reset', 'Quick Walk', 'Eye Break']
  },
  evening: {
    routine: [
      'Gym Workout',
      'Dinner Prep',
      'Evening Wind Down',
      'Skincare Routine',
      'Night Routine'
    ],
    task: [
      'Personal Project',
      'Learning Time',
      'Creative Work',
      'Home Tasks',
      'Weekly Review'
    ],
    meeting: [
      'Study Group',
      'Social Call',
      'Club Meeting',
      'Online Class',
      'Coaching Session'
    ],
    habit: [
      'Evening Reading',
      'Journaling',
      'Reflection Time',
      'Relaxation',
      'Stretching'
    ]
  }
}

/**
 * Get time period based on hour (morning/afternoon/evening)
 */
function getTimePeriod(hour) {
  if (hour >= 7 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

/**
 * Get random item from array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Get random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random event for a specific day and time
 */
function generateEvent(baseDate, hour, minute = 0) {
  const startTime = setMinutes(setHours(baseDate, hour), minute)
  
  // Random duration: 30min, 1hr, 1.5hr, 2hr, or 3hr
  const durations = [30, 60, 90, 120, 180]
  const duration = randomItem(durations)
  const endTime = addMinutes(startTime, duration)
  
  // Determine time period and get appropriate templates
  const period = getTimePeriod(hour)
  
  // Random event type (weighted towards tasks and routines)
  const typeWeights = [
    EVENT_TYPES.ROUTINE,
    EVENT_TYPES.ROUTINE,
    EVENT_TYPES.TASK,
    EVENT_TYPES.TASK,
    EVENT_TYPES.TASK,
    EVENT_TYPES.MEETING,
    EVENT_TYPES.MEETING,
    EVENT_TYPES.HABIT
  ]
  const type = randomItem(typeWeights)
  
  // Get title from templates
  const templates = EVENT_TEMPLATES[period][type] || EVENT_TEMPLATES[period].task
  const title = randomItem(templates)
  
  // Add some variation to repeated titles
  const suffix = Math.random() > 0.7 ? ` ${randomInt(1, 3)}` : ''
  
  return {
    title: title + suffix,
    type,
    day: format(startTime, 'yyyy-MM-dd'), // Single day field as per data model
    startTime: format(startTime, 'HH:mm'),
    endTime: format(endTime, 'HH:mm'),
    description: `Auto-generated ${type} for testing`,
    travelTime: type === EVENT_TYPES.MEETING ? randomInt(0, 15) : 0,
    preparationTime: [EVENT_TYPES.MEETING, EVENT_TYPES.ROUTINE].includes(type)
      ? randomInt(0, 15)
      : 0
  }
}

/**
 * Generate fake events for current week + next week
 * @param {Date} baseDate - Starting date (defaults to today)
 * @param {number} daysCount - Number of days to generate events for
 * @returns {Array} Array of fake event objects
 */
export function generateFakeEvents(baseDate = new Date(), daysCount = 14) {
  const events = []
  
  // Generate events for each day
  for (let day = 0; day < daysCount; day++) {
    const currentDate = addDays(baseDate, day)
    
    // Skip weekends (5-6, Saturday-Sunday) for some variety
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Fewer events on weekends
    const eventCount = isWeekend ? randomInt(1, 3) : randomInt(3, 5)
    
    // Generate random events throughout the day
    const usedHours = new Set()
    
    for (let i = 0; i < eventCount; i++) {
      // Random hour between 7 AM and 8 PM
      let hour
      let attempts = 0
      do {
        hour = randomInt(7, 20)
        attempts++
      } while (usedHours.has(hour) && attempts < 20)
      
      if (attempts >= 20) continue // Skip if can't find free slot
      
      usedHours.add(hour)
      
      // Random minute (0, 15, 30, or 45)
      const minute = randomItem([0, 15, 30, 45])
      
      events.push(generateEvent(currentDate, hour, minute))
    }
  }
  
  return events
}

/**
 * Generate a smaller set of events for quick testing (today only)
 */
export function generateQuickFakeEvents(baseDate = new Date()) {
  return generateFakeEvents(baseDate, 1)
}
