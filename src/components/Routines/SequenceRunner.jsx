import { formatTime } from '../../utils/routineRunner'
import Icon from '../common/Icon'
import StepCard from './StepCard'

// Figma-sourced step colour palette — cycles by step index
export const STEP_COLORS = [
  { base: 'rgba(239, 68, 68, 0.7)', glow: 'rgba(239, 68, 68, 0.15)', inset: 'rgba(239, 68, 68, 0.04)' },
  { base: 'rgba(59, 130, 246, 0.7)', glow: 'rgba(59, 130, 246, 0.15)', inset: 'rgba(59, 130, 246, 0.04)' },
  { base: 'rgba(168, 85, 247, 0.7)', glow: 'rgba(168, 85, 247, 0.15)', inset: 'rgba(168, 85, 247, 0.04)' },
  { base: 'rgba(236, 72, 153, 0.7)', glow: 'rgba(236, 72, 153, 0.15)', inset: 'rgba(236, 72, 153, 0.04)' },
  { base: 'rgba(34, 197, 94, 0.7)', glow: 'rgba(34, 197, 94, 0.15)', inset: 'rgba(34, 197, 94, 0.04)' },
  { base: 'rgba(251, 146, 60, 0.7)', glow: 'rgba(251, 146, 60, 0.15)', inset: 'rgba(251, 146, 60, 0.04)' },
]

const TIMER_RADIUS = 88
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS // ≈ 553

/**
 * Figma gamified sequence runner.
 *
 * Props:
 *  runner              - result of useRoutineRunner()
 *  prefersReducedMotion - boolean, respects prefers-reduced-motion
 *  onCancel            - callback to trigger cancel confirmation
 */
export default function SequenceRunner({ runner, prefersReducedMotion, onCancel }) {
  // Derived stats for the stats bar
  const completedCount =
    (runner.state?.completedSteps?.length ?? 0) +
    (runner.state?.skippedSteps?.length ?? 0)
  const xpSoFar =
    runner.state?.completedSteps?.reduce((sum, s) => sum + (s.xp ?? 0), 0) ?? 0

  const allSteps = runner.state?.routine?.steps ?? []
  const currentStepIndex = runner.state?.currentStepIndex ?? 0
  const currentStepColor = STEP_COLORS[currentStepIndex % STEP_COLORS.length]

  const rawStepDuration = runner.currentStep?.duration
  const stepDuration =
    Number.isFinite(rawStepDuration) && rawStepDuration > 0 ? rawStepDuration : 1
  const rawStepProgress =
    Number.isFinite(rawStepDuration) && rawStepDuration > 0
      ? 1 - (runner.state?.remainingSeconds ?? 0) / stepDuration
      : 1
  const stepProgress = Math.max(0, Math.min(1, rawStepProgress))
  const timerDashOffset = TIMER_CIRCUMFERENCE * (1 - stepProgress)

  return (
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
          <div className='rseq-stat-badge' role='group' aria-label={`${completedCount} steps completed`}>
            <svg className='rseq-stat-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
              <path d='M20 6 9 17l-5-5' />
            </svg>
            <div>
              <div className='rseq-stat-value'>{completedCount}</div>
              <div className='rseq-stat-label'>Done</div>
            </div>
          </div>

          <div className='rseq-stat-badge' role='group' aria-label={`${xpSoFar} XP earned`}>
            <svg className='rseq-stat-icon rseq-stat-icon--xp' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
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
          <div className='rseq-progress-fill' style={{ width: `${runner.progress}%` }} />
        </div>
        <p className='rseq-step-count'>
          Step {currentStepIndex + 1} of {allSteps.length}
        </p>
      </div>

      {/* Triptych: Previous | Current (timer) | Next */}
      <div className='rseq-triptych'>
        {/* Previous step */}
        <div className='rseq-card rseq-card--dim'>
          {runner.previousStep ? (
            <>
              <div className='rseq-card-label'>Previous</div>
              <div className='rseq-card-title'>{runner.previousStep.label}</div>
              {(() => {
                const prevIdx = (runner.state?.currentStepIndex ?? 1) - 1
                const wasSkipped = runner.state?.skippedSteps?.some(
                  (s) => s.stepIndex === prevIdx
                )
                return (
                  <div className={`rseq-completed-badge${wasSkipped ? ' rseq-completed-badge--skipped' : ''}`}>
                    {!wasSkipped && (
                      <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
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

        {/* Current step */}
        <div
          className='rseq-card rseq-card--current'
          style={{
            borderColor: currentStepColor.base,
            boxShadow: `0 0 40px ${currentStepColor.glow}, inset 0 0 60px ${currentStepColor.inset}`,
          }}
        >
          <div className='rseq-current-status' style={{ color: currentStepColor.base }}>
            Current &bull; {runner.state.isPaused ? 'Paused' : 'Running'}
          </div>
          <div className='rseq-card-title rseq-current-title'>
            {runner.currentStep?.label}
          </div>

          {/* Circular SVG Timer */}
          <div className='rseq-timer-wrap' aria-hidden='true'>
            <svg className='rseq-timer-svg' viewBox='0 0 192 192' role='presentation'>
              <circle cx='96' cy='96' r={TIMER_RADIUS} stroke='rgba(255, 255, 255, 0.05)' strokeWidth='8' fill='none' />
              <circle
                cx='96'
                cy='96'
                r={TIMER_RADIUS}
                stroke={currentStepColor.base}
                strokeWidth='8'
                fill='none'
                strokeLinecap='round'
                style={{
                  strokeDasharray: TIMER_CIRCUMFERENCE,
                  strokeDashoffset: timerDashOffset,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  filter: `drop-shadow(0 0 6px ${currentStepColor.base})`,
                  transition: prefersReducedMotion ? 'none' : 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            <div className='rseq-timer-text'>
              <span className='rseq-timer-digits'>{runner.remainingTime}</span>
              <span className='rseq-timer-label'>remaining</span>
              <span className='sr-only' aria-live='polite'>
                {formatTime(runner.state?.remainingSeconds ?? 0, { verbose: true })}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className='rseq-controls'>
            <button type='button' className='rseq-btn' onClick={runner.complete} aria-label='Complete current step' disabled={!runner.state.isRunning}>
              <Icon name='check' />
              <span className='rseq-btn-label'>Complete</span>
            </button>
            <button type='button' className='rseq-btn' onClick={runner.togglePause} aria-label={runner.state.isPaused ? 'Resume routine' : 'Pause routine'}>
              <Icon name={runner.state.isPaused ? 'play' : 'pause'} />
              <span className='rseq-btn-label'>{runner.state.isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button type='button' className='rseq-btn' onClick={() => runner.skip()} aria-label='Skip current step' disabled={!runner.state.isRunning}>
              <Icon name='skip' />
              <span className='rseq-btn-label'>Skip</span>
            </button>
            <button type='button' className='rseq-btn rseq-btn--danger' onClick={onCancel} aria-label='Cancel routine'>
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
              <div className='rseq-next-duration'>{formatTime(runner.nextStep.duration)}</div>
            </>
          ) : (
            <div className='rseq-card-label'>—</div>
          )}
        </div>
      </div>

      {/* All Steps Grid */}
      <div
        className='rseq-steps-grid'
        style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(allSteps.length, 5))}, 1fr)` }}
      >
        {allSteps.map((step, index) => {
          const isSkipped = runner.state?.skippedSteps?.some((s) => s.stepIndex === index) ?? false
          const isCompleted = runner.state?.completedSteps?.some((s) => s.stepIndex === index) ?? false
          const isDone = isCompleted || isSkipped
          const isCurrent = index === currentStepIndex
          const stepColor = STEP_COLORS[index % STEP_COLORS.length]
          return (
            <StepCard
              key={step.id ?? index}
              step={step}
              index={index}
              isCurrent={isCurrent}
              isDone={isDone}
              isCompleted={isCompleted}
              isSkipped={isSkipped}
              stepProgress={stepProgress}
              stepColor={stepColor}
            />
          )
        })}
      </div>
    </div>
  )
}
