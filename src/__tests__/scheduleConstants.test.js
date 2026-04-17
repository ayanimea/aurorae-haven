import { describe, it, expect } from 'vitest'
import { buildOverlapLayout, expandMidnightSpanningEvents } from '../components/Schedule/scheduleConstants'

// ---------------------------------------------------------------------------
// buildOverlapLayout
// ---------------------------------------------------------------------------
describe('buildOverlapLayout', () => {
  it('returns an empty Map for an empty input', () => {
    expect(buildOverlapLayout([])).toEqual(new Map())
  })

  it('assigns column 0 to a single non-overlapping event', () => {
    const events = [{ id: 'a', startTime: '09:00', endTime: '10:00' }]
    const layout = buildOverlapLayout(events)
    expect(layout.get('a')).toEqual({ column: 0, columns: 1 })
  })

  it('assigns separate columns to two overlapping events', () => {
    const events = [
      { id: 'a', startTime: '09:00', endTime: '10:00' },
      { id: 'b', startTime: '09:30', endTime: '10:30' },
    ]
    const layout = buildOverlapLayout(events)
    const a = layout.get('a')
    const b = layout.get('b')
    expect(a.columns).toBe(2)
    expect(b.columns).toBe(2)
    expect(a.column).not.toBe(b.column)
  })

  it('does not cluster events that are back-to-back (no overlap)', () => {
    const events = [
      { id: 'a', startTime: '09:00', endTime: '10:00' },
      { id: 'b', startTime: '10:00', endTime: '11:00' },
    ]
    const layout = buildOverlapLayout(events)
    expect(layout.get('a')).toEqual({ column: 0, columns: 1 })
    expect(layout.get('b')).toEqual({ column: 0, columns: 1 })
  })

  it('assigns 3 columns to 3 simultaneous events', () => {
    const events = [
      { id: 'a', startTime: '10:00', endTime: '11:00' },
      { id: 'b', startTime: '10:00', endTime: '11:00' },
      { id: 'c', startTime: '10:00', endTime: '11:00' },
    ]
    const layout = buildOverlapLayout(events)
    const cols = new Set([layout.get('a').column, layout.get('b').column, layout.get('c').column])
    expect(cols.size).toBe(3)
    expect(layout.get('a').columns).toBe(3)
  })

  it('normalises overnight events (endH < startH) when computing overlap', () => {
    // An overnight event from 23:00 to 01:00 should be treated as 23:00–25:00
    // internally so it overlaps with a 23:30 event on the same day.
    const events = [
      { id: 'night', startTime: '23:00', endTime: '01:00' },
      { id: 'late', startTime: '23:30', endTime: '23:59' },
    ]
    const layout = buildOverlapLayout(events)
    // Both should be in the same cluster and have 2 columns
    expect(layout.get('night').columns).toBe(2)
    expect(layout.get('late').columns).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// expandMidnightSpanningEvents
// ---------------------------------------------------------------------------
describe('expandMidnightSpanningEvents', () => {
  it('returns the same array when there are no overnight events', () => {
    const events = [
      { id: '1', day: '2026-04-17', startTime: '09:00', endTime: '10:00' },
    ]
    const result = expandMidnightSpanningEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(events[0])
  })

  it('splits an overnight event into two segments', () => {
    const evt = { id: 'ov', day: '2026-04-17', startTime: '23:00', endTime: '01:00' }
    const result = expandMidnightSpanningEvents([evt])
    expect(result).toHaveLength(2)
    const [start, cont] = result
    // Start-day segment ends at '24:00'
    expect(start.day).toBe('2026-04-17')
    expect(start.endTime).toBe('24:00')
    expect(start._originalEvent).toBe(evt)
    // Continuation segment starts at '00:00' on the next day
    expect(cont.day).toBe('2026-04-18')
    expect(cont.startTime).toBe('00:00')
    expect(cont._continuation).toBe(true)
    expect(cont._originalEvent).toBe(evt)
  })

  it('gives the continuation segment a unique id that includes the target date', () => {
    const evt = { id: 'ov', day: '2026-04-17', startTime: '23:00', endTime: '01:00' }
    const [, cont] = expandMidnightSpanningEvents([evt])
    expect(cont.id).toBe('ov_cont_2026-04-18')
  })

  it('passes through all-day events unchanged', () => {
    const evt = { id: 'ad', day: '2026-04-17', startTime: '00:00', endTime: '23:59', allDay: true }
    const result = expandMidnightSpanningEvents([evt])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(evt)
  })

  it('passes through events with a "00:00" endTime unchanged (start-of-day, not overnight)', () => {
    const evt = { id: 'z', day: '2026-04-17', startTime: '00:00', endTime: '00:00' }
    const result = expandMidnightSpanningEvents([evt])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(evt)
  })

  it('handles month-end dates correctly (end-of-April → May)', () => {
    const evt = { id: 'apr', day: '2026-04-30', startTime: '23:30', endTime: '00:30' }
    const [, cont] = expandMidnightSpanningEvents([evt])
    expect(cont.day).toBe('2026-05-01')
  })

  it('handles year-end dates correctly (Dec 31 → Jan 1)', () => {
    const evt = { id: 'yr', day: '2026-12-31', startTime: '23:30', endTime: '00:30' }
    const [, cont] = expandMidnightSpanningEvents([evt])
    expect(cont.day).toBe('2027-01-01')
  })

  it('does not expand events where endTime equals startTime (exact match)', () => {
    const evt = { id: 'same', day: '2026-04-17', startTime: '10:00', endTime: '10:00' }
    const result = expandMidnightSpanningEvents([evt])
    expect(result).toHaveLength(1)
  })

  it('handles multiple events with mixed overnight / non-overnight', () => {
    const normal = { id: 'n', day: '2026-04-17', startTime: '09:00', endTime: '10:00' }
    const overnight = { id: 'o', day: '2026-04-17', startTime: '23:00', endTime: '01:00' }
    const result = expandMidnightSpanningEvents([normal, overnight])
    expect(result).toHaveLength(3)
    expect(result[0]).toBe(normal)
    expect(result[1].day).toBe('2026-04-17')
    expect(result[2].day).toBe('2026-04-18')
  })

  it('passes through events with missing startTime or endTime unchanged', () => {
    const evt = { id: 'x', day: '2026-04-17' }
    const result = expandMidnightSpanningEvents([evt])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(evt)
  })
})
