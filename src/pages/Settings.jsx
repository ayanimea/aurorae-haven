import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getSettings, updateSetting } from '../utils/settingsManager'
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  getCurrentDirectoryHandle,
  setDirectoryHandle,
  verifyDirectoryHandle,
  startAutoSave,
  stopAutoSave,
  performAutoSave,
  getLastSaveTimestamp,
  cleanOldSaveFiles,
  loadAndImportLastSave,
  getStoredDirectoryName
} from '../utils/autoSaveFS'
import {
  reloadPageAfterDelay,
  IMPORT_SUCCESS_MESSAGE
} from '../utils/importData'
import '../assets/styles/settings.css'

// Time constant
const MS_PER_MINUTE = 60 * 1000 // 60 seconds * 1000 milliseconds

function Settings() {
  const [settings, setSettingsState] = useState(getSettings())
  const [directoryName, setDirectoryName] = useState(null)
  const [directoryHandleLost, setDirectoryHandleLost] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState(null)
  const [message, setMessage] = useState({ text: '', isError: false })
  const [isConfiguring, setIsConfiguring] = useState(false)

  // Use refs to avoid stale closures
  const settingsRef = useRef(settings)
  const messageTimeoutRef = useRef(null)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // Cleanup message timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  // Check if File System Access API is supported
  const fsSupported = isFileSystemAccessSupported()

  // Load directory handle and last save time on mount
  useEffect(() => {
    const handle = getCurrentDirectoryHandle()
    const storedName = getStoredDirectoryName()

    if (handle) {
      setDirectoryName(handle.name)
      setDirectoryHandleLost(false)
    } else if (storedName && settings.autoSave.directoryConfigured) {
      // Handle was lost but we have the directory name
      setDirectoryName(storedName)
      setDirectoryHandleLost(true)
    }

    const lastSave = getLastSaveTimestamp()
    if (lastSave) {
      setLastSaveTime(new Date(lastSave))
    }
  }, [settings])

  // Update last save time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const lastSave = getLastSaveTimestamp()
      if (lastSave) {
        setLastSaveTime(new Date(lastSave))
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const showMessage = useCallback((text, isError = false, duration = 3000) => {
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }

    setMessage({ text, isError })
    messageTimeoutRef.current = setTimeout(() => {
      setMessage({ text: '', isError: false })
      messageTimeoutRef.current = null
    }, duration)
  }, [])

  const handleSelectDirectory = useCallback(async () => {
    setIsConfiguring(true)
    try {
      const handle = await requestDirectoryAccess()
      if (handle) {
        setDirectoryName(handle.name)
        setDirectoryHandle(handle)
        setDirectoryHandleLost(false)

        // Update settings and get fresh settings
        const newSettings = updateSetting('autoSave.directoryConfigured', true)
        setSettingsState(newSettings)

        showMessage(`Directory selected: ${handle.name}`)

        // If auto-save is enabled, restart it with current settings
        if (newSettings.autoSave.enabled) {
          stopAutoSave()
          startAutoSave(newSettings.autoSave.intervalMinutes * MS_PER_MINUTE)
        }
      }
    } catch (error) {
      showMessage('Failed to select directory: ' + error.message, true)
    } finally {
      setIsConfiguring(false)
    }
  }, [showMessage, setDirectoryName, setDirectoryHandleLost, setSettingsState])

  const handleToggleAutoSave = useCallback(
    async (enabled) => {
      // Check if directory is configured
      if (enabled && !getCurrentDirectoryHandle()) {
        showMessage('Please select a directory first', true)
        return
      }

      // Verify directory handle is still valid
      const handle = getCurrentDirectoryHandle()
      if (enabled && handle) {
        const isValid = await verifyDirectoryHandle(handle)
        if (!isValid) {
          showMessage(
            'Directory access expired. Please select the directory again.',
            true
          )
          setDirectoryName(null)
          return
        }
      }

      const newSettings = updateSetting('autoSave.enabled', enabled)
      setSettingsState(newSettings)

      if (enabled) {
        startAutoSave(newSettings.autoSave.intervalMinutes * MS_PER_MINUTE)
        showMessage('Auto-save enabled')
      } else {
        stopAutoSave()
        showMessage('Auto-save disabled')
      }
    },
    [showMessage]
  )

  const handleIntervalChange = useCallback(
    (intervalMinutes) => {
      const newSettings = updateSetting(
        'autoSave.intervalMinutes',
        intervalMinutes
      )
      setSettingsState(newSettings)

      // Restart auto-save if enabled with new interval
      if (newSettings.autoSave.enabled) {
        stopAutoSave()
        startAutoSave(intervalMinutes * MS_PER_MINUTE)
      }

      showMessage(`Save interval updated to ${intervalMinutes} minutes`)
    },
    [showMessage]
  )

  const handleKeepCountChange = useCallback(
    (keepCount) => {
      const newSettings = updateSetting('autoSave.keepCount', keepCount)
      setSettingsState(newSettings)
      showMessage(`Will keep ${keepCount} most recent save files`)
    },
    [showMessage]
  )

  const handleManualSave = useCallback(async () => {
    setIsConfiguring(true)
    try {
      const result = await performAutoSave()
      if (result.success) {
        setLastSaveTime(new Date(result.timestamp))
        showMessage('Data saved successfully')
      } else {
        showMessage('Save failed: ' + result.error, true)
      }
    } catch (error) {
      showMessage('Save failed: ' + error.message, true)
    } finally {
      setIsConfiguring(false)
    }
  }, [showMessage])

  const handleCleanOldFiles = useCallback(async () => {
    setIsConfiguring(true)
    try {
      const deletedCount = await cleanOldSaveFiles(
        settingsRef.current.autoSave.keepCount
      )
      showMessage(`Cleaned up ${deletedCount} old save file(s)`)
    } catch (error) {
      showMessage('Cleanup failed: ' + error.message, true)
    } finally {
      setIsConfiguring(false)
    }
  }, [showMessage])

  const handleLoadLastSave = useCallback(async () => {
    setIsConfiguring(true)
    try {
      const result = await loadAndImportLastSave()
      if (result.success) {
        showMessage(IMPORT_SUCCESS_MESSAGE)
        // Reload page after delay to apply imported data
        reloadPageAfterDelay(1500)
      } else {
        showMessage('Load failed: ' + result.error, true)
        setIsConfiguring(false)
      }
    } catch (error) {
      showMessage('Load failed: ' + error.message, true)
      setIsConfiguring(false)
    }
  }, [showMessage])

  const handleIntervalInput = useCallback(
    (e) => {
      let value = parseInt(e.target.value, 10)
      if (isNaN(value) || value < 1) value = 1
      if (value > 60) value = 60
      handleIntervalChange(value)
    },
    [handleIntervalChange]
  )

  const handleKeepCountInput = useCallback(
    (e) => {
      let value = parseInt(e.target.value, 10)
      if (isNaN(value) || value < 1) value = 1
      if (value > 100) value = 100
      handleKeepCountChange(value)
    },
    [handleKeepCountChange]
  )

  const formatTimeSince = (date) => {
    if (!date) return 'Never'

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  return (
    <div className='card'>
      <div className='card-h'>
        <strong>Settings</strong>
        <span className='small'>Customize your experience</span>
      </div>
      <div className='card-b'>
        {/* Auto-Save Settings Section */}
        <div className='settings-section'>
          <h3 className='settings-section-title'>Automatic Save</h3>

          {!fsSupported && (
            <div className='settings-warning' role='alert'>
              <strong className='settings-warning-title'>
                ⚠️ Not Supported
              </strong>
              <p className='settings-warning-text'>
                Your browser does not support the File System Access API.
                Auto-save to a local directory is not available. Please use the
                Export button to manually save your data.
              </p>
            </div>
          )}

          {fsSupported && (
            <>
              {/* Warning when directory handle is lost */}
              {directoryHandleLost && (
                <div
                  className='settings-warning settings-warning-directory-lost'
                  role='alert'
                >
                  <strong className='settings-warning-title'>
                    ⚠️ Directory Access Required
                  </strong>
                  <p className='settings-warning-text'>
                    The directory &quot;{directoryName}&quot; was previously
                    selected, but access has been lost after page reload. Please
                    click &quot;Change Directory&quot; to re-grant access and
                    resume auto-save functionality.
                  </p>
                </div>
              )}

              {/* Directory Configuration */}
              <div className='settings-field'>
                <label htmlFor='save-directory' className='settings-label'>
                  Save Directory
                </label>
                <div className='settings-input-group'>
                  <input
                    id='save-directory'
                    type='text'
                    value={directoryName || 'Not configured'}
                    readOnly
                    className='settings-input'
                    aria-describedby='save-directory-hint'
                  />
                  <button
                    onClick={handleSelectDirectory}
                    disabled={isConfiguring}
                    className='settings-button settings-button-primary'
                    aria-label={
                      directoryName
                        ? 'Change save directory'
                        : 'Select save directory'
                    }
                  >
                    {directoryName ? 'Change' : 'Select'} Directory
                  </button>
                </div>
                <small id='save-directory-hint' className='settings-hint'>
                  Choose a folder where automatic saves will be stored
                </small>
              </div>

              {/* Enable/Disable Auto-Save */}
              <div className='settings-field'>
                <label className='settings-checkbox-label'>
                  <input
                    type='checkbox'
                    checked={settings.autoSave.enabled}
                    onChange={(e) => handleToggleAutoSave(e.target.checked)}
                    disabled={!directoryName}
                    className='settings-checkbox'
                    aria-describedby='auto-save-toggle-hint'
                  />
                  <strong>Enable Automatic Save</strong>
                </label>
                <small
                  id='auto-save-toggle-hint'
                  className='settings-checkbox-hint'
                >
                  Automatically save all data at regular intervals
                </small>
              </div>

              {/* Save Interval */}
              <div className='settings-field'>
                <label htmlFor='save-interval' className='settings-label'>
                  Save Interval (minutes)
                </label>
                <input
                  id='save-interval'
                  type='number'
                  min='1'
                  max='60'
                  value={settings.autoSave.intervalMinutes}
                  onChange={handleIntervalInput}
                  onBlur={handleIntervalInput}
                  disabled={!settings.autoSave.enabled}
                  className='settings-input-number'
                  aria-describedby='save-interval-hint'
                />
                <small id='save-interval-hint' className='settings-hint'>
                  How often to automatically save (1-60 minutes)
                </small>
              </div>

              {/* Keep Count */}
              <div className='settings-field'>
                <label htmlFor='keep-count' className='settings-label'>
                  Keep Recent Files
                </label>
                <input
                  id='keep-count'
                  type='number'
                  min='1'
                  max='100'
                  value={settings.autoSave.keepCount}
                  onChange={handleKeepCountInput}
                  onBlur={handleKeepCountInput}
                  className='settings-input-number'
                  aria-describedby='keep-count-hint'
                />
                <small id='keep-count-hint' className='settings-hint'>
                  Number of most recent save files to keep (older files will be
                  deleted)
                </small>
              </div>

              {/* Last Save Time */}
              <div className='settings-status'>
                <span className='settings-status-label'>Last Save: </span>
                <span>{formatTimeSince(lastSaveTime)}</span>
              </div>

              {/* Action Buttons */}
              <div
                className='settings-button-group'
                role='group'
                aria-label='Auto-save actions'
              >
                <button
                  onClick={handleManualSave}
                  disabled={!directoryName || isConfiguring}
                  className='settings-button settings-button-success'
                  aria-label='Save data now'
                  aria-busy={isConfiguring}
                >
                  Save Now
                </button>
                <button
                  onClick={handleLoadLastSave}
                  disabled={!directoryName || isConfiguring}
                  className='settings-button settings-button-info'
                  aria-label='Load most recent save file'
                  aria-busy={isConfiguring}
                >
                  Load Last Save
                </button>
                <button
                  onClick={handleCleanOldFiles}
                  disabled={!directoryName || isConfiguring}
                  className='settings-button settings-button-warning'
                  aria-label='Clean up old save files'
                  aria-busy={isConfiguring}
                >
                  Clean Old Files
                </button>
              </div>
            </>
          )}
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`settings-message ${message.isError ? 'settings-message-error' : ''}`}
            role='status'
            aria-live='polite'
          >
            {message.text}
          </div>
        )}

        {/* Schedule Settings */}
        <div className='settings-divider'>
          <h3 className='settings-section-title'>Schedule</h3>
          
          {/* 24-Hour Format Toggle */}
          <div className='settings-field'>
            <label className='settings-checkbox-label'>
              <input
                type='checkbox'
                checked={settings.schedule?.use24HourFormat ?? true}
                onChange={(e) => {
                  const newSettings = {
                    ...settings,
                    schedule: {
                      ...settings.schedule,
                      use24HourFormat: e.target.checked
                    }
                  }
                  setSettingsState(newSettings)
                  updateSetting('schedule', newSettings.schedule)
                  // Dispatch custom event for same-tab reactivity in Schedule component
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('settingsUpdated'))
                  }
                  showMessage('Time format updated successfully')
                }}
                className='settings-checkbox'
                aria-describedby='24hour-format-hint'
              />
              <strong>Use 24-Hour Time Format</strong>
            </label>
            <small
              id='24hour-format-hint'
              className='settings-checkbox-hint'
            >
              Display times in 24-hour format (e.g., 14:00 instead of 2:00 PM)
            </small>
          </div>
        </div>

        {/* Other Settings Placeholder */}
        <div className='settings-divider'>
          <h3 className='settings-section-title'>Other Settings</h3>
          <p className='settings-placeholder-text'>
            Additional settings will be available here in future updates...
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
