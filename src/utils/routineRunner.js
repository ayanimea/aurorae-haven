// Routine Runner - Timer and execution state management
// Handles step progression, timer countdown, XP calculation, and logging

import { formatDurationDisplay } from './timeUtils'

/**
 * Calculate XP for completing a step
 * TAB-RTN-22: Base step XP = 1
 * TAB-RTN-23: On-time bonus = +1 XP if completed with time remaining
 * @param {boolean} completedOnTime - Whether step completed before timer expired
 * @returns {number} XP earned (1 or 2)
 */
export function calculateStepXP(completedOnTime) {
  const baseXP = 1 // TAB-RTN-22
  const onTimeBonus = completedOnTime ? 1 : 0 // TAB-RTN-23
  return baseXP + onTimeBonus
}

/**
 * Calculate routine completion bonus
 * TAB-RTN-25: 2 XP + floor(total_steps / 5), capped at +4 XP
 * Example: 1-5 steps = +2 XP, 6-10 steps = +3 XP, 11-15 steps = +4 XP
 * Formula adjusted to match examples: 2 + floor((steps - 1) / 5)
 * @param {number} totalSteps - Total number of steps in routine
 * @returns {number} Completion bonus XP (2-4)
 */
export function calculateRoutineBonus(totalSteps) {
  if (totalSteps <= 0) return 0
  const baseBonus = 2
  const additionalBonus = Math.floor((totalSteps - 1) / 5)
  const total = baseBonus + additionalBonus
  return Math.min(total, 4)
}

/**
 * Calculate perfect routine bonus
 * TAB-RTN-26: +2 XP if all steps completed on-time
 * @param {Array} completedSteps - Array of completed step logs
 * @returns {number} Perfect bonus XP (0 or 2)
 */
export function calculatePerfectBonus(completedSteps) {
  const allOnTime = completedSteps.every((step) => step.completedOnTime)
  return allOnTime && completedSteps.length > 0 ? 2 : 0
}

/**
 * Calculate total XP for a routine run
 * @param {Array} completedSteps - Array of completed step logs
 * @param {number} totalSteps - Total steps in routine
 * @returns {Object} XP breakdown
 */
export function calculateTotalXP(completedSteps, totalSteps) {
  const stepXP = completedSteps.reduce((sum, step) => {
    return sum + (step.xp || 0)
  }, 0)

  const routineBonus = calculateRoutineBonus(totalSteps)
  const perfectBonus = calculatePerfectBonus(completedSteps)

  return {
    stepXP,
    routineBonus,
    perfectBonus,
    total: stepXP + routineBonus + perfectBonus
  }
}

/**
 * Format seconds to mm:ss
 * @param {number} seconds - Time in seconds
 * @param {Object} options - Formatting options
 * @param {boolean} options.verbose - If true, return with "mm:ss remaining" suffix
 * @returns {string} Formatted time string
 * @deprecated Use formatDurationDisplay from timeUtils instead
 */
export function formatTime(seconds, options = {}) {
  // Delegate to centralized time utility
  return formatDurationDisplay(seconds, options)
}

/**
 * Create initial routine runner state
 * @param {Object} routine - Routine data
 * @returns {Object} Initial runner state
 */
export function createRunnerState(routine) {
  return {
    routineId: routine.id,
    routine,
    currentStepIndex: 0,
    isRunning: false,
    isPaused: false,
    remainingSeconds: routine.steps[0]?.duration || 0,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedTime: 0,
    completedSteps: [],
    skippedSteps: [],
    logs: []
  }
}

/**
 * Advance to next step
 * @param {Object} state - Current runner state
 * @returns {Object} Updated state
 */
export function advanceStep(state) {
  const nextIndex = state.currentStepIndex + 1
  const hasNextStep = nextIndex < state.routine.steps.length

  if (!hasNextStep) {
    // Routine complete
    return {
      ...state,
      isRunning: false,
      currentStepIndex: nextIndex
    }
  }

  return {
    ...state,
    currentStepIndex: nextIndex,
    remainingSeconds: state.routine.steps[nextIndex].duration,
    isPaused: false
  }
}

/**
 * Complete current step
 * TAB-RTN-13: Mark done, log timestamp/duration, award XP, advance
 * @param {Object} state - Current runner state
 * @returns {Object} Updated state
 */
export function completeStep(state) {
  const currentStep = state.routine.steps[state.currentStepIndex]
  const now = Date.now()
  const completedOnTime = state.remainingSeconds > 0
  const xp = calculateStepXP(completedOnTime)

  const stepLog = {
    stepIndex: state.currentStepIndex,
    stepLabel: currentStep.label,
    status: 'completed',
    completedOnTime,
    xp,
    completedAt: now,
    plannedDuration: currentStep.duration,
    actualDuration: currentStep.duration - state.remainingSeconds
  }

  return advanceStep({
    ...state,
    completedSteps: [
      ...state.completedSteps,
      { ...stepLog, completedOnTime, xp }
    ],
    logs: [...state.logs, stepLog]
  })
}

/**
 * Skip current step
 * TAB-RTN-14: Mark skipped (no XP), advance, log reason
 * @param {Object} state - Current runner state
 * @param {string} reason - Optional skip reason
 * @returns {Object} Updated state
 */
export function skipStep(state, reason = '') {
  const currentStep = state.routine.steps[state.currentStepIndex]
  const now = Date.now()

  const stepLog = {
    stepIndex: state.currentStepIndex,
    stepLabel: currentStep.label,
    status: 'skipped',
    reason,
    skippedAt: now,
    plannedDuration: currentStep.duration
  }

  return advanceStep({
    ...state,
    skippedSteps: [...state.skippedSteps, stepLog],
    logs: [...state.logs, stepLog]
  })
}

/**
 * Pause/Resume routine
 * TAB-RTN-15: Freeze/unfreeze countdown
 * @param {Object} state - Current runner state
 * @returns {Object} Updated state
 */
export function togglePause(state) {
  const now = Date.now()

  if (state.isPaused) {
    // Resume
    const pauseDuration = now - state.pausedAt
    return {
      ...state,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: state.totalPausedTime + pauseDuration
    }
  } else {
    // Pause
    return {
      ...state,
      isPaused: true,
      pausedAt: now
    }
  }
}

/**
 * Update timer tick
 * @param {Object} state - Current runner state
 * @returns {Object} Updated state with decremented timer
 */
export function tickTimer(state) {
  if (state.isPaused || !state.isRunning) {
    return state
  }

  const newRemaining = state.remainingSeconds - 1

  // Auto-advance if timer expires (optional - can also wait for manual Complete)
  // For now, just update the timer and let user click Complete
  return {
    ...state,
    remainingSeconds: Math.max(0, newRemaining)
  }
}

/**
 * Calculate routine progress percentage
 * @param {Object} state - Current runner state
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(state) {
  const totalSteps = state.routine.steps.length
  const completedCount = state.completedSteps.length + state.skippedSteps.length
  return Math.round((completedCount / totalSteps) * 100)
}

/**
 * Check if routine is complete
 * @param {Object} state - Current runner state
 * @returns {boolean} True if all steps completed/skipped
 */
export function isRoutineComplete(state) {
  const totalSteps = state.routine.steps.length
  const processedSteps = state.completedSteps.length + state.skippedSteps.length
  return processedSteps >= totalSteps
}

/**
 * Get routine summary for completion modal
 * TAB-RTN-31: Title, duration, steps, on-time %, XP breakdown
 * @param {Object} state - Final runner state
 * @returns {Object} Summary data
 */
export function getRoutineSummary(
  state,
  { includeCompletionBonuses = true } = {}
) {
  const totalSteps = state.routine.steps.length
  const completedCount = state.completedSteps.length
  const skippedCount = state.skippedSteps.length
  const onTimeCount = state.completedSteps.filter(
    (s) => s.completedOnTime
  ).length
  const onTimePercentage =
    completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0

  const xpBreakdown = calculateTotalXP(state.completedSteps, totalSteps)
  if (!includeCompletionBonuses) {
    xpBreakdown.routineBonus = 0
    xpBreakdown.perfectBonus = 0
    xpBreakdown.total = xpBreakdown.stepXP
  }

  const plannedDuration = state.routine.steps.reduce(
    (sum, step) => sum + step.duration,
    0
  )
  const actualDuration = Math.floor((Date.now() - state.startedAt) / 1000)

  return {
    routineTitle: state.routine.title || state.routine.name,
    totalSteps,
    completedCount,
    skippedCount,
    onTimePercentage,
    xpBreakdown,
    plannedDuration,
    actualDuration,
    steps: state.logs
  }
}
