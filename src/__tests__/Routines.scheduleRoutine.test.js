/**
 * @vitest-environment jsdom
 *
 * Focused tests for the "Schedule routine" feature in Routines.jsx:
 *  - Schedule button opens EventModal pre-filled with routine data
 *  - Successful save calls EventService.createEvent and closes the modal
 *  - Failed save keeps the modal open (error is rethrown for EventModal to handle)
 */
import { vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// ─── Mocks ───────────────────────────────────────────────────────────────────

// jsdom does not implement window.matchMedia — provide a minimal stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

vi.mock('../components/common/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}))

// EventModal spy — captures props so tests can inspect initialData and call onSave/onClose
const eventModalSpy = vi.fn()
vi.mock('../components/Schedule/EventModal', () => ({
  default: function EventModal(props) {
    eventModalSpy(props)
    if (!props.isOpen) return null
    return (
      <div data-testid='event-modal'>
        <span data-testid='modal-title'>{props.initialData?.title}</span>
        <span data-testid='modal-type'>{props.initialData?.type}</span>
        <span data-testid='modal-start'>{props.initialData?.startTime}</span>
        <span data-testid='modal-end'>{props.initialData?.endTime}</span>
        <button
          data-testid='modal-save'
          onClick={() =>
            // Mimic real EventModal: catch the rejection so it doesn't leak as
            // an unhandled rejection, but keep the modal mounted (no onClose call).
            props.onSave({ ...props.initialData }).catch(() => {})
          }
        >
          Save
        </button>
        <button data-testid='modal-close' onClick={props.onClose}>
          Close
        </button>
      </div>
    )
  }
}))

vi.mock('../components/Routines/SequenceRunner', () => ({
  default: () => null
}))

vi.mock('../components/Routines/RoutineContextMenu', () => ({
  default: () => null
}))

vi.mock('../components/Routines/RoutineCreationModal', () => ({
  default: () => null
}))

vi.mock('../components/common/ConfirmModal', () => ({
  default: function MockConfirmModal({ isOpen, onConfirm, onCancel, title }) {
    if (!isOpen) return null
    return (
      <div data-testid='confirm-modal'>
        <span data-testid='confirm-modal-title'>{title}</span>
        <button data-testid='confirm-modal-confirm' onClick={onConfirm}>
          Confirm
        </button>
        <button data-testid='confirm-modal-cancel' onClick={onCancel}>
          Cancel
        </button>
      </div>
    )
  }
}))

// getRoutines returns two routines by default; override per test as needed
const mockGetRoutines = vi.fn()
const mockDeleteRoutine = vi.fn()
vi.mock('../utils/routinesManager', () => ({
  getRoutines: (...args) => mockGetRoutines(...args),
  exportRoutines: vi.fn().mockResolvedValue('[]'),
  importRoutines: vi.fn().mockResolvedValue([]),
  createRoutine: vi.fn(),
  updateRoutine: vi.fn(),
  deleteRoutine: (...args) => mockDeleteRoutine(...args)
}))

vi.mock('../utils/templatesManager', () => ({
  saveTemplate: vi.fn(),
  getTemplates: vi.fn().mockResolvedValue([])
}))

vi.mock('../utils/templateInstantiation', () => ({
  instantiateTemplate: vi.fn()
}))

vi.mock('../services/EventService', () => ({
  __esModule: true,
  default: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn()
  }
}))

vi.mock('../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }))
}))

// Pin the current time to 10:00 on 2025-09-16 for deterministic results
vi.mock('../utils/timeUtils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getCurrentDateISO: vi.fn(() => '2025-09-16'),
    getCurrentTimeHHMM: vi.fn(() => '10:00')
  }
})

vi.mock('../hooks/useRoutineRunner', () => ({
  useRoutineRunner: () => ({
    state: null,
    isComplete: false,
    summary: null,
    reset: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    completedSteps: [],
    skippedSteps: [],
    currentStepIndex: 0
  })
}))

// ─── Test helpers ─────────────────────────────────────────────────────────────

import EventService from '../services/EventService'
import { getCurrentTimeHHMM } from '../utils/timeUtils'
import Routines from '../pages/Routines'

const MORNING_ROUTINE = {
  id: 'r1',
  name: 'Morning Routine',
  title: 'Morning Routine',
  steps: [{ label: 'Stretch', duration: 300 }],
  totalDuration: 1800 // 30 minutes
}

async function renderWithRoutines(routines = [MORNING_ROUTINE]) {
  mockGetRoutines.mockResolvedValue(routines)
  let result
  await act(async () => {
    result = render(<Routines />)
  })
  return result
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Routines — Schedule routine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    eventModalSpy.mockClear()
    EventService.createEvent.mockResolvedValue({ id: 'ev1' })
    mockDeleteRoutine.mockResolvedValue(undefined)
  })

  it('renders a Schedule button for each routine', async () => {
    await renderWithRoutines()
    expect(
      screen.getByRole('button', { name: /Schedule Morning Routine/i })
    ).toBeInTheDocument()
  })

  it('deletes a routine after confirmation via ConfirmModal', async () => {
    await renderWithRoutines()

    // Click the Delete button – should open ConfirmModal, not call window.confirm
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Delete Morning Routine/i }))
    })

    // ConfirmModal should now be visible
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()

    // Confirm the deletion
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-modal-confirm'))
    })

    expect(mockDeleteRoutine).toHaveBeenCalledTimes(1)
    expect(mockDeleteRoutine).toHaveBeenCalledWith('r1')
  })

  it('opens EventModal with pre-filled routine data when Schedule is clicked', async () => {
    await renderWithRoutines()

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Schedule Morning Routine/i })
      )
    })

    expect(screen.getByTestId('event-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title').textContent).toBe('Morning Routine')
    expect(screen.getByTestId('modal-type').textContent).toBe('routine')

    // Start time should be current time (10:00); duration=30 min → end = 10:30
    expect(screen.getByTestId('modal-start').textContent).toBe('10:00')
    expect(screen.getByTestId('modal-end').textContent).toBe('10:30')
  })

  it('calls EventService.createEvent and closes modal on successful save', async () => {
    await renderWithRoutines()

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Schedule Morning Routine/i })
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-save'))
    })

    expect(EventService.createEvent).toHaveBeenCalledTimes(1)
    expect(EventService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Morning Routine',
        type: 'routine',
        day: '2025-09-16',
        startTime: '10:00',
        endTime: '10:30'
      })
    )

    // Modal should be closed after successful save
    await waitFor(() => {
      expect(screen.queryByTestId('event-modal')).not.toBeInTheDocument()
    })
  })

  it('keeps modal open when EventService.createEvent throws', async () => {
    EventService.createEvent.mockRejectedValue(new Error('DB error'))

    await renderWithRoutines()

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Schedule Morning Routine/i })
      )
    })

    // Trigger save; onSave will throw, so EventModal should stay open
    await act(async () => {
      fireEvent.click(screen.getByTestId('modal-save'))
    })

    expect(EventService.createEvent).toHaveBeenCalledTimes(1)
    // Modal must still be present because the error was rethrown
    expect(screen.getByTestId('event-modal')).toBeInTheDocument()
  })

  it('computes correct end time for a routine that fits within the day', async () => {
    // Mocked time is 10:00; 90-minute routine → end 11:30, no midnight crossing.
    const lateRoutine = {
      ...MORNING_ROUTINE,
      id: 'r2',
      name: 'Late Routine',
      totalDuration: 5400 // 90 minutes
    }
    mockGetRoutines.mockResolvedValue([lateRoutine])

    await act(async () => {
      render(<Routines />)
    })

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Schedule Late Routine/i })
      ).toBeInTheDocument()
    )

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Schedule Late Routine/i })
      )
    })

    // 10:00 + 90 min = 11:30, well before midnight → end should be 11:30
    expect(screen.getByTestId('modal-end').textContent).toBe('11:30')
  })

  it('shifts start backward so a midnight-crossing routine retains full duration', async () => {
    // Override the mocked time to 23:15; a 90-min routine would cross midnight
    // → start should be shifted to 22:29 (1439 - 90 = 1349 mins) and end to 23:59.
    vi.mocked(getCurrentTimeHHMM).mockReturnValueOnce('23:15')

    const midnightRoutine = {
      ...MORNING_ROUTINE,
      id: 'r-midnight',
      name: 'Night Routine',
      totalDuration: 5400 // 90 minutes
    }
    await renderWithRoutines([midnightRoutine])

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Schedule Night Routine/i })
      )
    })

    // 1439 - 90 = 1349 → 22:29; end clamped to 23:59; duration = 90 min ✓
    expect(screen.getByTestId('modal-start').textContent).toBe('22:29')
    expect(screen.getByTestId('modal-end').textContent).toBe('23:59')
  })

  it('clamps end to 23:59 for routines >= 24 hours', async () => {
    const longRoutine = {
      ...MORNING_ROUTINE,
      id: 'r3',
      name: 'Long Routine',
      totalDuration: 90000 // 1500 minutes = 25 hours
    }
    await renderWithRoutines([longRoutine])

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Schedule Long Routine/i })
      )
    })

    expect(screen.getByTestId('modal-end').textContent).toBe('23:59')
  })
})
