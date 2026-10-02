// React hook for routine runner state management
// Integrates routine execution with React components

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  createRunnerState,
  completeStep,
  skipStep,
  togglePause as togglePauseUtil,
  tickTimer,
  calculateProgress,
  isRoutineComplete,
  getRoutineSummary,
  formatTime
} from '../utils/routineRunner'

// Timer tick interval in milliseconds (1 second for countdown)
const TIMER_TICK_INTERVAL_MS = 1000

/**
 * Custom hook for managing routine execution
 * @param {Object} routine - Routine data to run
 * @returns {Object} Runner state and control functions
 */
export function useRoutineRunner(routine) {
  // Initialize runner state - effect will handle initialization when routine changes
  const [state, setState] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [summary, setSummary] = useState(null)
  const prevRoutineIdRef = useRef(null)

  // Update runner state when routine ID changes (meaningful routine change)
  // This resets progress if switching to a different routine
  useEffect(() => {
    if (routine && routine.id !== prevRoutineIdRef.current) {
      prevRoutineIdRef.current = routine.id
      const newState = createRunnerState(routine)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state when routine changes
      setState(newState)
    }
  }, [routine])

  // Timer tick - TAB-RTN-52: Target 60 FPS with requestAnimationFrame
  useEffect(() => {
    if (!state || !state.isRunning) {
      return
    }

    let lastTick = Date.now()
    let animationId

    const tick = () => {
      const now = Date.now()
      const elapsed = now - lastTick

      // Only tick once per second for countdown
      if (elapsed >= TIMER_TICK_INTERVAL_MS) {
        setState((prevState) => {
          const newState = tickTimer(prevState)

          // Check if routine is complete after tick
          if (isRoutineComplete(newState) && !isComplete) {
            setIsComplete(true)
            setSummary(getRoutineSummary(newState))
            return { ...newState, isRunning: false }
          }

          return newState
        })
        lastTick = now
      }

      animationId = window.requestAnimationFrame(tick)
    }

    animationId = window.requestAnimationFrame(tick)

    return () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId)
      }
    }
  }, [state, isComplete])

  // Start routine
  const start = useCallback(() => {
    if (state?.routine?.steps?.length > 0) {
      setState((prev) => ({ ...prev, isRunning: true }))
    }
  }, [state])

  // Pause/Resume - TAB-RTN-15
  const togglePause = useCallback(() => {
    if (state) {
      setState((prev) => togglePauseUtil(prev))
    }
  }, [state])

  // Complete current step - TAB-RTN-13
  const complete = useCallback(() => {
    if (state && state.isRunning) {
      setState((prev) => {
        const newState = completeStep(prev)

        // Check if routine is complete
        if (isRoutineComplete(newState)) {
          setIsComplete(true)
          setSummary(getRoutineSummary(newState))
          return { ...newState, isRunning: false }
        }

        return newState
      })
    }
  }, [state])

  // Skip current step - TAB-RTN-14
  const skip = useCallback(
    (reason = '') => {
      if (state && state.isRunning) {
        setState((prev) => {
          const newState = skipStep(prev, reason)

          // Check if routine is complete
          if (isRoutineComplete(newState)) {
            setIsComplete(true)
            setSummary(getRoutineSummary(newState))
            return { ...newState, isRunning: false }
          }

          return newState
        })
      }
    },
    [state]
  )

  // Cancel routine - TAB-RTN-18
  const cancel = useCallback(() => {
    if (state) {
      setState(null)
      setIsComplete(false)
      setSummary(null)
    }
  }, [state])

  // Reset to start over
  const reset = useCallback(() => {
    if (routine) {
      setState(createRunnerState(routine))
      setIsComplete(false)
      setSummary(null)
    }
  }, [routine])

  // Get current step data
  const currentStep = state?.routine?.steps?.[state.currentStepIndex]
  const previousStep =
    state && state.currentStepIndex > 0
      ? state.routine.steps?.[state.currentStepIndex - 1]
      : null
  const nextStep =
    state &&
    state.currentStepIndex < (state.routine.steps?.length ?? 0) - 1
      ? state.routine.steps?.[state.currentStepIndex + 1]
      : null

  // Calculate progress
  const progress = state ? calculateProgress(state) : 0

  // Format remaining time
  const remainingTime = state ? formatTime(state.remainingSeconds) : '00:00'

  return {
    state,
    isComplete,
    summary,
    currentStep,
    previousStep,
    nextStep,
    progress,
    remainingTime,
    start,
    togglePause,
    complete,
    skip,
    cancel,
    reset
  }
}
