import { useState, useEffect } from 'react'
import { getStatsByType, isIndexedDBAvailable } from '../utils/indexedDBManager'
import { createLogger } from '../utils/logger'

const logger = createLogger('Stats')

function Stats() {
  const [stats, setStats] = useState({
    taskCompletions: [],
    habitStreaks: [],
    routineTimes: []
  })
  const [loading, setLoading] = useState(true)
  const [useIndexedDB, setUseIndexedDB] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      if (!isIndexedDBAvailable()) {
        setLoading(false)
        setUseIndexedDB(false)
        return
      }

      setUseIndexedDB(true)

      try {
        // Get statistics
        const [taskStats, habitStats, routineStats] = await Promise.all([
          getStatsByType('task_completion'),
          getStatsByType('habit_streak'),
          getStatsByType('routine_time')
        ])

        setStats({
          taskCompletions: taskStats,
          habitStreaks: habitStats,
          routineTimes: routineStats
        })
      } catch (e) {
        logger.error('Failed to load stats:', e)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className='card'>
        <div className='card-h'>
          <strong>Stats</strong>
          <span className='small'>Loading your progress...</span>
        </div>
        <div className='card-b'>
          <p>Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (!useIndexedDB) {
    return (
      <div className='card'>
        <div className='card-h'>
          <strong>Stats</strong>
          <span className='small'>Your progress overview</span>
        </div>
        <div className='card-b'>
          <p>
            Statistics tracking requires IndexedDB support. Your browser may not
            support this feature, or it may be disabled.
          </p>
          <p className='small'>
            Statistics will be automatically tracked as you use the app. This
            page will show aggregated metrics including task completions, habit
            streaks, and routine times.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='card'>
      <div className='card-h'>
        <strong>Stats</strong>
        <span className='small'>Your progress overview</span>
      </div>
      <div className='card-b'>
        {stats.taskCompletions.length === 0 &&
        stats.habitStreaks.length === 0 &&
        stats.routineTimes.length === 0 ? (
          <div>
            <p>No statistics available yet.</p>
            <p className='small'>
              Start using Tasks, Habits, and Routines to see your progress here!
            </p>
          </div>
        ) : (
          <div>
            {stats.taskCompletions.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Task Completions</h3>
                <p className='small'>
                  Total recorded: {stats.taskCompletions.length}
                </p>
              </div>
            )}

            {stats.habitStreaks.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Habit Streaks</h3>
                <p className='small'>
                  Total recorded: {stats.habitStreaks.length}
                </p>
              </div>
            )}

            {stats.routineTimes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Routine Times</h3>
                <p className='small'>
                  Total recorded: {stats.routineTimes.length}
                </p>
              </div>
            )}

            <p className='small' style={{ marginTop: '2rem', opacity: 0.7 }}>
              💡 Enhanced statistics with charts and visualizations coming in
              v2.0!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Stats
