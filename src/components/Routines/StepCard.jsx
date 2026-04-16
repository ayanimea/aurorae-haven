import { formatTime } from '../../utils/routineRunner'

/**
 * A single step card shown in the "All Steps" grid during sequence runner.
 *
 * Props:
 *  step            - the step object { id, label, duration }
 *  index           - 0-based position in the steps array
 *  isCurrent       - true when this is the active step
 *  isDone          - true when completed or skipped
 *  isCompleted     - true when explicitly completed
 *  isSkipped       - true when explicitly skipped
 *  stepProgress    - number [0,1] — current step progress (only used when isCurrent)
 *  stepColor       - { base, glow } from STEP_COLORS palette
 */
export default function StepCard({
  step,
  index,
  isCurrent,
  isDone,
  isCompleted,
  isSkipped,
  stepProgress,
  stepColor,
}) {
  return (
    <div
      className={`rseq-step-card${isCurrent ? ' rseq-step-card--current' : ''}${isDone ? ' rseq-step-card--done' : ''}`}
      role='region'
      aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? ', completed' : isSkipped ? ', skipped' : isCurrent ? ', current' : ', pending'}`}
      style={
        isCurrent
          ? { borderColor: stepColor.base, boxShadow: `0 0 20px ${stepColor.glow}` }
          : undefined
      }
    >
      <div className='rseq-step-card-header'>
        <span className='rseq-step-card-title'>{step.label}</span>
        <span className='rseq-step-card-duration'>{formatTime(step.duration)}</span>
      </div>

      {isCompleted && (
        <div className='rseq-step-status rseq-step-status--done'>
          <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
            <path d='M13 4 6 11 3 8' />
          </svg>
          Done
        </div>
      )}

      {isSkipped && (
        <div className='rseq-step-status rseq-step-status--skipped'>Skipped</div>
      )}

      {isCurrent && (
        <div className='rseq-step-progress'>
          <div
            className='rseq-step-progress-fill'
            style={{
              width: `${Math.round(stepProgress * 100)}%`,
              backgroundColor: stepColor.base,
            }}
          />
        </div>
      )}

      {!isDone && !isCurrent && (
        <div className='rseq-step-status rseq-step-status--pending'>Pending</div>
      )}
    </div>
  )
}
