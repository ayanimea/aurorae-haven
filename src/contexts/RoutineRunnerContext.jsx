/**
 * RoutineRunnerContext
 *
 * Provides a persistent routine-runner state that survives React route
 * changes.  The RAF timer loop continues running even when the Routines page
 * is unmounted, so the countdown advances correctly when the user navigates
 * away and returns.
 *
 * Usage:
 *   - Wrap the app with <RoutineRunnerProvider>
 *   - Call useRoutineRunnerContext() inside any component
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
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

// Timer tick resolution (1 s countdown)
const TIMER_TICK_INTERVAL_MS = 1000

export const RoutineRunnerContext = createContext(null)

/**
 * Provider component.  Mount once above your <Routes> so the timer persists
 * across route changes.
 */
export function RoutineRunnerProvider({ children }) {
  const [runningRoutine, setRunningRoutine] = useState(null)
  const [state, setState] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [summary, setSummary] = useState(null)

  // ── Timer loop ──────────────────────────────────────────────────────────
  // Runs via requestAnimationFrame so the countdown continues even when the
  // Routines page is not rendered.  The effect is (re-)started only when
  // isRunning transitions from false → true, and cleaned up on the reverse.
  useEffect(() => {
    if (!state?.isRunning) return

    let lastTick = Date.now()
    let animationId

    const tick = () => {
      const now = Date.now()
      if (now - lastTick >= TIMER_TICK_INTERVAL_MS) {
        setState((prev) => {
          if (!prev?.isRunning) return prev
          const next = tickTimer(prev)
          if (isRoutineComplete(next)) {
            setIsComplete(true)
            setSummary(getRoutineSummary(next))
            return { ...next, isRunning: false }
          }
          return next
        })
        lastTick = now
      }
      animationId = window.requestAnimationFrame(tick)
    }

    animationId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(animationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.isRunning])

  // ── Controls ────────────────────────────────────────────────────────────

  /** Start (or restart) a routine.  Creates fresh runner state and begins the timer. */
  const start = useCallback((routine) => {
    setRunningRoutine(routine)
    setState({ ...createRunnerState(routine), isRunning: true })
    setIsComplete(false)
    setSummary(null)
  }, [])

  /** Toggle between paused and running. */
  const togglePause = useCallback(() => {
    setState((prev) => (prev ? togglePauseUtil(prev) : null))
  }, [])

  /** Mark the current step as completed and advance. */
  const complete = useCallback(() => {
    setState((prev) => {
      if (!prev?.isRunning) return prev
      const next = completeStep(prev)
      if (isRoutineComplete(next)) {
        setIsComplete(true)
        setSummary(getRoutineSummary(next))
        return { ...next, isRunning: false }
      }
      return next
    })
  }, [])

  /** Skip the current step with an optional reason. */
  const skip = useCallback((reason = '') => {
    setState((prev) => {
      if (!prev?.isRunning) return prev
      const next = skipStep(prev, reason)
      if (isRoutineComplete(next)) {
        setIsComplete(true)
        setSummary(getRoutineSummary(next))
        return { ...next, isRunning: false }
      }
      return next
    })
  }, [])

  /** Cancel the running routine and clear all state. */
  const cancel = useCallback(() => {
    setState(null)
    setRunningRoutine(null)
    setIsComplete(false)
    setSummary(null)
  }, [])

  /** Reset the running routine back to its initial state (for Run Again). */
  const reset = useCallback(() => {
    setRunningRoutine((prevRoutine) => {
      if (prevRoutine) {
        setState(createRunnerState(prevRoutine))
        setIsComplete(false)
        setSummary(null)
      }
      return prevRoutine
    })
  }, [])

  // ── Derived values ──────────────────────────────────────────────────────

  const currentStep = state?.routine?.steps[state.currentStepIndex]
  const previousStep =
    state && state.currentStepIndex > 0
      ? state.routine.steps[state.currentStepIndex - 1]
      : null
  const nextStep =
    state && state.currentStepIndex < state.routine.steps.length - 1
      ? state.routine.steps[state.currentStepIndex + 1]
      : null
  const progress = state ? calculateProgress(state) : 0
  const remainingTime = state ? formatTime(state.remainingSeconds) : '00:00'

  const value = {
    /** The routine that is currently running (or null). */
    runningRoutine,
    /** Full runner state (mirrors useRoutineRunner's `state`). */
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

  return (
    <RoutineRunnerContext.Provider value={value}>
      {children}
    </RoutineRunnerContext.Provider>
  )
}

RoutineRunnerProvider.propTypes = {
  children: PropTypes.node.isRequired
}

/**
 * Consume the global routine-runner state.
 * Must be used inside a <RoutineRunnerProvider>.
 */
export function useRoutineRunnerContext() {
  const ctx = useContext(RoutineRunnerContext)
  if (!ctx) {
    throw new Error(
      'useRoutineRunnerContext must be used inside <RoutineRunnerProvider>'
    )
  }
  return ctx
}
