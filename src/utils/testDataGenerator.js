/**
 * Test Data Generator for Schedule
 * Generates realistic test events for day, week, and month views
 */

import dayjs from 'dayjs'
import { createEvent } from './scheduleManager'
import { error as logError } from './logger'

/**
 * Generate test events for the current week
 * Creates a realistic week schedule with various event types
 */
export async function generateTestData() {
  // Generating test data for schedule
  
  const today = dayjs()
  
  // Get Monday of the current week (Item 19: ISO 8601 week calculation)
  // ISO 8601: Weeks start on Monday. dayjs weeks start on Sunday (day 0), Monday is day 1.
  // If today is Sunday (day 0), subtract 6 days to get this week's Monday.
  // Otherwise, use dayjs startOf('week') which gives Sunday, then add 1 day to get Monday.
  let startOfWeek
  if (today.day() === 0) {
    // If today is Sunday (day 0), subtract 6 days to get this week's Monday (ISO 8601 week starts on Monday)
    startOfWeek = today.subtract(6, 'day')
  } else {
    // Otherwise, get the Monday of this week
    startOfWeek = today.startOf('week').add(1, 'day')
  }
  
  const testEvents = []
  
  // Generate events for each day of the week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDay = startOfWeek.add(dayOffset, 'day')
    const dayStr = currentDay.format('YYYY-MM-DD')
    const dayName = currentDay.format('dddd')
    
    // Morning routine (every weekday)
    if (dayOffset < 5) { // Monday-Friday
      testEvents.push({
        title: 'Morning Routine',
        type: 'routine',
        day: dayStr,
        startTime: '07:00',
        endTime: '08:00',
        travelTime: 0,
        preparationTime: 0,
        isTestData: true
      })
      
      testEvents.push({
        title: `${dayName} Planning`,
        type: 'task',
        day: dayStr,
        startTime: '08:00',
        endTime: '09:00',
        travelTime: 0,
        preparationTime: 5,
        isTestData: true
      })
    }
    
    // Specific events by day
    switch (dayOffset) {
      case 0: // Monday
        testEvents.push({
          title: 'Team Standup',
          type: 'meeting',
          day: dayStr,
          startTime: '09:00',
          endTime: '09:30',
          travelTime: 0,
          preparationTime: 10,
          isTestData: true
        })
        testEvents.push({
          title: 'Code Review',
          type: 'task',
          day: dayStr,
          startTime: '10:00',
          endTime: '11:30',
          travelTime: 0,
          preparationTime: 5,
          isTestData: true
        })
        testEvents.push({
          title: 'Lunch Break',
          type: 'break',
          day: dayStr,
          startTime: '12:00',
          endTime: '13:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Sprint Planning',
          type: 'meeting',
          day: dayStr,
          startTime: '14:00',
          endTime: '16:00',
          travelTime: 0,
          preparationTime: 15,
          isTestData: true
        })
        testEvents.push({
          title: 'Documentation',
          type: 'task',
          day: dayStr,
          startTime: '16:30',
          endTime: '18:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        break
        
      case 1: // Tuesday
        testEvents.push({
          title: 'Client Meeting',
          type: 'meeting',
          day: dayStr,
          startTime: '10:00',
          endTime: '11:00',
          travelTime: 15,
          preparationTime: 20,
          isTestData: true
        })
        testEvents.push({
          title: 'Feature Development',
          type: 'task',
          day: dayStr,
          startTime: '11:00',
          endTime: '12:30',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Lunch with Team',
          type: 'break',
          day: dayStr,
          startTime: '12:30',
          endTime: '13:30',
          travelTime: 10,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Bug Fixing',
          type: 'task',
          day: dayStr,
          startTime: '14:00',
          endTime: '16:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Design Review',
          type: 'meeting',
          day: dayStr,
          startTime: '16:30',
          endTime: '17:30',
          travelTime: 0,
          preparationTime: 10,
          isTestData: true
        })
        break
        
      case 2: // Wednesday
        testEvents.push({
          title: 'Deep Work Session',
          type: 'task',
          day: dayStr,
          startTime: '09:00',
          endTime: '12:00',
          travelTime: 0,
          preparationTime: 5,
          isTestData: true
        })
        testEvents.push({
          title: 'Lunch Break',
          type: 'break',
          day: dayStr,
          startTime: '12:00',
          endTime: '13:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Architecture Discussion',
          type: 'meeting',
          day: dayStr,
          startTime: '13:00',
          endTime: '14:30',
          travelTime: 0,
          preparationTime: 15,
          isTestData: true
        })
        testEvents.push({
          title: 'Pair Programming',
          type: 'task',
          day: dayStr,
          startTime: '15:00',
          endTime: '17:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Yoga Class',
          type: 'routine',
          day: dayStr,
          startTime: '18:00',
          endTime: '19:00',
          travelTime: 15,
          preparationTime: 10,
          isTestData: true
        })
        break
        
      case 3: // Thursday
        testEvents.push({
          title: 'Coffee & Emails',
          type: 'routine',
          day: dayStr,
          startTime: '09:00',
          endTime: '09:30',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Feature Implementation',
          type: 'task',
          day: dayStr,
          startTime: '09:30',
          endTime: '12:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Team Lunch',
          type: 'break',
          day: dayStr,
          startTime: '12:00',
          endTime: '13:00',
          travelTime: 10,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Testing & QA',
          type: 'task',
          day: dayStr,
          startTime: '13:30',
          endTime: '15:30',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Weekly All-Hands',
          type: 'meeting',
          day: dayStr,
          startTime: '16:00',
          endTime: '17:00',
          travelTime: 0,
          preparationTime: 5,
          isTestData: true
        })
        break
        
      case 4: // Friday
        testEvents.push({
          title: 'Demo Preparation',
          type: 'task',
          day: dayStr,
          startTime: '09:00',
          endTime: '11:00',
          travelTime: 0,
          preparationTime: 15,
          isTestData: true
        })
        testEvents.push({
          title: 'Sprint Demo',
          type: 'meeting',
          day: dayStr,
          startTime: '11:00',
          endTime: '12:00',
          travelTime: 0,
          preparationTime: 20,
          isTestData: true
        })
        testEvents.push({
          title: 'Lunch Break',
          type: 'break',
          day: dayStr,
          startTime: '12:00',
          endTime: '13:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Sprint Retrospective',
          type: 'meeting',
          day: dayStr,
          startTime: '13:00',
          endTime: '14:30',
          travelTime: 0,
          preparationTime: 10,
          isTestData: true
        })
        testEvents.push({
          title: 'Week Wrap-up',
          type: 'task',
          day: dayStr,
          startTime: '15:00',
          endTime: '16:30',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Happy Hour',
          type: 'break',
          day: dayStr,
          startTime: '17:00',
          endTime: '18:30',
          travelTime: 10,
          preparationTime: 0,
          isTestData: true
        })
        break
        
      case 5: // Saturday
        testEvents.push({
          title: 'Morning Workout',
          type: 'routine',
          day: dayStr,
          startTime: '08:00',
          endTime: '09:30',
          travelTime: 15,
          preparationTime: 10,
          isTestData: true
        })
        testEvents.push({
          title: 'Grocery Shopping',
          type: 'task',
          day: dayStr,
          startTime: '10:00',
          endTime: '11:30',
          travelTime: 20,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Brunch',
          type: 'break',
          day: dayStr,
          startTime: '12:00',
          endTime: '13:30',
          travelTime: 15,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Side Project',
          type: 'task',
          day: dayStr,
          startTime: '14:00',
          endTime: '17:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Dinner with Friends',
          type: 'break',
          day: dayStr,
          startTime: '19:00',
          endTime: '21:00',
          travelTime: 20,
          preparationTime: 30,
          isTestData: true
        })
        break
        
      case 6: // Sunday
        testEvents.push({
          title: 'Meditation',
          type: 'routine',
          day: dayStr,
          startTime: '09:00',
          endTime: '09:30',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Reading Time',
          type: 'task',
          day: dayStr,
          startTime: '10:00',
          endTime: '12:00',
          travelTime: 0,
          preparationTime: 0,
          isTestData: true
        })
        testEvents.push({
          title: 'Family Lunch',
          type: 'break',
          day: dayStr,
          startTime: '12:30',
          endTime: '14:00',
          travelTime: 25,
          preparationTime: 15,
          isTestData: true
        })
        testEvents.push({
          title: 'Week Planning',
          type: 'task',
          day: dayStr,
          startTime: '15:00',
          endTime: '16:30',
          travelTime: 0,
          preparationTime: 5,
          isTestData: true
        })
        testEvents.push({
          title: 'Meal Prep',
          type: 'routine',
          day: dayStr,
          startTime: '17:00',
          endTime: '19:00',
          travelTime: 0,
          preparationTime: 10,
          isTestData: true
        })
        break
    }
  }
  
  // Create all test events
  let createdCount = 0
  for (const event of testEvents) {
    try {
      await createEvent(event)
      createdCount++
    } catch (error) {
      // Log error for debugging - test data generation is not critical
      logError('Failed to create test event:', error)
    }
  }
  
  // Created test events successfully
  return createdCount
}
