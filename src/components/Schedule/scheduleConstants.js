/**
 * Shared constants and pure utility functions for schedule grid views.
 * Extracted from FigmaScheduleGrid.jsx to keep each view file focused.
 */

/* ── Period colours (from Figma Schedule.tsx) ───────────────────────────── */
export const PERIOD_COLORS = {
  night: {
    bg: 'rgba(10, 5, 40, 0.88)',
    border: 'rgba(40, 35, 80, 0.6)',
    text: 'rgba(140,135,180,0.9)',
    label: 'Night',
    dot: '#5550a0'
  },
  morning: {
    bg: 'rgba(130, 70, 15, 0.80)',
    border: 'rgba(200, 140, 60, 0.6)',
    text: 'rgba(255,220,180,0.95)',
    label: 'Morning',
    dot: '#e8b880'
  },
  afternoon: {
    bg: 'rgba(10, 90, 105, 0.80)',
    border: 'rgba(30, 170, 195, 0.55)',
    text: 'rgba(200,235,240,0.95)',
    label: 'Afternoon',
    dot: '#a0d0d8'
  },
  evening: {
    bg: 'rgba(65, 15, 85, 0.80)',
    border: 'rgba(140, 60, 170, 0.55)',
    text: 'rgba(210,185,225,0.95)',
    label: 'Evening',
    dot: '#c0a0d0'
  }
}

/* ── Event type colours (from Figma Schedule.tsx) ────────────────────────── */
export const EVENT_TYPE_COLORS = {
  task: {
    bg: 'rgba(230,65,65,0.22)',
    border: 'rgba(250,90,90,0.55)',
    text: 'rgba(255,165,155,0.95)'
  },
  routine: {
    bg: 'rgba(30,200,230,0.22)',
    border: 'rgba(50,220,250,0.55)',
    text: 'rgba(120,240,255,0.95)'
  },
  habit: {
    bg: 'rgba(160,55,235,0.22)',
    border: 'rgba(185,85,255,0.55)',
    text: 'rgba(215,160,255,0.95)'
  },
  event: {
    bg: 'rgba(55,100,240,0.22)',
    border: 'rgba(75,130,255,0.55)',
    text: 'rgba(150,190,255,0.95)'
  }
}

/** Grid line colour — used for borders in week/month views */
export const LINE_COLOR = 'rgba(255,255,255,0.04)'

/** Width (px) of the time-label column in day/week views */
export const TIME_COL_W = 60

/** Map an hour (0-23) to its period key */
export function getPeriod(hour) {
  if (hour >= 7 && hour < 13) return 'morning'
  if (hour >= 13 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

/** Parse 'HH:mm' time string to decimal hours */
export function parseHour(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h + (m || 0) / 60
}

/** Format an hour number as a time label, respecting 24h/12h user preference */
export function formatHourLabel(hour, use24h) {
  if (use24h !== false) return `${String(hour).padStart(2, '0')}:00`
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

/** Format an 'HH:mm' or '24:00' time string respecting the user's 12h/24h preference */
export function formatEventTime(timeStr, use24h) {
  if (!timeStr) return ''
  if (timeStr === '24:00') return use24h !== false ? '24:00' : '12:00 AM'
  const [h, m] = timeStr.split(':').map(Number)
  if (use24h !== false) return timeStr
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Build an overlap-aware column layout map for a list of events.
 * Returns a Map<eventId, { column: number, columns: number }>.
 */
export function buildOverlapLayout(events) {
  const sorted = [...events]
    .map((evt) => ({ evt, startH: parseHour(evt.startTime), endH: parseHour(evt.endTime || evt.startTime) }))
    .sort((a, b) => (a.startH !== b.startH ? a.startH - b.startH : a.endH - b.endH))

  const layoutMap = new Map()
  let cluster = []
  let active = []

  const finalizeCluster = () => {
    if (cluster.length === 0) return
    const cols = Math.max(...cluster.map((x) => x.column + 1), 1)
    for (const item of cluster) layoutMap.set(item.evt.id, { column: item.column, columns: cols })
    cluster = []
    active = []
  }

  for (const item of sorted) {
    active = active.filter((a) => a.endH > item.startH)
    if (cluster.length > 0 && active.length === 0) finalizeCluster()
    const usedCols = new Set(active.map((a) => a.column))
    let col = 0
    while (usedCols.has(col)) col++
    const positioned = { ...item, column: col }
    cluster.push(positioned)
    active.push(positioned)
  }
  finalizeCluster()
  return layoutMap
}
