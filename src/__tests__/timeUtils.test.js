/**
 * Tests for Time Utilities
 * Comprehensive test coverage for all time/duration functions
 */

import {
  parseTime,
  formatClockTime,
  timeToMinutes,
  minutesToTime,
  calculateDuration,
  addDuration,
  subtractDuration,
  formatDurationDisplay,
  formatDurationVerbose,
  getCurrentTimeHHMM,
  getCurrentTimePlusMinutes
} from '../utils/timeUtils'

describe('timeUtils', () => {
  describe('parseTime', () => {
    test('should parse valid time string', () => {
      expect(parseTime('09:30')).toEqual({ hours: 9, minutes: 30 })
      expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 })
      expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 })
    })

    test('should return null for invalid input', () => {
      expect(parseTime('')).toBeNull()
      expect(parseTime(null)).toBeNull()
      expect(parseTime(undefined)).toBeNull()
      expect(parseTime('invalid')).toBeNull()
    })

    test('should handle numeric strings', () => {
      expect(parseTime('12:45')).toEqual({ hours: 12, minutes: 45 })
    })

    test('should validate hour range (0-23)', () => {
      expect(parseTime('24:00')).toBeNull()
      expect(parseTime('25:30')).toBeNull()
      expect(parseTime('-1:30')).toBeNull()
    })

    test('should validate minute range (0-59)', () => {
      expect(parseTime('12:60')).toBeNull()
      expect(parseTime('12:75')).toBeNull()
      expect(parseTime('12:-5')).toBeNull()
    })

    test('should reject out-of-range values', () => {
      expect(parseTime('24:60')).toBeNull()
      expect(parseTime('99:99')).toBeNull()
    })
  })

  describe('formatClockTime', () => {
    test('should format time with proper padding', () => {
      expect(formatClockTime(9, 30)).toBe('09:30')
      expect(formatClockTime(0, 0)).toBe('00:00')
      expect(formatClockTime(23, 59)).toBe('23:59')
      expect(formatClockTime(1, 5)).toBe('01:05')
    })

    test('should handle edge cases', () => {
      expect(formatClockTime(0, 0)).toBe('00:00')
      expect(formatClockTime(12, 0)).toBe('12:00')
      expect(formatClockTime(0, 30)).toBe('00:30')
    })

    test('should floor decimal values', () => {
      expect(formatClockTime(9.7, 30.9)).toBe('09:30')
    })

    test('should handle negative values', () => {
      // -5 hours -10 minutes = -310 minutes wraps to 18:50 (24*60 - 310 = 1440 - 310 = 1130 minutes = 18:50)
      expect(formatClockTime(-5, -10)).toBe('18:50')
      expect(formatClockTime(-1, 0)).toBe('23:00') // -1 hour wraps to 23:00
    })

    test('should normalize out-of-range hours', () => {
      expect(formatClockTime(24, 0)).toBe('00:00') // 24 hours wraps to 00:00
      expect(formatClockTime(25, 30)).toBe('01:30') // 25:30 wraps to 01:30
      expect(formatClockTime(48, 0)).toBe('00:00') // 48 hours wraps to 00:00
    })

    test('should normalize out-of-range minutes', () => {
      expect(formatClockTime(0, 60)).toBe('01:00') // 60 minutes = 1 hour
      expect(formatClockTime(0, 90)).toBe('01:30') // 90 minutes = 1 hour 30 minutes
      expect(formatClockTime(23, 120)).toBe('01:00') // 23:120 = 25:00 wraps to 01:00
    })

    test('should normalize combined out-of-range values', () => {
      expect(formatClockTime(24, 60)).toBe('01:00') // 24:60 = 25:00 wraps to 01:00
      expect(formatClockTime(23, 90)).toBe('00:30') // 23:90 = 24:30 wraps to 00:30
    })

    test('should handle negative minutes with positive hours', () => {
      expect(formatClockTime(5, -30)).toBe('04:30') // 5:(-30) = 4:30
      expect(formatClockTime(1, -60)).toBe('00:00') // 1:(-60) = 0:00
    })
  })

  describe('timeToMinutes', () => {
    test('should convert time to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0)
      expect(timeToMinutes('01:00')).toBe(60)
      expect(timeToMinutes('09:30')).toBe(570)
      expect(timeToMinutes('23:59')).toBe(1439)
    })

    test('should return 0 for invalid input', () => {
      expect(timeToMinutes('')).toBe(0)
      expect(timeToMinutes(null)).toBe(0)
      expect(timeToMinutes('invalid')).toBe(0)
      expect(timeToMinutes('25:00')).toBe(0) // out-of-range
    })

    test('should return 1440 for end-of-day sentinel "24:00"', () => {
      expect(timeToMinutes('24:00')).toBe(1440)
    })

    test('should trim whitespace around end-of-day sentinel "24:00"', () => {
      expect(timeToMinutes(' 24:00')).toBe(1440)
      expect(timeToMinutes('24:00 ')).toBe(1440)
      expect(timeToMinutes('\t24:00\n')).toBe(1440)
    })
  })

  describe('minutesToTime', () => {
    test('should convert minutes to time', () => {
      expect(minutesToTime(0)).toBe('00:00')
      expect(minutesToTime(60)).toBe('01:00')
      expect(minutesToTime(570)).toBe('09:30')
      expect(minutesToTime(1439)).toBe('23:59')
    })

    test('should handle values over 24 hours', () => {
      expect(minutesToTime(1440)).toBe('00:00') // 24 hours wraps to 00:00
      expect(minutesToTime(1500)).toBe('01:00') // 25 hours wraps to 01:00
    })

    test('should handle negative values', () => {
      // Negative values wrap to previous day
      expect(minutesToTime(-60)).toBe('23:00') // -1 hour from midnight
      expect(minutesToTime(-120)).toBe('22:00') // -2 hours from midnight
    })

    test('should handle decimal values', () => {
      expect(minutesToTime(90.5)).toBe('01:30')
    })

    test('should return 00:00 for non-finite values', () => {
      expect(minutesToTime(NaN)).toBe('00:00')
      expect(minutesToTime(Infinity)).toBe('00:00')
      expect(minutesToTime(-Infinity)).toBe('00:00')
    })
  })

  describe('calculateDuration', () => {
    test('should calculate duration between times', () => {
      expect(calculateDuration('09:00', '10:00')).toBe(60)
      expect(calculateDuration('09:30', '10:00')).toBe(30)
      expect(calculateDuration('08:00', '22:00')).toBe(840)
    })

    test('should handle same start and end time', () => {
      expect(calculateDuration('09:00', '09:00')).toBe(0)
    })

    test('should return negative for end before start', () => {
      expect(calculateDuration('10:00', '09:00')).toBe(-60)
    })

    test('should handle invalid input', () => {
      expect(calculateDuration('', '10:00')).toBe(0)
      expect(calculateDuration('09:00', '')).toBe(0)
      expect(calculateDuration(null, null)).toBe(0)
    })

    test('should return 0 for non-empty invalid strings', () => {
      // Document behavior: invalid strings return 0 instead of treating as 00:00
      expect(calculateDuration('invalid', '10:00')).toBe(0)
      expect(calculateDuration('09:00', 'invalid')).toBe(0)
      expect(calculateDuration('bad', 'input')).toBe(0)
      expect(calculateDuration('25:00', '10:00')).toBe(0) // out-of-range
    })

    test('should match scheduleManager behavior', () => {
      // Test cases from scheduleManager.test.js
      expect(calculateDuration('09:00', '10:00')).toBe(60)
      expect(calculateDuration('14:00', '15:00')).toBe(60)
    })
  })

  describe('addDuration', () => {
    test('should add minutes to time', () => {
      expect(addDuration('09:00', 60)).toBe('10:00')
      expect(addDuration('09:00', 30)).toBe('09:30')
      expect(addDuration('23:00', 120)).toBe('01:00') // Wraps to next day
    })

    test('should handle negative minutes', () => {
      expect(addDuration('10:00', -60)).toBe('09:00')
    })

    test('should handle invalid input', () => {
      expect(addDuration('', 60)).toBe('01:00')
      expect(addDuration(null, 60)).toBe('01:00')
    })

    test('should match scheduleManager addMinutes behavior', () => {
      // Test case from scheduleManager moveEvent test
      expect(addDuration('14:00', 60)).toBe('15:00')
    })
  })

  describe('subtractDuration', () => {
    test('should subtract minutes from time', () => {
      expect(subtractDuration('10:00', 60)).toBe('09:00')
      expect(subtractDuration('09:30', 30)).toBe('09:00')
    })

    test('should handle wrapping to previous day', () => {
      expect(subtractDuration('01:00', 120)).toBe('23:00')
    })
  })

  describe('formatDurationDisplay', () => {
    test('should format seconds to mm:ss', () => {
      expect(formatDurationDisplay(0)).toBe('00:00')
      expect(formatDurationDisplay(30)).toBe('00:30')
      expect(formatDurationDisplay(60)).toBe('01:00')
      expect(formatDurationDisplay(90)).toBe('01:30')
      expect(formatDurationDisplay(462)).toBe('07:42')
    })

    test('should handle negative values', () => {
      expect(formatDurationDisplay(-30)).toBe('-00:30')
      expect(formatDurationDisplay(-90)).toBe('-01:30')
    })

    test('should handle verbose option', () => {
      expect(formatDurationDisplay(66, { verbose: true })).toBe(
        '01:06 remaining'
      )
      expect(formatDurationDisplay(30, { verbose: true })).toBe(
        '00:30 remaining'
      )
    })

    test('should handle invalid input', () => {
      expect(formatDurationDisplay(NaN)).toBe('00:00')
      expect(formatDurationDisplay(null)).toBe('00:00')
      expect(formatDurationDisplay(undefined)).toBe('00:00')
      expect(formatDurationDisplay('invalid')).toBe('00:00')
    })

    test('should floor fractional seconds', () => {
      expect(formatDurationDisplay(90.5)).toBe('01:30')
      expect(formatDurationDisplay(90.9)).toBe('01:30')
      expect(formatDurationDisplay(59.9)).toBe('00:59')
      expect(formatDurationDisplay(0.9)).toBe('00:00')
    })

    test('should match routineRunner formatTime behavior', () => {
      // Test cases from routineRunner.js usage
      expect(formatDurationDisplay(462)).toBe('07:42')
      expect(formatDurationDisplay(66)).toBe('01:06')
      expect(formatDurationDisplay(24)).toBe('00:24')
    })
  })

  describe('formatDurationVerbose', () => {
    test('should format durations under 60 minutes', () => {
      expect(formatDurationVerbose(60)).toBe('1m')
      expect(formatDurationVerbose(1800)).toBe('30m')
      expect(formatDurationVerbose(3540)).toBe('59m')
    })

    test('should format durations with hours', () => {
      expect(formatDurationVerbose(3600)).toBe('1h')
      expect(formatDurationVerbose(5400)).toBe('1h 30m')
      expect(formatDurationVerbose(7200)).toBe('2h')
      expect(formatDurationVerbose(7260)).toBe('2h 1m')
    })

    test('should handle zero and null', () => {
      expect(formatDurationVerbose(0)).toBeNull()
      expect(formatDurationVerbose(null)).toBeNull()
    })

    test('should match TemplateCard formatDuration behavior', () => {
      // Test cases from TemplateCard.jsx
      expect(formatDurationVerbose(1800)).toBe('30m') // 30 minutes
      expect(formatDurationVerbose(3600)).toBe('1h') // 1 hour
      expect(formatDurationVerbose(5400)).toBe('1h 30m') // 1.5 hours
    })
  })

  describe('getCurrentTimeHHMM', () => {
    test('should return current time in HH:MM format', () => {
      const result = getCurrentTimeHHMM()

      // Validate format
      expect(result).toMatch(/^\d{2}:\d{2}$/)

      // Parse and validate ranges
      const [hours, minutes] = result.split(':').map(Number)
      expect(hours).toBeGreaterThanOrEqual(0)
      expect(hours).toBeLessThan(24)
      expect(minutes).toBeGreaterThanOrEqual(0)
      expect(minutes).toBeLessThan(60)
    })

    test('should return valid time string that can be parsed', () => {
      const result = getCurrentTimeHHMM()
      const parsed = parseTime(result)

      expect(parsed).not.toBeNull()
      expect(parsed.hours).toBeGreaterThanOrEqual(0)
      expect(parsed.hours).toBeLessThan(24)
      expect(parsed.minutes).toBeGreaterThanOrEqual(0)
      expect(parsed.minutes).toBeLessThan(60)
    })

    test('should have proper zero padding', () => {
      const result = getCurrentTimeHHMM()
      const [hours, minutes] = result.split(':')

      // Both parts should be exactly 2 characters
      expect(hours).toHaveLength(2)
      expect(minutes).toHaveLength(2)
    })
  })

  describe('getCurrentTimePlusMinutes', () => {
    test('should add minutes to current time', () => {
      const result = getCurrentTimePlusMinutes(30)

      // Validate format
      expect(result).toMatch(/^\d{2}:\d{2}$/)

      // Parse and validate ranges
      const parsed = parseTime(result)
      expect(parsed).not.toBeNull()
      expect(parsed.hours).toBeGreaterThanOrEqual(0)
      expect(parsed.hours).toBeLessThan(24)
      expect(parsed.minutes).toBeGreaterThanOrEqual(0)
      expect(parsed.minutes).toBeLessThan(60)
    })

    test('should handle zero minutes', () => {
      const result = getCurrentTimePlusMinutes(0)

      // Should be approximately the same time (within a minute due to test execution time)
      expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    test('should clamp to 23:59 when adding minutes would exceed midnight', () => {
      // Use fake timers to set a specific time
      jest.useFakeTimers()

      try {
        jest.setSystemTime(new Date(2024, 0, 15, 23, 30, 0, 0))

        const result = getCurrentTimePlusMinutes(60)

        // Should be clamped to 23:59, not wrap to 00:30
        expect(result).toBe('23:59')
      } finally {
        jest.useRealTimers()
      }
    })

    test('should handle midnight boundary correctly for smaller additions', () => {
      // Use fake timers to set a specific time
      jest.useFakeTimers()

      try {
        jest.setSystemTime(new Date(2024, 0, 15, 23, 45, 0, 0))

        const result = getCurrentTimePlusMinutes(30)

        // 23:45 + 30 = 24:15, should clamp to 23:59
        expect(result).toBe('23:59')
      } finally {
        jest.useRealTimers()
      }
    })

    test('should not clamp when staying within same day', () => {
      // Use fake timers to set a specific time
      jest.useFakeTimers()

      try {
        jest.setSystemTime(new Date(2024, 0, 15, 10, 0, 0, 0))

        const result = getCurrentTimePlusMinutes(90)

        // 10:00 + 90 = 11:30, should not be clamped
        expect(result).toBe('11:30')
      } finally {
        jest.useRealTimers()
      }
    })

    test('should handle negative minutes', () => {
      // Use fake timers to set a specific time
      jest.useFakeTimers()

      try {
        jest.setSystemTime(new Date(2024, 0, 15, 10, 0, 0, 0))

        const result = getCurrentTimePlusMinutes(-30)

        // 10:00 - 30 = 09:30
        expect(result).toBe('09:30')
      } finally {
        jest.useRealTimers()
      }
    })

    test('should produce parseable time strings', () => {
      const result = getCurrentTimePlusMinutes(45)
      const parsed = parseTime(result)

      expect(parsed).not.toBeNull()
    })
  })

  describe('integration tests', () => {
    test('should round-trip time conversions', () => {
      const testTimes = ['00:00', '09:30', '12:00', '23:59']

      testTimes.forEach((time) => {
        const minutes = timeToMinutes(time)
        const converted = minutesToTime(minutes)
        expect(converted).toBe(time)
      })
    })

    test('should handle duration calculations consistently', () => {
      const start = '09:00'
      const duration = 90 // 1.5 hours

      const end = addDuration(start, duration)
      expect(end).toBe('10:30')

      const calculatedDuration = calculateDuration(start, end)
      expect(calculatedDuration).toBe(duration)

      const backToStart = subtractDuration(end, duration)
      expect(backToStart).toBe(start)
    })

    test('should handle complex time arithmetic', () => {
      // Add multiple durations
      let time = '08:00'
      time = addDuration(time, 30) // 08:30
      time = addDuration(time, 45) // 09:15
      time = addDuration(time, 90) // 10:45

      expect(time).toBe('10:45')
    })
  })
})
