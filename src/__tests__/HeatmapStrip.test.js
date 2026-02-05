import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import HeatmapStrip from '../components/Habits/HeatmapStrip'

describe('HeatmapStrip Component', () => {
  test('renders 28 day cells by default', () => {
    const { container } = render(
      <HeatmapStrip completions={[]} vacationDates={[]} />
    )

    const cells = container.querySelectorAll('[aria-label]')
    expect(cells.length).toBe(28)
  })

  test('marks today with outline', () => {
    const { container } = render(<HeatmapStrip completions={[]} />)

    // Find today's cell (last one in the list)
    const cells = container.querySelectorAll('[aria-label]')
    const todayCell = cells[cells.length - 1]

    // In jsdom v28, hex colors are converted to rgb()
    // Check the actual style attribute - border should contain the mint color
    const styleAttr = todayCell.getAttribute('style')
    expect(styleAttr).toContain('border')
    expect(styleAttr).toMatch(/border:.*rgb\(134, 245, 224\)|border:.*#86f5e0/)
  })

  test('shows completed days in mint color', () => {
    const today = new Date().toISOString().split('T')[0]
    const completions = [{ date: today, timestamp: Date.now() }]

    const { container } = render(<HeatmapStrip completions={completions} />)

    const cells = container.querySelectorAll('[aria-label]')
    const completedCell = cells[cells.length - 1] // Today is last cell

    expect(completedCell).toHaveStyle({ backgroundColor: '#86f5e0' })
  })

  test('shows incomplete days in dark color', () => {
    const { container } = render(<HeatmapStrip completions={[]} />)

    const cells = container.querySelectorAll('[aria-label]')
    const incompleteCell = cells[0]

    expect(incompleteCell).toHaveStyle({ backgroundColor: '#1a1d2e' })
  })

  test('shows vacation days with diagonal pattern', () => {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0]
    const vacationDates = [yesterday]

    const { container } = render(
      <HeatmapStrip completions={[]} vacationDates={vacationDates} />
    )

    const cells = container.querySelectorAll('[aria-label]')
    const vacationCell = cells[cells.length - 2] // Yesterday is second to last

    expect(vacationCell).toHaveStyle({
      backgroundImage: expect.stringContaining('repeating-linear-gradient')
    })
  })

  test('displays date in tooltip', () => {
    const { container } = render(<HeatmapStrip completions={[]} />)

    const cells = container.querySelectorAll('[aria-label]')
    const cell = cells[0]

    expect(cell).toHaveAttribute('title')
    expect(cell.getAttribute('title')).toMatch(/\w+ \d+:/)
  })

  test('orders cells from oldest to newest (left to right)', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split('T')[0]
    const today = new Date().toISOString().split('T')[0]
    const completions = [
      { date: sevenDaysAgo, timestamp: Date.now() - 7 * 86400000 },
      { date: today, timestamp: Date.now() }
    ]

    const { container } = render(<HeatmapStrip completions={completions} />)

    const cells = container.querySelectorAll('[aria-label]')
    // 7 days ago should be at index 20 (28 days total, starting from 27 days ago at index 0)
    // When i=7 in the loop, we get today.subtract(7) which is 7 days ago
    // This is the 21st element pushed (0-indexed at 20)
    expect(cells[20]).toHaveStyle({ backgroundColor: '#86f5e0' })
    // Today should be last cell (index 27)
    expect(cells[27]).toHaveStyle({ backgroundColor: '#86f5e0' })
  })

  test('renders with proper accessibility', () => {
    const { container } = render(<HeatmapStrip completions={[]} />)

    const cells = container.querySelectorAll('[aria-label]')

    cells.forEach((cell) => {
      expect(cell).toHaveAttribute('aria-label')
      expect(cell).toHaveAttribute('title')
      expect(cell.getAttribute('aria-label')).toMatch(/\w+ \d+:/)
    })
  })

  test('handles empty completions array', () => {
    const { container } = render(<HeatmapStrip completions={[]} />)

    const cells = container.querySelectorAll('[aria-label]')
    expect(cells.length).toBe(28)
  })

  test('handles undefined vacationDates', () => {
    expect(() =>
      render(<HeatmapStrip completions={[]} vacationDates={undefined} />)
    ).not.toThrow()
  })

  test('supports custom number of days', () => {
    const { container } = render(
      <HeatmapStrip completions={[]} daysToShow={35} />
    )

    const cells = container.querySelectorAll('[aria-label]')
    expect(cells.length).toBe(35)
  })

  test('vacation days have vacation color', () => {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0]
    const vacationDates = [yesterday]

    const { container } = render(
      <HeatmapStrip completions={[]} vacationDates={vacationDates} />
    )

    const cells = container.querySelectorAll('[aria-label]')
    const vacationCell = cells[cells.length - 2]

    expect(vacationCell).toHaveStyle({ backgroundColor: '#3d4263' })
  })
})
