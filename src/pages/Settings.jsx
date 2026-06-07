import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  getSettings,
  updateSetting,
  VALID_GUIDANCE_LEVELS
} from '../utils/settingsManager'
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  getCurrentDirectoryHandle,
  verifyDirectoryHandle,
  startAutoSave,
  stopAutoSave,
  performAutoSave,
  getLastSaveTimestamp,
  cleanOldSaveFiles,
  loadAndImportLastSave,
  getStoredDirectoryName,
  getStoredDirectoryHandle,
  requestStoredDirectoryPermission
} from '../utils/autoSaveFS'
import {
  reloadPageAfterDelay,
  IMPORT_SUCCESS_MESSAGE
} from '../utils/importData'
import FileInputButton from '../components/common/FileInputButton'
import Icon from '../components/common/Icon'
import { getEnvVar } from '../utils/environment'
import '../assets/styles/settings.css'

// Time constant
const MS_PER_MINUTE = 60 * 1000 // 60 seconds * 1000 milliseconds

function Settings({ onExport, onImport }) {
  // Local folder autosave is only available in offline/desktop builds for security.
  // Defaults to false (restrictive) when VITE_COMPILE_MODE is not explicitly set.
  const IS_OFFLINE_MODE = getEnvVar('VITE_COMPILE_MODE') === 'desktop-offline'
  const [settings, setSettingsState] = useState(getSettings())
  const [directoryName, setDirectoryName] = useState(null)
  const [directoryHandleLost, setDirectoryHandleLost] = useState(false)
  const [storedHandleAvailable, setStoredHandleAvailable] = useState(false)
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
  const autoSaveSettings =
    settings.autoSave &&
    typeof settings.autoSave === 'object' &&
    !Array.isArray(settings.autoSave)
      ? settings.autoSave
      : null

  // Load directory handle and last save time on mount
  useEffect(() => {
    const handle = getCurrentDirectoryHandle()
    // Fall back to settings.autoSave.directoryName so an imported settings JSON
    // (which includes the directory name) is reflected in the UI even before the
    // user re-grants directory access in a new browser session.
    const storedName = getStoredDirectoryName() || autoSaveSettings?.directoryName

    if (handle) {
      setDirectoryName(handle.name)
      setDirectoryHandleLost(false)
      setStoredHandleAvailable(false)
    } else if (storedName && autoSaveSettings?.directoryConfigured) {
      // Handle was lost but we have the directory name; check for IDB-persisted handle
      setDirectoryName(storedName)
      setDirectoryHandleLost(true)
      if (IS_OFFLINE_MODE) {
        getStoredDirectoryHandle()
          .then((idbHandle) => setStoredHandleAvailable(!!idbHandle))
          .catch(() => setStoredHandleAvailable(false))
      }
    }

    const lastSave = getLastSaveTimestamp()
    if (lastSave) {
      setLastSaveTime(new Date(lastSave))
    }
  }, [autoSaveSettings])

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
        setDirectoryHandleLost(false)
        setStoredHandleAvailable(false)

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
  }, [showMessage])

  const handleGrantAccess = useCallback(async () => {
    setIsConfiguring(true)
    try {
      const handle = await requestStoredDirectoryPermission()
      if (handle) {
        setDirectoryName(handle.name)
        setDirectoryHandleLost(false)
        setStoredHandleAvailable(false)

        const newSettings = updateSetting('autoSave.directoryConfigured', true)
        setSettingsState(newSettings)

        showMessage(`Access granted to: ${handle.name}`)

        if (newSettings.autoSave.enabled) {
          stopAutoSave()
          startAutoSave(newSettings.autoSave.intervalMinutes * MS_PER_MINUTE)
        }
      } else {
        showMessage('Access was not granted to the directory', true)
      }
    } catch (error) {
      showMessage('Failed to grant access: ' + error.message, true)
    } finally {
      setIsConfiguring(false)
    }
  }, [showMessage])

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
        {/* Data Management — Export / Import at the top */}
        <div className='settings-section'>
          <h3 className='settings-section-title'>Data Management</h3>
          <p className='settings-hint' style={{ marginBottom: '0.75rem' }}>
            Export your data regularly to keep a local backup. You can import it
            again at any time.
          </p>
          <div className='settings-button-group'>
            <button
              type='button'
              className='settings-button settings-button-success'
              onClick={onExport}
              aria-label='Export all data as JSON'
            >
              <Icon name='download' />
              Export Data
            </button>
            <FileInputButton
              onFileSelect={onImport}
              accept='application/json'
              ariaLabel='Import data from JSON file'
              className='settings-button settings-button-primary'
            >
              <Icon name='upload' />
              Import Data
            </FileInputButton>
          </div>
        </div>

        {/* Auto-Save Settings Section — only available in offline/desktop mode */}
        {IS_OFFLINE_MODE && autoSaveSettings && (
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
                    selected, but access has been lost after page reload.
                    {storedHandleAvailable
                      ? ' Click "Grant Access" to restore access without browsing, or "Change Directory" to select a different folder.'
                      : ' Please click "Change Directory" to re-grant access and resume auto-save functionality.'}
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
                  {storedHandleAvailable && directoryHandleLost && (
                    <button
                      type='button'
                      onClick={handleGrantAccess}
                      disabled={isConfiguring}
                      className='settings-button settings-button-success'
                      aria-label='Grant access to previously selected directory'
                      aria-busy={isConfiguring}
                    >
                      Grant Access
                    </button>
                  )}
                  <button
                    type='button'
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
                    checked={autoSaveSettings.enabled}
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
                  value={autoSaveSettings.intervalMinutes}
                  onChange={handleIntervalInput}
                  onBlur={handleIntervalInput}
                  disabled={!autoSaveSettings.enabled}
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
                  value={autoSaveSettings.keepCount}
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
                  type='button'
                  onClick={handleManualSave}
                  disabled={!directoryName || isConfiguring}
                  className='settings-button settings-button-success'
                  aria-label='Save data now'
                  aria-busy={isConfiguring}
                >
                  Save Now
                </button>
                <button
                  type='button'
                  onClick={handleLoadLastSave}
                  disabled={!directoryName || isConfiguring}
                  className='settings-button settings-button-info'
                  aria-label='Load most recent save file'
                  aria-busy={isConfiguring}
                >
                  Load Last Save
                </button>
                <button
                  type='button'
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
        )} {/* end IS_OFFLINE_MODE auto-save section */}

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
            <small id='24hour-format-hint' className='settings-checkbox-hint'>
              Display times in 24-hour format (e.g., 14:00 instead of 2:00 PM)
            </small>
          </div>

          {/* Load Awareness Guidance Level */}
          <div className='settings-field'>
            <label
              className='settings-label'
              htmlFor='scheduling-guidance-level'
            >
              <strong>Load Awareness Guidance</strong>
            </label>
            <select
              id='scheduling-guidance-level'
              className='settings-select'
              value={settings.schedule?.schedulingGuidanceLevel ?? 'full'}
              onChange={(e) => {
                const level = VALID_GUIDANCE_LEVELS.includes(e.target.value)
                  ? e.target.value
                  : 'full'
                const newSettings = {
                  ...settings,
                  schedule: {
                    ...settings.schedule,
                    schedulingGuidanceLevel: level
                  }
                }
                setSettingsState(newSettings)
                updateSetting('schedule.schedulingGuidanceLevel', level)
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('settingsUpdated'))
                }
                showMessage('Load awareness level updated')
              }}
              aria-describedby='guidance-level-hint'
            >
              <option value='full'>
                Full: header indicators, warnings &amp; suggestions
              </option>
              <option value='header-only'>
                Header only: indicators only, no warnings
              </option>
              <option value='off'>Off: indicators disabled</option>
            </select>
            <small id='guidance-level-hint' className='settings-checkbox-hint'>
              Week and day headers, plus month cells, show an amber underline
              when 8 h of events are scheduled (end of the work block), and a ⚠
              icon at 9 h (into leisure time). Structural limits still apply
              regardless of this setting: max 2 simultaneous events, or up to 3
              when one event is all-day.
            </small>
          </div>
        </div>

        {/* Template Library */}
        <div className='settings-divider'>
          <h3 className='settings-section-title'>Template Library</h3>
          <p className='settings-placeholder-text'>
            Manage reusable Task and Routine templates
          </p>
          <div className='settings-button-group' style={{ marginTop: '12px' }}>
            <Link
              to='/library'
              className='settings-button settings-button-primary'
            >
              <Icon name='library' />
              Open Template Library
            </Link>
          </div>
        </div>

        {/* Appearance */}
        <div className='settings-divider'>
          <h3 className='settings-section-title'>Appearance</h3>
          <div className='settings-field'>
            <label htmlFor='theme-select' className='settings-label'>
              Theme
            </label>
            <select
              id='theme-select'
              className='settings-select'
              value={settings.theme ?? 'auto'}
              onChange={(e) => {
                const newSettings = updateSetting('theme', e.target.value)
                setSettingsState(newSettings)
                showMessage('Theme preference saved — light theme coming soon')
              }}
              aria-describedby='theme-select-hint'
            >
              <option value='auto'>Auto (system default)</option>
              <option value='dark'>Dark</option>
              <option value='light'>Light (coming soon)</option>
            </select>
            <small id='theme-select-hint' className='settings-hint'>
              Light theme is planned for a future update. Dark mode is fully
              supported.
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

Settings.propTypes = {
  onExport: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired
}

export default Settings
