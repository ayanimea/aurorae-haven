import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
import SequenceRunner from '../components/Routines/SequenceRunner'
import EventModal from '../components/Schedule/EventModal'
import EventService from '../services/EventService'
import {
  getCurrentDateISO,
  getCurrentTimeHHMM,
  minutesToTime
} from '../utils/timeUtils'

const logger = createLogger('Routines')

/** Minimum scheduled duration (minutes) when a routine has no recorded duration */
const MIN_ROUTINE_DURATION_MINUTES = 15

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

  // Schedule routine modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [routineToSchedule, setRoutineToSchedule] = useState(null)

  // Pre-compute initialData for the schedule modal whenever the selected routine changes
  const scheduleInitialData = useMemo(() => {
    if (!routineToSchedule) return null
    const durationMins = Math.max(
      MIN_ROUTINE_DURATION_MINUTES,
      Math.ceil((routineToSchedule.totalDuration || 0) / 60)
    )
    const startHHMM = getCurrentTimeHHMM()
    const [sh, sm] = startHHMM.split(':').map(Number)
    let startMins = sh * 60 + sm
    // If the routine would cross midnight (and its duration fits in one day),
    // shift the start earlier so the full duration fits within the day.
    // EventModal's <input type="time"> cannot represent '24:00' or overnight
    // ranges, so the end is always clamped to '23:59'.
    // For routines ≥ 24 h (durationMins >= 1440) there is no same-day window
    // large enough; start is left at current time and end is clamped to '23:59'.
    const endMins = startMins + durationMins
    if (endMins >= 1440 && durationMins < 1440) {
      startMins = 1440 - durationMins
    }
    const endTime = startMins + durationMins >= 1440 ? '23:59' : minutesToTime(startMins + durationMins)
    const startTime = minutesToTime(startMins)
    return {
      title: routineToSchedule.name || routineToSchedule.title || '',
      type: 'routine',
      day: getCurrentDateISO(),
      startTime,
      endTime,
      travelTime: 0,
      preparationTime: 0
    }
  }, [routineToSchedule])

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

  // Open schedule modal pre-filled with the selected routine
  const handleOpenScheduleModal = (routine) => {
    setRoutineToSchedule(routine)
    setShowScheduleModal(true)
  }

  // Save the routine as a schedule event
  const handleSaveScheduledRoutine = async (eventData) => {
    try {
      await EventService.createEvent(eventData)
      showToastNotification(
        `"${eventData.title}" added to schedule on ${eventData.day}`
      )
    } catch (error) {
      logger.error('Failed to schedule routine:', error)
      showToastNotification('Failed to add routine to schedule')
    } finally {
      setShowScheduleModal(false)
      setRoutineToSchedule(null)
    }
  }

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
        <SequenceRunner
          runner={runner}
          prefersReducedMotion={prefersReducedMotion}
          onCancel={handleCancelRoutine}
        />
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
                      className='btn'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenScheduleModal(routine)
                      }}
                      aria-label={`Schedule ${routine.name || routine.title}`}
                      title='Add to schedule'
                    >
                      <Icon name='calendar' />
                      Schedule
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
          isOpen={showCancelConfirm}
          title='Cancel Routine?'
          message='Would you like to keep your partial progress (logs and XP)?'
          confirmText='Keep Progress'
          cancelText='Discard All'
          onConfirm={() => confirmCancel(true)}
          onCancel={() => confirmCancel(false)}
        />
      )}

      {/* Routine Creation Modal */}
      <RoutineCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateRoutine={handleCreateRoutine}
      />

      {/* Schedule Routine Modal */}
      {showScheduleModal && scheduleInitialData && (
        <EventModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false)
            setRoutineToSchedule(null)
          }}
          onSave={handleSaveScheduledRoutine}
          eventType='routine'
          initialData={scheduleInitialData}
        />
      )}
    </>
  )
}

export default Routines
