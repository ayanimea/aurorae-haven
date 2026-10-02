import React, { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RoutineRunnerProvider,
  useRoutineRunnerContext
} from '../contexts/RoutineRunnerContext'

const ROUTINE = {
  id: 'routine-1',
  title: 'Test routine',
  steps: [
    { label: 'First step', duration: 10 },
    { label: 'Second step', duration: 20 }
  ]
}

function RunnerConsumer() {
  const runner = useRoutineRunnerContext()
  return (
    <div>
      <output data-testid='runner-state'>
        {JSON.stringify({
          state: runner.state,
          isComplete: runner.isComplete,
          summary: runner.summary
        })}
      </output>
      <button onClick={() => runner.start(ROUTINE)}>Start</button>
      <button onClick={() => runner.start({ ...ROUTINE, steps: [] })}>
        Start empty
      </button>
      <button onClick={() => runner.start({ ...ROUTINE, steps: undefined })}>
        Start missing steps
      </button>
      <button onClick={runner.togglePause}>Toggle pause</button>
      <button onClick={runner.complete}>Complete step</button>
      <button onClick={() => runner.cancel(true)}>Keep progress</button>
      <button onClick={() => runner.cancel(false)}>Discard progress</button>
    </div>
  )
}

function RunnerHarness() {
  const [showConsumer, setShowConsumer] = useState(true)
  return (
    <RoutineRunnerProvider>
      <button onClick={() => setShowConsumer((visible) => !visible)}>
        Navigate
      </button>
      {showConsumer && <RunnerConsumer />}
    </RoutineRunnerProvider>
  )
}

function getRunnerState() {
  return JSON.parse(screen.getByTestId('runner-state').textContent)
}

describe('RoutineRunnerProvider', () => {
  let animationFrames
  let nextAnimationFrameId

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    animationFrames = new Map()
    nextAnimationFrameId = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++nextAnimationFrameId
      animationFrames.set(id, callback)
      return id
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      animationFrames.delete(id)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  function advanceClock(milliseconds) {
    vi.setSystemTime(Date.now() + milliseconds)
    const nextFrame = animationFrames.entries().next().value
    if (!nextFrame) throw new Error('Expected a scheduled animation frame')
    const [id, callback] = nextFrame
    animationFrames.delete(id)
    act(() => callback())
  }

  it('catches up elapsed seconds, preserves fractional time, and runs after consumer unmount', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    advanceClock(500)
    expect(getRunnerState().state.remainingSeconds).toBe(10)
    advanceClock(500)
    expect(getRunnerState().state.remainingSeconds).toBe(9)
    advanceClock(5000)
    expect(getRunnerState().state.remainingSeconds).toBe(4)

    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }))
    expect(screen.queryByTestId('runner-state')).not.toBeInTheDocument()
    advanceClock(2000)

    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }))
    expect(getRunnerState().state.remainingSeconds).toBe(2)
  })

  it('does not decrement while paused and resumes the timer', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Toggle pause' }))

    vi.setSystemTime(Date.now() + 3000)
    expect(getRunnerState().state.remainingSeconds).toBe(10)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle pause' }))
    advanceClock(1000)
    expect(getRunnerState().state.remainingSeconds).toBe(9)
  })

  it('preserves the fractional timer remainder across a pause', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    vi.setSystemTime(Date.now() + 100)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle pause' }))
    vi.setSystemTime(Date.now() + 5000)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle pause' }))

    advanceClock(899)
    expect(getRunnerState().state.remainingSeconds).toBe(10)
    advanceClock(1)
    expect(getRunnerState().state.remainingSeconds).toBe(9)
  })

  it('starts a fresh timer baseline when advancing to the next step', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    advanceClock(900)
    fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
    advanceClock(100)
    expect(getRunnerState().state.remainingSeconds).toBe(20)
    advanceClock(900)
    expect(getRunnerState().state.remainingSeconds).toBe(19)
  })

  it('records a completion summary after all steps are completed', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))

    const runner = getRunnerState()
    expect(runner.isComplete).toBe(true)
    expect(runner.summary.completedCount).toBe(2)
    expect(runner.state.isRunning).toBe(false)
  })

  it.each(['Start empty', 'Start missing steps'])(
    'ignores a routine with %s',
    (buttonName) => {
      render(<RunnerHarness />)
      fireEvent.click(screen.getByRole('button', { name: buttonName }))

      expect(getRunnerState().state).toBeNull()
    }
  )

  it('preserves completed progress and exposes a summary when cancelled with keep enabled', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep progress' }))

    const runner = getRunnerState()
    expect(runner.state.completedSteps).toHaveLength(1)
    expect(runner.state.isRunning).toBe(false)
    expect(runner.isComplete).toBe(false)
    expect(runner.summary.completedCount).toBe(1)
    expect(runner.summary.status).toBe('cancelled')
    expect(runner.summary.xpBreakdown).toEqual({
      stepXP: 2,
      routineBonus: 0,
      perfectBonus: 0,
      total: 2
    })
  })

  it('clears runner state and summary when cancelled with keep disabled', () => {
    render(<RunnerHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete step' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard progress' }))

    expect(getRunnerState()).toEqual({
      state: null,
      isComplete: false,
      summary: null
    })
  })
})
