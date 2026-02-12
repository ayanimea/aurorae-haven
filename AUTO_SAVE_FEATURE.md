# Auto-Save Feature Implementation

## Overview

This document describes the automatic save feature implementation for Aurorae Haven, which allows users to automatically save all their data to a local directory at configurable intervals.

## Architecture

### Components

1. **autoSaveFS.js** - Core utility module
   - File System Access API wrapper
   - Save/load operations
   - Directory management
   - Automatic cleanup of old files

2. **Settings.jsx** - User interface
   - Directory picker
   - Configuration controls
   - Manual save/load buttons
   - Status indicators

3. **settingsManager.js** - Configuration management
   - Settings persistence
   - Default values
   - Validation

4. **index.jsx** - Application integration
   - Auto-save initialization
   - Lifecycle management

## Key Features

### Automatic Periodic Saves

- Configurable interval (1-60 minutes, default: 5 minutes)
- Runs in background while app is open
- Saves all data from all tabs (Schedule, Tasks, Routines, Habits, Notes, Stats, Library)

### Manual Controls

- **Save Now**: Immediate save without waiting for interval
- **Load Last Save**: Restore from most recent save file
- **Clean Old Files**: Manual cleanup trigger

### File Management

- Automatic cleanup of old files
- Configurable retention (default: keep 10 most recent)
- Timestamped filenames with UUID for uniqueness
- JSON format compatible with export/import

### User Experience

- Directory picker with permission handling
- Real-time status updates
- Last save timestamp display
- Error handling with user-friendly messages
- Browser compatibility detection

## File Naming Convention

```text
aurorae_save_YYYY-MM-DD_HHMMSS_<uuid>.json
```

Example:

```text
aurorae_save_2026-01-08_143025_a1b2c3d4.json
```

## Browser Compatibility

| Browser | Version | Support                                     |
| ------- | ------- | ------------------------------------------- |
| Chrome  | 86+     | ✅ Full                                     |
| Edge    | 86+     | ✅ Full                                     |
| Firefox | All     | ❌ No (API not implemented)                 |
| Safari  | 15.2+   | ⚠️ Partial (requires experimental features) |

**Fallback**: Manual export/import and IndexedDB backups remain available for all browsers.

## Security & Privacy

- **Local-only**: All files stored on user's device
- **No network**: No data sent to servers
- **User control**: Explicit directory selection required
- **Permissions**: Browser permission model enforced
- **Data format**: Standard JSON (transparent, inspectable)

## Configuration

Default settings stored in `settingsManager.js`:

```javascript
autoSave: {
  enabled: false,              // User must explicitly enable
  intervalMinutes: 5,          // Save every 5 minutes
  keepCount: 10,               // Keep 10 most recent files
  directoryConfigured: false   // No directory selected initially
}
```

## Data Flow

### Save Operation

1. Timer triggers or user clicks "Save Now"
2. Collect all data via `getDataTemplate()`
3. Verify directory handle is still valid
4. Generate timestamped filename
5. Write JSON to file using File System Access API
6. Update last save timestamp
7. Clean old files if needed

### Load Operation

1. User clicks "Load Last Save"
2. Verify directory access
3. List all save files in directory
4. Sort by modification time
5. Load most recent file
6. Validate data structure
7. Import to IndexedDB/localStorage
8. Reload page to apply changes

## Error Handling

The implementation handles:

- Directory access denied/revoked
- File system errors
- Invalid save files
- No save files found
- Browser API not supported
- Permission timeouts

All errors are caught and displayed to user with actionable messages.

## Testing Considerations

### Manual Testing Required

The File System Access API requires:

- User gesture (mouse click)
- Permission dialog interaction
- Actual file system access

These cannot be automated in typical test environments.

### Recommended Test Cases

1. Select directory → verify directory name displayed
2. Enable auto-save → verify timer starts
3. Wait for interval → verify file created
4. Click "Save Now" → verify immediate save
5. Click "Load Last Save" → verify data restored
6. Change interval → verify timer restarts
7. Change keep count → verify cleanup behavior
8. Revoke permissions → verify error handling

## Future Enhancements

Potential improvements:

- [ ] Save to multiple directories (redundancy)
- [ ] Compression for large datasets
- [ ] Differential/incremental saves
- [ ] Save history browser/viewer
- [ ] Cloud storage integration (optional)
- [ ] Encrypted saves
- [ ] Auto-save on data change (debounced)

## API Reference

### Key Functions

#### `requestDirectoryAccess()`

Opens directory picker for user selection.

#### `performAutoSave()`

Executes save operation with current data.

#### `loadAndImportLastSave()`

Loads and imports most recent save file.

#### `startAutoSave(intervalMs)`

Starts automatic save timer with specified interval.

#### `stopAutoSave()`

Stops automatic save timer.

#### `cleanOldSaveFiles(keepCount)`

Removes old save files beyond retention limit.

## Documentation

- **User Manual**: See `USER_MANUAL.md` section "Automatic Save Feature"
- **Roadmap**: Feature marked complete in `ROADMAP.md` v1.0 section
- **Code Comments**: Inline JSDoc documentation in `autoSaveFS.js`

## Related Files

- `src/utils/autoSaveFS.js` - Core implementation
- `src/pages/Settings.jsx` - UI implementation
- `src/utils/settingsManager.js` - Settings management
- `src/index.jsx` - Integration point
- `USER_MANUAL.md` - User documentation
- `ROADMAP.md` - Feature status

## Support

For issues or questions:

- GitHub Issues with `auto-save` label
- See troubleshooting section in USER_MANUAL.md
- Check browser compatibility requirements

---

**Implementation Date**: January 2026
**Status**: ✅ Complete
**Version**: 1.0.0
