/**
 * Scheduling Configuration
 * Single source of truth for all scheduling thresholds and behavioral limits.
 * No literal threshold values may appear in UI logic — always reference this config.
 */

export const SCHEDULING_CONFIG = {
  /** Load ratio at which a day is considered highly scheduled (0–1) */
  loadThresholdHigh: 0.8,

  /** Load ratio at which a day is considered over capacity (0–1) */
  loadThresholdOver: 1.0,

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
