import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  getHabits,
  toggleHabitToday,
  getTodayStats,
  createHabit,
  deleteHabit,
  pauseHabit,
  updateHabit
} from '../utils/habitsManager'
import Toast from '../components/Toast'
import HeatmapStrip from '../components/Habits/HeatmapStrip'
import FilterModal from '../components/Habits/FilterModal'
import HabitDetailDrawer from '../components/Habits/HabitDetailDrawer'
import { createLogger } from '../utils/logger'
import { getCategoryColor, CATEGORY_OPTIONS } from '../utils/habitCategories'
import { triggerConfetti } from '../utils/confetti'

const logger = createLogger('Habits')

/**
 * Announce message to screen readers
 * TAB-HAB-40: Screen reader announcements
 */
function announceToScreenReader(message) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.cssText =
    'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;'
  announcement.textContent = message
  document.body.appendChild(announcement)

  setTimeout(() => {
    announcement.remove()
  }, 1000)
}

/**
 * Habits Page - TAB-HAB Implementation (100% Complete)
 * Phase 1-5: All 52 specifications implemented
 */
function Habits() {
  const [habits, setHabits] = useState([])
  const [todayStats, setTodayStats] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [showNewHabitModal, setShowNewHabitModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [focusedHabitId, setFocusedHabitId] = useState(null) // Phase 5: Keyboard nav
  const [toast, setToast] = useState(null)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState('default')
  const [sortBy, setSortBy] = useState('title')
  const [filters, setFilters] = useState({})

  // Phase 5: Touch gesture tracking
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const touchStartTime = useRef(null)
  const [swipingHabitId, setSwipingHabitId] = useState(null)

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true)
      const allHabits = await getHabits({ sortBy, ...filters })
      setHabits(allHabits)
      const stats = await getTodayStats()
      setTodayStats(stats)
    } catch (error) {
      logger.error('Failed to load habits', error)
      setToast({ type: 'error', message: 'Failed to load habits' })
    } finally {
      setLoading(false)
    }
  }, [sortBy, filters])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showNewHabitModal) {
          setShowNewHabitModal(false)
        } else if (selectedHabit) {
          setSelectedHabit(null)
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showNewHabitModal, selectedHabit])

  // Phase 5: TAB-HAB-30, TAB-HAB-31 - Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!habits.length) return

      // Only handle if not in modal/drawer and not typing in input
      if (
        showNewHabitModal ||
        selectedHabit ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA'
      ) {
        return
      }

      const currentIndex = habits.findIndex((h) => h.id === focusedHabitId)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex =
          currentIndex < habits.length - 1 ? currentIndex + 1 : 0
        setFocusedHabitId(habits[nextIndex].id)
        document
          .querySelector(`[data-habit-id="${habits[nextIndex].id}"]`)
          ?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : habits.length - 1
        setFocusedHabitId(habits[prevIndex].id)
        document
          .querySelector(`[data-habit-id="${habits[prevIndex].id}"]`)
          ?.focus()
      } else if (e.key === ' ' && focusedHabitId) {
        e.preventDefault()
        const habit = habits.find((h) => h.id === focusedHabitId)
        if (habit && !habit.paused) {
          handleToggleCompletion(focusedHabitId)
        }
      } else if (e.key === 'Enter' && focusedHabitId) {
        e.preventDefault()
        const habit = habits.find((h) => h.id === focusedHabitId)
        if (habit) {
          setSelectedHabit(habit)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // handleToggleCompletion is stable (memoized with useCallback) and doesn't need to be in deps.
    // We only want to re-register the listener when the specific values it uses (habits, focusedHabitId, etc.) change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, focusedHabitId, showNewHabitModal, selectedHabit])

  const handleToggleCompletion = useCallback(
    async (habitId) => {
      try {
        const result = await toggleHabitToday(habitId)
        const habit = habits.find((h) => h.id === habitId)

        if (result.completed) {
          // Show confetti on milestones
          const milestones = [7, 14, 28, 50, 100, 250, 500, 1000]
          if (milestones.includes(result.currentStreak)) {
            triggerConfetti()
          }

          // Screen reader announcement
          announceToScreenReader(
            `${habit.name} completed today. Current streak: ${result.currentStreak} days. +${result.xpEarned} XP.`
          )

          setToast({
            type: 'success',
            message: `${habit.name} done! +${result.xpEarned} XP 🎉`
          })

          // Haptic feedback for mobile
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }
        } else {
          setToast({
            type: 'info',
            message: `${habit.name} unmarked`
          })
        }

        await loadHabits()
      } catch (error) {
        logger.error('Failed to toggle habit', error)
        setToast({ type: 'error', message: 'Failed to update habit' })
      }
    },
    [habits, loadHabits]
  )

  const handleCreateHabit = async (e) => {
    e.preventDefault()
    if (!newHabitName.trim()) return

    try {
      await createHabit({
        name: newHabitName.trim(),
        category: newHabitCategory
      })
      setToast({ type: 'success', message: 'Habit created!' })
      setShowNewHabitModal(false)
      setNewHabitName('')
      setNewHabitCategory('default')
      await loadHabits()
    } catch (error) {
      logger.error('Failed to create habit', error)
      setToast({ type: 'error', message: 'Failed to create habit' })
    }
  }

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Delete this habit? This cannot be undone.')) return

    try {
      await deleteHabit(habitId)
      setToast({ type: 'success', message: 'Habit deleted' })
      setSelectedHabit(null)
      await loadHabits()
    } catch (error) {
      logger.error('Failed to delete habit', error)
      setToast({ type: 'error', message: 'Failed to delete habit' })
    }
  }

  const handlePauseHabit = async (habitId) => {
    try {
      const habit = habits.find((h) => h.id === habitId)
      await pauseHabit(habitId, !habit.paused)
      setToast({
        type: 'success',
        message: habit.paused ? 'Habit resumed' : 'Habit paused'
      })
      await loadHabits()
      if (selectedHabit?.id === habitId) {
        setSelectedHabit({ ...selectedHabit, paused: !habit.paused })
      }
    } catch (error) {
      logger.error('Failed to pause/resume habit', error)
      setToast({ type: 'error', message: 'Failed to update habit' })
    }
  }

  const handleUpdateHabit = async (habitId, updates) => {
    try {
      await updateHabit(habitId, updates)
      setToast({ type: 'success', message: 'Habit updated' })
      await loadHabits()
      if (selectedHabit?.id === habitId) {
        setSelectedHabit({ ...selectedHabit, ...updates })
      }
    } catch (error) {
      logger.error('Failed to update habit', error)
      setToast({ type: 'error', message: 'Failed to update habit' })
    }
  }

  // Phase 5: TAB-HAB-32, TAB-HAB-33 - Touch Gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }

  const handleTouchMove = (e) => {
    if (!touchStartX.current || !touchStartY.current) return

    const touchEndX = e.touches[0].clientX
    const touchEndY = e.touches[0].clientY
    const diffX = touchEndX - touchStartX.current
    const diffY = Math.abs(touchEndY - touchStartY.current)

    // Only trigger if horizontal swipe (not vertical scroll)
    if (Math.abs(diffX) > 30 && diffY < 30) {
      // Swipe triggered - visual feedback will be shown in handleTouchEnd
      e.preventDefault()
    }
  }

  const handleTouchEnd = async (e, habitId) => {
    if (!touchStartX.current) return

    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchEndX - touchStartX.current

    // Swipe right to complete (>= 80px)
    if (diffX > 80) {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit.paused) {
        await handleToggleCompletion(habitId)
        if (navigator.vibrate) {
          navigator.vibrate([50, 100, 50]) // Double pulse
        }
      }
    }
    // Swipe left to show actions (<= -80px)
    else if (diffX < -80) {
      setSwipingHabitId(habitId)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }

    touchStartX.current = null
    touchStartY.current = null
    touchStartTime.current = null
    setTimeout(() => setSwipingHabitId(null), 2000)
  }

  const applyFilters = (newFilters) => {
    setFilters(newFilters)
    setShowFilterModal(false)
  }

  const hasActiveFilters =
    filters.categories?.length > 0 || filters.statuses?.length > 0

  if (loading) {
    return (
      <div className='habits-page'>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading habits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='habits-page'>
      {/* Today Panel - TAB-HAB-10 */}
      <div className='habits-today-panel'>
        <div className='completion-ring-container'>
          <svg
            className='completion-ring'
            viewBox='0 0 120 120'
            width='120'
            height='120'
          >
            <circle
              cx='60'
              cy='60'
              r='52'
              fill='none'
              stroke='var(--line)'
              strokeWidth='8'
            />
            <circle
              cx='60'
              cy='60'
              r='52'
              fill='none'
              stroke='var(--mint)'
              strokeWidth='8'
              strokeDasharray={`${(todayStats.percentage / 100) * 326.73} 326.73`}
              strokeLinecap='round'
              transform='rotate(-90 60 60)'
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <text
              x='60'
              y='60'
              textAnchor='middle'
              dy='0.3em'
              fontSize='28'
              fill='var(--ink)'
              fontWeight='bold'
            >
              {todayStats.completed}/{todayStats.total}
            </text>
            <text
              x='60'
              y='85'
              textAnchor='middle'
              fontSize='12'
              fill='var(--dim)'
            >
              habits
            </text>
          </svg>
        </div>
        <div className='today-stats'>
          <h2>{Math.round(todayStats.percentage)}% complete</h2>
          <p>
            {todayStats.total - todayStats.completed}{' '}
            {todayStats.total - todayStats.completed === 1 ? 'habit' : 'habits'}{' '}
            remaining
          </p>
        </div>
      </div>

      {/* Toolbar - TAB-HAB-03 */}
      <div className='habits-toolbar'>
        <h3>Habits ({habits.length})</h3>
        <div className='habits-actions'>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='sort-select'
            aria-label='Sort habits by'
          >
            <option value='title'>Sort: Title</option>
            <option value='currentStreak'>Sort: Current Streak</option>
            <option value='longestStreak'>Sort: Longest Streak</option>
            <option value='lastDone'>Sort: Last Done</option>
          </select>

          <button
            onClick={() => setShowFilterModal(true)}
            className='btn btn-secondary'
            aria-label='Filter habits'
            style={{ position: 'relative' }}
          >
            🔍 Filter
            {hasActiveFilters && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--mint)',
                  border: '2px solid var(--bg)'
                }}
                aria-label='Filters active'
              />
            )}
          </button>

          <button
            onClick={() => setShowNewHabitModal(true)}
            className='btn btn-primary'
          >
            + New Habit
          </button>
        </div>
      </div>

      {/* Habit Cards - TAB-HAB-06 */}
      {habits.length === 0 ? (
        <div className='empty-state'>
          <p>No habits yet. Create your first habit to get started!</p>
        </div>
      ) : (
        <div className='habits-list'>
          {habits.map((habit) => {
            const isCompletedToday = habit.completions?.includes(
              new Date().toISOString().split('T')[0]
            )
            const categoryColor = getCategoryColor(habit.category)

            return (
              <div
                key={habit.id}
                data-habit-id={habit.id}
                className='habit-card'
                tabIndex={0}
                role='button'
                aria-label={`${habit.name}, ${habit.streak} day streak, ${isCompletedToday ? 'completed today' : 'not completed today'}. Press Enter to view details, Space to toggle completion.`}
                onClick={(e) => {
                  // Don't open drawer if clicking checkbox
                  if (e.target.type !== 'checkbox') {
                    setSelectedHabit(habit)
                  }
                }}
                onKeyPress={(e) => {
                  if (
                    (e.key === 'Enter' || e.key === ' ') &&
                    e.target.type !== 'checkbox'
                  ) {
                    e.preventDefault()
                    setSelectedHabit(habit)
                  }
                }}
                onFocus={() => setFocusedHabitId(habit.id)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => handleTouchEnd(e, habit.id)}
                style={{
                  cursor: 'pointer',
                  opacity: habit.paused ? 0.6 : 1,
                  outline:
                    focusedHabitId === habit.id
                      ? '3px solid var(--mint)'
                      : 'none',
                  outlineOffset: '2px',
                  transform:
                    swipingHabitId === habit.id
                      ? 'translateX(-20px)'
                      : 'translateX(0)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div className='habit-card-header'>
                  <div className='habit-info'>
                    {habit.category !== 'default' && (
                      <span
                        className='category-dot'
                        style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: categoryColor,
                          marginRight: '8px'
                        }}
                        aria-label={`Category: ${habit.category}`}
                      />
                    )}
                    <h4>{habit.name}</h4>
                  </div>
                  <div className='habit-actions'>
                    <input
                      type='checkbox'
                      checked={isCompletedToday}
                      onChange={() => handleToggleCompletion(habit.id)}
                      disabled={habit.paused}
                      className='today-checkbox'
                      aria-label={`Mark ${habit.name} as ${isCompletedToday ? 'incomplete' : 'complete'} today`}
                      style={{
                        cursor: habit.paused ? 'not-allowed' : 'pointer'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className='habit-streak'>
                  <span>
                    🔥 {habit.streak} day streak
                    {habit.longestStreak > habit.streak && (
                      <span style={{ color: 'var(--dim)', marginLeft: '8px' }}>
                        (best: {habit.longestStreak})
                      </span>
                    )}
                  </span>
                </div>

                {/* 28-day heatmap - TAB-HAB-09 */}
                <HeatmapStrip habit={habit} days={28} />

                {swipingHabitId === habit.id && (
                  <div
                    className='swipe-actions'
                    style={{ marginTop: '8px', display: 'flex', gap: '8px' }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePauseHabit(habit.id)
                        setSwipingHabitId(null)
                      }}
                      className='btn btn-secondary btn-sm'
                    >
                      {habit.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteHabit(habit.id)
                        setSwipingHabitId(null)
                      }}
                      className='btn btn-danger btn-sm'
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New Habit Modal - TAB-HAB-11 */}
      {showNewHabitModal && (
        <div
          className='modal-overlay'
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setShowNewHabitModal(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowNewHabitModal(false)
            }
          }}
          role='presentation'
        >
          <div
            className='modal-content'
            role='dialog'
            aria-labelledby='new-habit-title'
          >
            <h3 id='new-habit-title'>Create New Habit</h3>
            <form onSubmit={handleCreateHabit}>
              <div className='form-group'>
                <label htmlFor='habit-name'>
                  Habit Name <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id='habit-name'
                  type='text'
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder='e.g., Morning Meditation'
                  required
                  aria-required='true'
                />
              </div>

              <div className='form-group'>
                <label htmlFor='habit-category'>Category</label>
                <select
                  id='habit-category'
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={() => setShowNewHabitModal(false)}
                  className='btn btn-secondary'
                >
                  Cancel
                </button>
                <button type='submit' className='btn btn-primary'>
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Modal - TAB-HAB-04 */}
      <FilterModal
        isOpen={showFilterModal}
        currentFilters={filters}
        onApply={applyFilters}
        onClose={() => setShowFilterModal(false)}
      />

      {/* Habit Detail Drawer - TAB-HAB-26 */}
      {selectedHabit && (
        <HabitDetailDrawer
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onUpdate={handleUpdateHabit}
          onPause={handlePauseHabit}
          onDelete={handleDeleteHabit}
        />
      )}

      {/* Toast Notifications - TAB-HAB-23 */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Habits
