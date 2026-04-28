/**
 * Auth Data Migration Utility
 *
 * Collects all local app data and prepares it for sync to the backend
 * when a user signs in or signs up with existing local data.
 *
 * The backend is expected to merge this payload with any existing
 * account data (see docs/BACKEND_REQUIREMENTS.md — "Data Migration" section).
 */

import { getDataTemplate } from './exportData'

/**
 * Collects all local app data for migration to the backend on sign-in.
 *
 * @returns {Promise<object>} Payload with all local data, ready for backend sync
 */
export async function collectLocalDataForSync() {
  const data = await getDataTemplate()
  return {
    ...data,
    migratedAt: new Date().toISOString()
  }
}

/**
 * Returns true when at least one local data collection has content.
 *
 * @returns {Promise<boolean>}
 */
export async function hasLocalDataToMigrate() {
  const data = await collectLocalDataForSync()
  return Boolean(
    (data.tasks?.length ?? 0) > 0 ||
      (data.routines?.length ?? 0) > 0 ||
      (data.habits?.length ?? 0) > 0 ||
      (data.dumps?.length ?? 0) > 0 ||
      (data.schedule?.length ?? 0) > 0
  )
}
