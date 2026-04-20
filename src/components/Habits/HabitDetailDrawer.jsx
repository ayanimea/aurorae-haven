import { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getCategoryColor } from '../../utils/habitCategories'
import logger from '../../utils/logger'

/**
 * HabitDetailDrawer - Expanded view with full history and vacation mode
 * TAB-HAB-26: Detail drawer with full history
 * TAB-HAB-27: Completion history with filters
 * TAB-HAB-28: Vacation toggle
 * TAB-HAB-29: Brain Dump link integration
 */
function HabitDetailDrawer({ habit, onClose, onUpdateHabit }) {
  // Call hooks before any conditional returns
  const navigate = useNavigate()
  const [showVacationMode, setShowVacationMode] = useState(false)
  const [vacationStart, setVacationStart] = useState('')
  const [vacationEnd, setVacationEnd] = useState('')
  const [historyFilter, setHistoryFilter] = useState('30') // 7, 30, 90 days

  if (!habit) return null

  const categoryColor = getCategoryColor(habit.category)
  const completions = habit.completions || []
  const vacationDates = habit.vacationDates || []

  // Generate 90-day heatmap
  const generateHeatmap = () => {
    const today = dayjs()
    const days = []

    for (let i = 89; i >= 0; i--) {
      const date = today.subtract(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const isCompleted = completions.some((c) => c.date === dateStr)
      const isVacation = vacationDates.includes(dateStr)

      days.push({
        date: dateStr,
        display: date.format('MMM D'),
        isCompleted,
        isVacation,
        isToday: date.isSame(today, 'day')
      })
    }

    return days
  }

  const heatmapDays = generateHeatmap()

  // Group by week for better layout
  const weeks = []
  for (let i = 0; i < heatmapDays.length; i += 7) {
    weeks.push(heatmapDays.slice(i, i + 7))
  }

  // Filter completions based on selected period - TAB-HAB-27
  const getFilteredCompletions = () => {
    const days = parseInt(historyFilter, 10)
    const cutoff = dayjs().subtract(days, 'day').format('YYYY-MM-DD')
    return [...completions].filter((c) => c.date >= cutoff).reverse()
  }

  // Set vacation dates - TAB-HAB-28
  const handleSetVacation = () => {
    if (!vacationStart || !vacationEnd) return

    const start = dayjs(vacationStart)
    const end = dayjs(vacationEnd)

    if (end.isBefore(start)) {
      logger.warn('End date must be after start date')
      return
    }

    const newVacationDates = []
    let current = start
    while (current.isBefore(end) || current.isSame(end)) {
      newVacationDates.push(current.format('YYYY-MM-DD'))
      current = current.add(1, 'day')
    }

    const updatedHabit = {
      ...habit,
      vacationDates: [...new Set([...vacationDates, ...newVacationDates])]
    }

    onUpdateHabit(updatedHabit)
    setVacationStart('')
    setVacationEnd('')
    setShowVacationMode(false)
    logger.info(
      `Set ${newVacationDates.length} vacation days for ${habit.title}`
    )
  }

  const handleClearVacation = () => {
    const updatedHabit = {
      ...habit,
      vacationDates: []
    }
    onUpdateHabit(updatedHabit)
    logger.info(`Cleared all vacation days for ${habit.title}`)
  }

  // Export completion history - TAB-HAB-27
  const handleExport = (format) => {
    const filtered = getFilteredCompletions()

    if (format === 'csv') {
      // CSV format
      const csv = [
        'Date,Habit,Status',
        ...filtered.map((c) => `${c.date},${habit.title},Completed`)
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${habit.title.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      logger.info(`Exported ${filtered.length} completions as CSV`)
    } else if (format === 'markdown') {
      // Markdown format
      const markdown = [
        `# ${habit.title} - Completion History`,
        '',
        `**Export Date**: ${dayjs().format('YYYY-MM-DD')}`,
        `**Period**: Last ${historyFilter} days`,
        `**Current Streak**: ${habit.currentStreak || 0} days 🔥`,
        `**Best Streak**: ${habit.longestStreak || 0} days ⭐`,
        `**Total Completions**: ${completions.length}`,
        '',
        '## Completions',
        '',
        ...filtered.map((c) => `- ${dayjs(c.date).format('MMMM D, YYYY')} ✓`)
      ].join('\n')

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${habit.title.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.md`
      a.click()
      URL.revokeObjectURL(url)
      logger.info(`Exported ${filtered.length} completions as Markdown`)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '500px',
        maxWidth: '90vw',
        backgroundColor: 'var(--surface)',
        borderLeft: '1px solid var(--surface-raised)',
        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
        zIndex: 200 /* --z-modal */,
        overflowY: 'auto',
        padding: '1.5rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            {habit.category && habit.category !== 'default' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: categoryColor.bg
                }}
              />
            )}
            <h2 style={{ margin: 0 }}>{habit.name}</h2>
          </div>
          {habit.paused && (
            <span className='small' style={{ color: 'var(--streak)' }}>
              ⏸️ Paused
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
          aria-label='Close drawer'
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className='card-b' style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}
        >
          <div>
            <div
              className='small'
              style={{ color: 'var(--dim)', marginBottom: '0.25rem' }}
            >
              Current Streak
            </div>
            <strong style={{ fontSize: '1.5rem' }}>
              🔥 {habit.streak || 0} days
            </strong>
          </div>
          <div>
            <div
              className='small'
              style={{ color: 'var(--dim)', marginBottom: '0.25rem' }}
            >
              Best Streak
            </div>
            <strong style={{ fontSize: '1.5rem' }}>
              ⭐ {habit.longestStreak || 0} days
            </strong>
          </div>
          <div>
            <div
              className='small'
              style={{ color: 'var(--dim)', marginBottom: '0.25rem' }}
            >
              Total Completions
            </div>
            <strong style={{ fontSize: '1.5rem' }}>{completions.length}</strong>
          </div>
          <div>
            <div
              className='small'
              style={{ color: 'var(--dim)', marginBottom: '0.25rem' }}
            >
              XP Earned
            </div>
            <strong style={{ fontSize: '1.5rem' }}>✨ {habit.xp || 0}</strong>
          </div>
        </div>
      </div>

      {/* 90-Day Heatmap */}
      <div className='card-b' style={{ marginBottom: '1.5rem' }}>
        <strong style={{ display: 'block', marginBottom: '1rem' }}>
          Last 90 Days
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} style={{ display: 'flex', gap: '4px' }}>
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: day.isVacation
                      ? 'var(--surface-raised)'
                      : day.isCompleted
                        ? 'var(--mint)'
                        : 'var(--surface)',
                    border: day.isToday
                      ? '2px solid var(--mint)'
                      : '1px solid var(--surface-border)',
                    backgroundImage: day.isVacation
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                      : 'none'
                  }}
                  title={`${day.display}: ${day.isCompleted ? 'Completed' : day.isVacation ? 'Vacation' : 'Not done'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            fontSize: '0.875rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: 'var(--mint)'
              }}
            />
            <span className='small'>Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--surface-border)'
              }}
            />
            <span className='small'>Not done</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                backgroundColor: 'var(--surface-raised)',
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
              }}
            />
            <span className='small'>Vacation</span>
          </div>
        </div>
      </div>

      {/* Vacation Mode - TAB-HAB-28 */}
      <div className='card-b' style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}
        >
          <strong>Vacation Mode</strong>
          <button
            type='button'
            onClick={() => setShowVacationMode(!showVacationMode)}
            style={{
              padding: '0.5rem 1rem',
              background: showVacationMode
                ? 'var(--surface-border)'
                : 'var(--mint)',
              color: showVacationMode ? 'var(--dim)' : 'var(--paper)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            aria-expanded={showVacationMode}
          >
            {showVacationMode ? 'Hide' : 'Set Vacation Dates'}
          </button>
        </div>

        {showVacationMode && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <p
              className='small'
              style={{ color: 'var(--dim)', marginBottom: '0.5rem' }}
            >
              Vacation days preserve your streak without requiring completion.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor='vacation-start'
                  className='small'
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    color: 'var(--dim)'
                  }}
                >
                  Start Date
                </label>
                <input
                  id='vacation-start'
                  type='date'
                  value={vacationStart}
                  onChange={(e) => setVacationStart(e.target.value)}
                  min={dayjs().format('YYYY-MM-DD')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor='vacation-end'
                  className='small'
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    color: 'var(--dim)'
                  }}
                >
                  End Date
                </label>
                <input
                  id='vacation-end'
                  type='date'
                  value={vacationEnd}
                  onChange={(e) => setVacationEnd(e.target.value)}
                  min={vacationStart || dayjs().format('YYYY-MM-DD')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <button
                type='button'
                onClick={handleSetVacation}
                disabled={!vacationStart || !vacationEnd}
                style={{
                  padding: '0.5rem 1rem',
                  background:
                    !vacationStart || !vacationEnd
                      ? 'var(--surface-border)'
                      : 'var(--mint)',
                  color:
                    !vacationStart || !vacationEnd
                      ? 'var(--dim)'
                      : 'var(--paper)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor:
                    !vacationStart || !vacationEnd ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
                aria-label='Set vacation dates'
              >
                Set Vacation
              </button>
            </div>
            {vacationDates.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p
                  className='small'
                  style={{ color: 'var(--dim)', marginBottom: '0.5rem' }}
                >
                  {vacationDates.length} vacation{' '}
                  {vacationDates.length === 1 ? 'day' : 'days'} set
                </p>
                <button
                  type='button'
                  onClick={handleClearVacation}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'transparent',
                    color: 'var(--error)',
                    border: '1px solid var(--error)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Clear All Vacation Days
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Brain Dump Link - TAB-HAB-29 */}
      <div className='card-b' style={{ marginBottom: '1.5rem' }}>
        <button
          type='button'
          onClick={() => {
            // Create a Brain Dump note with habit context
            const habitInfo = `# ${habit.name}\n\n**Current Streak:** ${habit.streak || 0} days 🔥\n**Best Streak:** ${habit.longestStreak || 0} days ⭐\n**Total XP:** ${habit.xp || 0} ✨\n\n---\n\n*Write your thoughts about this habit here...*\n`
            // Navigate to Brain Dump with pre-filled content
            navigate('/brain-dump', { state: { prefill: habitInfo } })
            onClose()
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--accent-blue)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          aria-label={`Create Brain Dump note for ${habit.name}`}
        >
          📝 Link to Brain Dump
        </button>
        <p
          className='small'
          style={{
            color: 'var(--dim)',
            marginTop: '0.5rem',
            textAlign: 'center'
          }}
        >
          Create a note about this habit with your current stats
        </p>
      </div>

      {/* Recent History with Export - TAB-HAB-27 */}
      <div className='card-b'>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}
        >
          <strong>Completion History</strong>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--surface)',
                color: 'var(--ink)',
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
              aria-label='Filter completion history'
            >
              <option value='7'>Last 7 days</option>
              <option value='30'>Last 30 days</option>
              <option value='90'>Last 90 days</option>
            </select>
            <button
              type='button'
              onClick={() => handleExport('csv')}
              disabled={completions.length === 0}
              style={{
                padding: '0.375rem 0.75rem',
                background:
                  completions.length === 0
                    ? 'var(--surface-border)'
                    : 'var(--accent-blue)',
                color: completions.length === 0 ? 'var(--dim)' : 'var(--ink)',
                border: 'none',
                borderRadius: '8px',
                cursor: completions.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}
              aria-label='Export history as CSV'
            >
              CSV
            </button>
            <button
              type='button'
              onClick={() => handleExport('markdown')}
              disabled={completions.length === 0}
              style={{
                padding: '0.375rem 0.75rem',
                background:
                  completions.length === 0
                    ? 'var(--surface-border)'
                    : 'var(--accent-blue)',
                color: completions.length === 0 ? 'var(--dim)' : 'var(--ink)',
                border: 'none',
                borderRadius: '8px',
                cursor: completions.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}
              aria-label='Export history as Markdown'
            >
              MD
            </button>
          </div>
        </div>

        {completions.length === 0 ? (
          <p className='small' style={{ color: 'var(--dim)' }}>
            No completions yet. Start your streak today!
          </p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {getFilteredCompletions().map((completion, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem',
                  borderBottom:
                    idx < getFilteredCompletions().length - 1
                      ? '1px solid var(--surface-border)'
                      : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{dayjs(completion.date).format('MMM D, YYYY')}</span>
                <span className='small' style={{ color: 'var(--mint)' }}>
                  ✓ Completed
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

HabitDetailDrawer.propTypes = {
  habit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onUpdateHabit: PropTypes.func.isRequired
}

export default HabitDetailDrawer
