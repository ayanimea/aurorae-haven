/**
 * Scheduling Configuration
 * Single source of truth for all scheduling thresholds and behavioral limits.
 * No literal threshold values may appear in UI logic — always reference this config.
 */

export const SCHEDULING_CONFIG = {
  /**
   * Load ratio at which a day is considered highly scheduled (0–1).
   * Based on the 8/8/8 rule: 8 h sleep · 8 h work · 8 h leisure.
   * Amber header underline appears when the scheduled work block is full (≥ 8 h / 24 h ≈ 0.333).
   */
  loadThresholdHigh: 8 / 24,

  /**
   * Load ratio at which a day is considered over capacity (0–1).
   * Red underline + ⚠ icon appears when scheduling spills into leisure time (≥ 9 h / 24 h = 0.375).
   */
  loadThresholdOver: 9 / 24,

  /** Maximum simultaneous (overlapping) events allowed */
  maxSimultaneousEvents: 2,

  /** Maximum simultaneous events when at least one is all-day */
  maxSimultaneousWithAllDay: 3,

  /** Snap grid interval in minutes — all event times align to this boundary */
  snapIntervalMinutes: 15
}

if (
  SCHEDULING_CONFIG.loadThresholdOver <=
  SCHEDULING_CONFIG.loadThresholdHigh
) {
  throw new Error('Invalid scheduling threshold configuration')
}
