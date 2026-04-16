import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRoutineRunner } from '../hooks/useRoutineRunner'
import { formatTime } from '../utils/routineRunner'
import {
  exportRoutines,
  importRoutines,
  getRoutines,
  createRoutine
} from '../utils/routinesManager'
import { saveTemplate } from '../utils/templatesManager'
import { instantiateTemplate } from '../utils/templateInstantiation'
import { createLogger } from '../utils/logger'
import ConfirmModal from '../components/common/ConfirmModal'
import Icon from '../components/common/Icon'
import RoutineCreationModal from '../components/Routines/RoutineCreationModal'

const logger = createLogger('Routines')

// Figma-sourced step color palette (cycles by step index)
const STEP_COLORS = [
  'rgba(239, 68, 68, 0.7)',
  'rgba(59, 130, 246, 0.7)',
  'rgba(168, 85, 247, 0.7)',
  'rgba(236, 72, 153, 0.7)',
  'rgba(34, 197, 94, 0.7)',
  'rgba(251, 146, 60, 0.7)',
]

// Circular timer constants
const TIMER_RADIUS = 88
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS // ≈ 553

function Routines() {
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [availableRoutines, setAvailableRoutines] = useState([])
  const [loadingRoutines, setLoadingRoutines] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const fileInputRef = useRef(null)

  // TAB-RTN-18: Cancel confirmation modal state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Routine creation modal state
  const [showCreationModal, setShowCreationModal] = useState(false)

  // TAB-RTN-45: Reduced motion detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const runner = useRoutineRunner(selectedRoutine)

  // Toast timeout ref to prevent race conditions
  const toastTimeoutRef = useRef(null)

  // Show toast notification
  const showToastNotification = useCallback((message) => {
    // Clear any existing timeout to prevent race conditions
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
    setToastMessage(message)
    setShowToast(true)
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
        toastTimeoutRef.current = null
      }
    }
  }, [])

  const loadAvailableRoutines = useCallback(async () => {
    try {
      setLoadingRoutines(true)
      const routines = await getRoutines({ sortBy: 'name', order: 'asc' })
      logger.log(`Loaded ${routines.length} routines from getRoutines()`)
      logger.log('Routine IDs:', routines.map((r) => r.id).join(', '))
      logger.log(
        'Routine names:',
        routines.map((r) => r.name || r.title).join(', ')
      )
      setAvailableRoutines(routines)
    } catch (error) {
      logger.error('Failed to load routines:', error)
      showToastNotification('Failed to load routines')
    } finally {
      setLoadingRoutines(false)
    }
  }, [showToastNotification])

  // Load available routines on mount
  useEffect(() => {
    loadAvailableRoutines()
  }, [loadAvailableRoutines])

  // TAB-RTN-45: Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // TAB-RTN-37, TAB-RTN-39: Touch gesture handling for mobile swipe navigation
  useEffect(() => {
    if (!runner.state || !runner.state.isRunning) return

    let touchStartX = 0
    let touchEndX = 0
    const minSwipeDistance = 50

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipeGesture()
    }

    const handleSwipeGesture = () => {
      const swipeDistance = touchEndX - touchStartX

      // Swipe left to skip step
      if (swipeDistance < -minSwipeDistance && runner.skip) {
        // TAB-RTN-41: Trigger haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(10)
        }
        runner.skip()
      }

      // Swipe right to complete step
      if (swipeDistance > minSwipeDistance && runner.complete) {
        // TAB-RTN-41: Trigger haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10])
        }
        runner.complete()
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [runner])

  // TAB-RTN-18: Stop/Cancel routine with confirmation
  const handleCancelRoutine = React.useCallback(() => {
    setShowCancelConfirm(true)
  }, [])

  const confirmCancel = React.useCallback(
    (keepProgress) => {
      if (keepProgress) {
        // Keep partial progress - logs and XP are preserved in runner state
        logger.log('Routine cancelled - progress preserved')
      } else {
        // Discard progress
        if (runner.reset) runner.reset()
        logger.log('Routine cancelled - progress discarded')
      }
      if (runner.cancel) runner.cancel()
      setSelectedRoutine(null)
      setShowCancelConfirm(false)
    },
    [runner]
  )

  // TAB-RTN-44: Keyboard shortcuts
  useEffect(() => {
    if (!runner.state || !runner.state.isRunning) return

    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          if (runner.complete) runner.complete()
          break
        case 'p':
          e.preventDefault()
          if (runner.togglePause) runner.togglePause()
          break
        case 's':
          e.preventDefault()
          if (runner.skip) runner.skip()
          break
        case 'escape':
          e.preventDefault()
          handleCancelRoutine()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [runner, handleCancelRoutine])

  // Start runner when selectedRoutine and runner are ready
  React.useEffect(() => {
    if (
      selectedRoutine &&
      runner &&
      runner.start &&
      runner.state &&
      !runner.state.isRunning
    ) {
      runner.start()
    }
  }, [selectedRoutine, runner])

  // Handle routine data export - TAB-RTN-47
  const handleExportRoutines = async () => {
    try {
      const data = await exportRoutines()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `routines-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToastNotification('Routines exported successfully')
    } catch (error) {
      logger.error('Failed to export routines:', error)
      showToastNotification('Failed to export routines')
    }
  }

  // Handle routine data import - TAB-RTN-48, TAB-RTN-49
  const handleImportRoutines = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const results = await importRoutines(data)

      if (results.errors.length > 0) {
        logger.warn('Import completed with errors:', results.errors)
      }

      showToastNotification(
        `Imported ${results.imported} routines (${results.skipped} skipped)`
      )

      // Reload page to reflect imported routines
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      logger.error('Failed to import routines:', error)
      showToastNotification('Import failed: ' + error.message)
    }
  }

  // TAB-RTN-32: Save routine as template
  const handleSaveAsTemplate = async () => {
    if (!runner.state || !runner.state.routine) return

    try {
      const routine = runner.state.routine
      const template = {
        type: 'routine',
        title: routine.name || routine.title,
        tags: routine.tags || [],
        steps: routine.steps || [],
        estimatedDuration: routine.totalDuration || 0,
        energyTag: routine.energyTag
      }

      await saveTemplate(template)
      showToastNotification('Routine saved as template')
    } catch (error) {
      logger.error('Failed to save template:', error)
      showToastNotification('Failed to save template')
    }
  }

  // Handle template selection from modal
  const handleSelectTemplate = async (template) => {
    try {
      logger.log('Selected template:', template.title)
      logger.log('Template object:', template)

      // Instantiate the template to create a routine
      const result = await instantiateTemplate(template)
      logger.log('instantiateTemplate returned:', result)

      // Validate result structure
      if (!result || result.type !== 'routine') {
        logger.error('instantiateTemplate returned unexpected result:', result)
        showToastNotification('Failed to create routine from template')
        return
      }

      logger.log('Routine created with ID:', result.id)

      showToastNotification('Routine created from template')

      // Reload the routine list to show the new routine
      logger.log('Reloading available routines...')
      await loadAvailableRoutines()
      logger.log('Routine list reload complete')
    } catch (error) {
      logger.error('Failed to create routine from template:', error)
      showToastNotification('Failed to create routine: ' + error.message)
    }
  }

  // Handle creating routine from scratch
  const handleCreateRoutine = async (routineData) => {
    try {
      logger.log('Creating routine from scratch:', routineData.name)

      const routineId = await createRoutine(routineData)
      logger.log('Routine created with ID:', routineId)

      showToastNotification('Routine created successfully')

      // Reload the routine list to show the new routine
      await loadAvailableRoutines()
    } catch (error) {
      logger.error('Failed to create routine:', error)
      showToastNotification('Failed to create routine: ' + error.message)
    }
  }

  // Derive per-run stats for the gamified stats bar
  // Count both completed AND skipped steps so the "Done" badge matches the progress bar
  const completedCount =
    (runner.state?.completedSteps?.length ?? 0) +
    (runner.state?.skippedSteps?.length ?? 0)
  const xpSoFar = runner.state?.completedSteps?.reduce(
    (sum, s) => sum + (s.xp ?? 0),
    0
  ) ?? 0
  const allSteps = runner.state?.routine?.steps ?? []
  const currentStepIndex = runner.state?.currentStepIndex ?? 0
  const currentStepColor =
    STEP_COLORS[currentStepIndex % STEP_COLORS.length]
  const stepDuration = runner.currentStep?.duration ?? 1
  const stepProgress =
    1 - (runner.state?.remainingSeconds ?? 0) / stepDuration
  const timerDashOffset =
    TIMER_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, stepProgress)))

  return (
    <>
      {/* TAB-RTN-05: Toolbar for routine data management */}
      <div className='rseq-toolbar'>
        <button
          type='button'
          className='btn'
          onClick={handleExportRoutines}
          aria-label='Export all routine data'
        >
          <Icon name='download' />
          Export
        </button>
        <button
          type='button'
          className='btn'
          onClick={() => fileInputRef.current?.click()}
          aria-label='Import routine data'
        >
          <Icon name='upload' />
          Import
        </button>
        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleImportRoutines}
          style={{ display: 'none' }}
          aria-label='Choose routine data file to import'
        />
      </div>

      {/* ── Figma Gamified Sequence Runner ── */}
      {runner.state && runner.state.isRunning && (
        <div className='rseq-wrapper'>
          {/* Stats Bar */}
          <div className='rseq-stats-bar'>
            <div className='rseq-stats-bar-info'>
              <h2 className='rseq-routine-title'>
                {runner.state.routine.title || runner.state.routine.name}
              </h2>
              <p className='rseq-routine-subtitle'>
                {allSteps.length} step{allSteps.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className='rseq-stats-badges'>
              {/* Steps completed */}
              <div
                className='rseq-stat-badge'
                role='group'
                aria-label={`${completedCount} steps completed`}
              >
                <svg
                  className='rseq-stat-icon'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  aria-hidden='true'
                >
                  <path d='M20 6 9 17l-5-5' />
                </svg>
                <div>
                  <div className='rseq-stat-value'>{completedCount}</div>
                  <div className='rseq-stat-label'>Done</div>
                </div>
              </div>

              {/* XP earned */}
              <div
                className='rseq-stat-badge'
                role='group'
                aria-label={`${xpSoFar} XP earned`}
              >
                <svg
                  className='rseq-stat-icon rseq-stat-icon--xp'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  aria-hidden='true'
                >
                  <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
                </svg>
                <div>
                  <div className='rseq-stat-value'>{xpSoFar}</div>
                  <div className='rseq-stat-label'>XP</div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className='rseq-overall-progress'>
            <div
              className='rseq-progress-track'
              role='progressbar'
              aria-valuenow={runner.progress}
              aria-valuemin='0'
              aria-valuemax='100'
              aria-label='Overall routine progress'
              aria-valuetext={`${Math.round(runner.progress)}% complete`}
            >
              <div
                className='rseq-progress-fill'
                style={{ width: `${runner.progress}%` }}
              />
            </div>
            <p className='rseq-step-count'>
              Step {currentStepIndex + 1} of {allSteps.length}
            </p>
          </div>

          {/* TAB-RTN-09: Step triptych - Previous | Current (timer) | Next */}
          <div className='rseq-triptych'>
            {/* Previous step */}
            <div className='rseq-card rseq-card--dim'>
              {runner.previousStep ? (
                <>
                  <div className='rseq-card-label'>Previous</div>
                  <div className='rseq-card-title'>
                    {runner.previousStep.label}
                  </div>
                  {(() => {
                    const prevIdx = (runner.state?.currentStepIndex ?? 1) - 1
                    const wasSkipped = runner.state?.skippedSteps?.some(
                      (s) => s.stepIndex === prevIdx
                    )
                    return (
                      <div
                        className={`rseq-completed-badge${wasSkipped ? ' rseq-completed-badge--skipped' : ''}`}
                      >
                        {!wasSkipped && (
                          <svg
                            viewBox='0 0 16 16'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            aria-hidden='true'
                          >
                            <path d='M13 4 6 11 3 8' />
                          </svg>
                        )}
                        {wasSkipped ? 'Skipped' : 'Completed'}
                      </div>
                    )
                  })()}
                </>
              ) : (
                <div className='rseq-card-label'>—</div>
              )}
            </div>

            {/* Current step - TAB-RTN-10 */}
            <div
              className='rseq-card rseq-card--current'
              style={{
                borderColor: currentStepColor,
                boxShadow: `0 0 40px ${currentStepColor.replace('0.7', '0.15')}, inset 0 0 60px ${currentStepColor.replace('0.7', '0.04')}`,
              }}
            >
              {/* Step status label */}
              <div
                className='rseq-current-status'
                style={{ color: currentStepColor }}
              >
                Current &bull;{' '}
                {runner.state.isPaused ? 'Paused' : 'Running'}
              </div>
              <div className='rseq-card-title rseq-current-title'>
                {runner.currentStep?.label}
              </div>

              {/* Circular SVG Timer */}
              <div className='rseq-timer-wrap' aria-hidden='true'>
                <svg
                  className='rseq-timer-svg'
                  viewBox='0 0 192 192'
                  role='presentation'
                >
                  {/* Background track */}
                  <circle
                    cx='96'
                    cy='96'
                    r={TIMER_RADIUS}
                    stroke='rgba(255, 255, 255, 0.05)'
                    strokeWidth='8'
                    fill='none'
                  />
                  {/* Progress arc */}
                  <circle
                    cx='96'
                    cy='96'
                    r={TIMER_RADIUS}
                    stroke={currentStepColor}
                    strokeWidth='8'
                    fill='none'
                    strokeLinecap='round'
                    style={{
                      strokeDasharray: TIMER_CIRCUMFERENCE,
                      strokeDashoffset: timerDashOffset,
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%',
                      filter: `drop-shadow(0 0 6px ${currentStepColor})`,
                      transition: prefersReducedMotion
                        ? 'none'
                        : 'stroke-dashoffset 0.5s ease',
                    }}
                  />
                </svg>
                <div className='rseq-timer-text'>
                  {/* TAB-RTN-43: visible timer + sr-only live region */}
                  <span className='rseq-timer-digits'>
                    {runner.remainingTime}
                  </span>
                  <span className='rseq-timer-label'>remaining</span>
                  <span className='sr-only' aria-live='polite'>
                    {formatTime(
                      runner.state?.remainingSeconds ?? 0,
                      { verbose: true }
                    )}
                  </span>
                </div>
              </div>

              {/* TAB-RTN-11: Controls with accessible labels */}
              <div className='rseq-controls'>
                <button
                  type='button'
                  className='rseq-btn'
                  onClick={runner.complete}
                  aria-label='Complete current step'
                  disabled={!runner.state.isRunning}
                >
                  <Icon name='check' />
                  <span className='rseq-btn-label'>Complete</span>
                </button>
                <button
                  type='button'
                  className='rseq-btn'
                  onClick={runner.togglePause}
                  aria-label={
                    runner.state.isPaused ? 'Resume routine' : 'Pause routine'
                  }
                >
                  <Icon name={runner.state.isPaused ? 'play' : 'pause'} />
                  <span className='rseq-btn-label'>
                    {runner.state.isPaused ? 'Resume' : 'Pause'}
                  </span>
                </button>
                <button
                  type='button'
                  className='rseq-btn'
                  onClick={() => runner.skip()}
                  aria-label='Skip current step'
                  disabled={!runner.state.isRunning}
                >
                  <Icon name='skip' />
                  <span className='rseq-btn-label'>Skip</span>
                </button>
                <button
                  type='button'
                  className='rseq-btn rseq-btn--danger'
                  onClick={handleCancelRoutine}
                  aria-label='Cancel routine'
                >
                  <Icon name='x' />
                  <span className='rseq-btn-label'>Cancel</span>
                </button>
              </div>
            </div>

            {/* Next step */}
            <div className='rseq-card rseq-card--dim'>
              {runner.nextStep ? (
                <>
                  <div className='rseq-card-label'>Next</div>
                  <div className='rseq-card-title'>{runner.nextStep.label}</div>
                  <div className='rseq-next-duration'>
                    {formatTime(runner.nextStep.duration)}
                  </div>
                </>
              ) : (
                <div className='rseq-card-label'>—</div>
              )}
            </div>
          </div>

          {/* All Steps Grid */}
          <div
            className='rseq-steps-grid'
            style={{
              gridTemplateColumns: `repeat(${Math.min(allSteps.length, 5)}, 1fr)`,
            }}
          >
            {allSteps.map((step, index) => {
              // Derive per-step status from actual runner logs (not index comparison)
              const isSkipped = runner.state?.skippedSteps?.some(
                (s) => s.stepIndex === index
              ) ?? false
              const isCompleted = runner.state?.completedSteps?.some(
                (s) => s.stepIndex === index
              ) ?? false
              const isDone = isCompleted || isSkipped
              const isCurrent = index === currentStepIndex
              const stepColor = STEP_COLORS[index % STEP_COLORS.length]
              return (
                <div
                  key={step.id ?? index}
                  className={`rseq-step-card ${isCurrent ? 'rseq-step-card--current' : ''} ${isDone ? 'rseq-step-card--done' : ''}`}
                  role='region'
                  aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? ', completed' : isSkipped ? ', skipped' : isCurrent ? ', current' : ', pending'}`}
                  style={
                    isCurrent
                      ? {
                          borderColor: stepColor,
                          boxShadow: `0 0 20px ${stepColor.replace('0.7', '0.15')}`,
                        }
                      : undefined
                  }
                >
                  <div className='rseq-step-card-header'>
                    <span className='rseq-step-card-title'>{step.label}</span>
                    <span className='rseq-step-card-duration'>
                      {formatTime(step.duration)}
                    </span>
                  </div>
                  {isCompleted && (
                    <div className='rseq-step-status rseq-step-status--done'>
                      <svg
                        viewBox='0 0 16 16'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        aria-hidden='true'
                      >
                        <path d='M13 4 6 11 3 8' />
                      </svg>
                      Done
                    </div>
                  )}
                  {isSkipped && (
                    <div className='rseq-step-status rseq-step-status--skipped'>
                      Skipped
                    </div>
                  )}
                  {isCurrent && (
                    <div className='rseq-step-progress'>
                      <div
                        className='rseq-step-progress-fill'
                        style={{
                          width: `${Math.round(stepProgress * 100)}%`,
                          backgroundColor: stepColor,
                        }}
                      />
                    </div>
                  )}
                  {!isDone && !isCurrent && (
                    <div className='rseq-step-status rseq-step-status--pending'>
                      Pending
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No routine running - show available routines list */}
      {(!runner.state || !runner.state.isRunning) && (
        <div className='card'>
          <div className='card-h'>
            <strong>Available Routines</strong>
            <button
              type='button'
              className='btn btn-primary'
              onClick={() => setShowCreationModal(true)}
            >
              <Icon name='plus' />
              Create New Routine
            </button>
          </div>
          <div className='card-b'>
            {loadingRoutines ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Icon name='loader' className='icon-spin' />
                <p className='small'>Loading routines...</p>
              </div>
            ) : availableRoutines.length === 0 ? (
              <div className='empty-state'>
                <svg
                  className='icon'
                  viewBox='0 0 24 24'
                  style={{ width: '48px', height: '48px', opacity: 0.5 }}
                >
                  <title>No routines yet</title>
                  <circle cx='12' cy='12' r='10' />
                  <path d='M12 8v4M12 16h.01' />
                </svg>
                <p className='empty-state-text'>No routines yet</p>
                <p
                  className='small'
                  style={{ marginTop: '8px', marginBottom: '16px' }}
                >
                  Create your first routine to get started
                </p>
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={() => setShowCreationModal(true)}
                >
                  <Icon name='plus' />
                  Create New Routine
                </button>
              </div>
            ) : (
              <div className='rseq-routines-list'>
                {availableRoutines.map((routine) => (
                  <div key={routine.id} className='rseq-routine-row'>
                    <button
                      type='button'
                      className='rseq-routine-row-info'
                      onClick={() => setSelectedRoutine(routine)}
                      aria-label={`Start routine: ${routine.name || routine.title}`}
                    >
                      <div className='rseq-routine-row-title'>
                        {routine.name || routine.title}
                      </div>
                      {routine.steps && routine.steps.length > 0 && (
                        <div className='small dim'>
                          {routine.steps.length} step
                          {routine.steps.length !== 1 ? 's' : ''}
                          {routine.estimatedDuration
                            ? ` · ${formatTime(routine.estimatedDuration)}`
                            : ''}
                        </div>
                      )}
                      {routine.tags && routine.tags.length > 0 && (
                        <div className='rseq-routine-tags'>
                          {routine.tags.map((tag, i) => (
                            <span key={i} className='tag'>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                    <button
                      type='button'
                      className='btn btn-primary'
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedRoutine(routine)
                      }}
                      aria-label={`Start ${routine.name || routine.title}`}
                    >
                      <Icon name='play' />
                      Start
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB-RTN-31: Completion Summary Modal */}
      {runner.isComplete && runner.summary && (
        <div
          className='modal-overlay'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              runner.reset()
              setSelectedRoutine(null)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              runner.reset()
              setSelectedRoutine(null)
            }
          }}
          role='button'
          tabIndex={0}
        >
          <div
            className='modal-content'
            role='dialog'
            aria-modal='true'
            aria-labelledby='summary-title'
          >
            <div className='modal-header'>
              <h2
                id='summary-title'
                style={{
                  // TAB-RTN-45: Reduced motion - disable text animations
                  animation: prefersReducedMotion ? 'none' : undefined
                }}
              >
                🎉 Routine Complete!
              </h2>
              <button type="button"
                className='btn'
                onClick={() => {
                  runner.reset()
                  setSelectedRoutine(null)
                }}
                aria-label='Close summary'
              >
                <Icon name='x' />
              </button>
            </div>
            <div
              className='modal-body'
              style={{
                // TAB-RTN-45: Reduced motion - disable slide-in animations
                animation: prefersReducedMotion ? 'none' : undefined
              }}
            >
              <h3>{runner.summary.routineTitle}</h3>

              {/* Duration comparison */}
              <div style={{ marginBottom: '16px' }}>
                <div className='small'>Duration</div>
                <div>
                  <strong>{formatTime(runner.summary.actualDuration)}</strong>{' '}
                  <span className='small'>
                    (planned: {formatTime(runner.summary.plannedDuration)})
                  </span>
                </div>
              </div>

              {/* Steps summary */}
              <div style={{ marginBottom: '16px' }}>
                <div className='small'>Steps</div>
                <div>
                  <strong>{runner.summary.completedCount}</strong> completed ·{' '}
                  <span className='small'>
                    {runner.summary.skippedCount} skipped ·{' '}
                    {runner.summary.onTimePercentage}% on-time
                  </span>
                </div>
              </div>

              {/* XP Breakdown */}
              <div style={{ marginBottom: '16px' }}>
                <div className='small'>XP Earned</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div>
                    <strong
                      style={{ fontSize: '1.5rem', color: 'var(--mint)' }}
                    >
                      {runner.summary.xpBreakdown.total} XP
                    </strong>
                  </div>
                  <div className='small'>
                    • {runner.summary.xpBreakdown.stepXP} from steps
                  </div>
                  <div className='small'>
                    • {runner.summary.xpBreakdown.routineBonus} routine bonus
                  </div>
                  {runner.summary.xpBreakdown.perfectBonus > 0 && (
                    <div className='small' style={{ color: 'var(--mint)' }}>
                      • {runner.summary.xpBreakdown.perfectBonus} perfect bonus
                      🌟
                    </div>
                  )}
                </div>
              </div>

              {/* Step log */}
              <div style={{ marginBottom: '16px' }}>
                <div className='small'>Step Log</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '8px'
                  }}
                >
                  {runner.summary.steps.map((step, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--glass-bg)',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span>
                        {step.status === 'completed' ? '✓' : '⊘'}{' '}
                        {step.stepLabel}
                      </span>
                      {step.status === 'skipped' && step.reason && (
                        <span className='small'> - {step.reason}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions - TAB-RTN-32: Added Save as Template */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'space-between'
                }}
              >
                <button type="button"
                  className='btn'
                  onClick={handleSaveAsTemplate}
                  aria-label='Save routine as template'
                >
                  <Icon name='file' />
                  Save as Template
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button"
                    className='btn'
                    onClick={() => {
                      runner.reset()
                      setSelectedRoutine(null)
                    }}
                  >
                    Close
                  </button>
                  <button type="button"
                    className='btn btn-primary'
                    onClick={() => {
                      runner.reset()
                      // Keep routine selected for another run
                    }}
                  >
                    Run Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--glass-hi)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 300 /* --z-toast */
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* TAB-RTN-18: Cancel confirmation modal */}
      {showCancelConfirm && (
        <ConfirmModal
          title='Cancel Routine?'
          message='Would you like to keep your partial progress (logs and XP)?'
          confirmText='Keep Progress'
          cancelText='Discard All'
          onConfirm={() => confirmCancel(true)}
          onCancel={() => confirmCancel(false)}
          onClose={() => setShowCancelConfirm(false)}
        />
      )}

      {/* Routine Creation Modal */}
      <RoutineCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateRoutine={handleCreateRoutine}
      />
    </>
  )
}

export default Routines
