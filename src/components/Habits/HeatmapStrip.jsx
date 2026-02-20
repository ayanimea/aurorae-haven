
import PropTypes from 'prop-types'
import dayjs from 'dayjs'

/**
 * HeatmapStrip - Compact heatmap visualization for habit completions
 * TAB-HAB-09: Shows 28-35 days with squares/dots indicating completion
 * TAB-HAB-13: Left to right, oldest to newest, today outlined
 * TAB-HAB-14: Completion intensity varies by streak
 */
function HeatmapStrip({ completions, vacationDates, daysToShow = 28 }) {
  const today = dayjs()
  const dates = []

  // Generate array of dates from oldest to newest
  for (let i = daysToShow - 1; i >= 0; i--) {
    dates.push(today.subtract(i, 'day'))
  }

  const getCompletionForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD')
    return completions.find((c) => c.date === dateStr)
  }

  const isVacation = (date) => {
    const dateStr = date.format('YYYY-MM-DD')
    return vacationDates && vacationDates.includes(dateStr)
  }

  const getCellColor = (date) => {
    const completion = getCompletionForDate(date)
    const vacation = isVacation(date)

    if (vacation) {
      return '#3d4263' // Vacation - neutral color with pattern
    } else if (completion) {
      return '#86f5e0' // Completed - mint color
    } else {
      return '#1a1d2e' // Not completed - background color
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        alignItems: 'center',
        marginTop: '0.5rem'
      }}
    >
      {dates.map((date, index) => {
        const isToday = date.isSame(today, 'day')
        const completion = getCompletionForDate(date)
        const vacation = isVacation(date)

        return (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: getCellColor(date),
              border: isToday ? '1px solid #86f5e0' : '1px solid #2a2e47',
              position: 'relative',
              backgroundImage: vacation
                ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                : 'none'
            }}
            title={`${date.format('MMM D')}: ${completion ? 'Completed' : vacation ? 'Vacation' : 'Not done'}`}
            role='img'
            aria-label={`${date.format('MMMM D')}: ${completion ? 'Completed' : vacation ? 'Vacation day' : 'Not completed'}`}
          />
        )
      })}
    </div>
  )
}

HeatmapStrip.propTypes = {
  completions: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      timestamp: PropTypes.number
    })
  ),
  vacationDates: PropTypes.arrayOf(PropTypes.string),
  daysToShow: PropTypes.number
}

HeatmapStrip.defaultProps = {
  completions: [],
  vacationDates: [],
  daysToShow: 28
}

export default HeatmapStrip
