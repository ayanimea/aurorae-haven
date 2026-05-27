import { vi } from 'vitest'

// Use the shared manual mock from src/__mocks__/react-router-dom.js
vi.mock('react-router-dom')

import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Settings from '../pages/Settings'
import * as autoSaveFS from '../utils/autoSaveFS'

// Mock CSS imports
vi.mock('../assets/styles/settings.css', () => ({}))

// Mock the autoSaveFS module
vi.mock('../utils/autoSaveFS', () => ({
  isFileSystemAccessSupported: vi.fn(() => true),
  requestDirectoryAccess: vi.fn(),
  getCurrentDirectoryHandle: vi.fn(() => null),
  setDirectoryHandle: vi.fn(),
  verifyDirectoryHandle: vi.fn(),
  startAutoSave: vi.fn(),
  stopAutoSave: vi.fn(),
  performAutoSave: vi.fn(),
  getLastSaveTimestamp: vi.fn(() => null),
  cleanOldSaveFiles: vi.fn(),
  loadAndImportLastSave: vi.fn(),
  getStoredDirectoryName: vi.fn(() => null),
  clearStoredDirectoryName: vi.fn()
}))

// Mock the settingsManager module
vi.mock('../utils/settingsManager', () => ({
  getSettings: vi.fn(() => ({
    theme: 'auto',
    autoSave: {
      enabled: false,
      intervalMinutes: 5,
      keepCount: 10,
      directoryConfigured: false,
      directoryName: null
    }
  })),
  updateSetting: vi.fn((key, value) => ({
    theme: key === 'theme' ? value : 'auto',
    autoSave: {
      enabled: key === 'autoSave.enabled' ? value : false,
      intervalMinutes: key === 'autoSave.intervalMinutes' ? value : 5,
      keepCount: key === 'autoSave.keepCount' ? value : 10,
      directoryConfigured:
        key === 'autoSave.directoryConfigured' ? value : false,
      directoryName: key === 'autoSave.directoryName' ? value : null
    }
  })),
  getSetting: vi.fn((key) => {
    if (key === 'autoSave.keepCount') return 10
    return undefined
  }),
  VALID_GUIDANCE_LEVELS: ['full', 'header-only', 'off']
}))

// Mock the importData module
vi.mock('../utils/importData', () => ({
  reloadPageAfterDelay: vi.fn(),
  IMPORT_SUCCESS_MESSAGE: 'Data imported successfully'
}))

// Mock FileInputButton to simplify export/import testing in Settings
vi.mock('../components/common/FileInputButton', () => ({
  default: ({ children, onFileSelect, ariaLabel, className }) => (
    <label aria-label={ariaLabel} className={className}>
      {children}
      <input type='file' onChange={onFileSelect} style={{ display: 'none' }} />
    </label>
  )
}))

describe('Settings Component', () => {
  const mockOnExport = vi.fn()
  const mockOnImport = vi.fn()
  const originalViteCompileMode = process.env.VITE_COMPILE_MODE
  const restoreEnvVar = (key, originalValue) => {
    if (originalValue === undefined) {
      delete process.env[key]
      return
    }
    process.env[key] = originalValue
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.VITE_COMPILE_MODE = 'desktop-offline'
  })

  afterEach(() => {
    restoreEnvVar('VITE_COMPILE_MODE', originalViteCompileMode)
  })

  test('renders settings page with title', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Customize your experience')).toBeInTheDocument()
  })

  test('renders Data Management section at the top with Export and Import buttons', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    expect(screen.getByText('Data Management')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /export all data/i })
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/import data from json file/i)
    ).toBeInTheDocument()
  })

  test('Export Data button calls onExport', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    fireEvent.click(screen.getByRole('button', { name: /export all data/i }))
    expect(mockOnExport).toHaveBeenCalledTimes(1)
  })

  test('renders auto-save section when File System API is supported', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    expect(screen.getByText('Automatic Save')).toBeInTheDocument()
  })

  test('shows warning when File System API is not supported', () => {
    autoSaveFS.isFileSystemAccessSupported.mockReturnValue(false)

    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText(/Not Supported/)).toBeInTheDocument()
  })

  test('renders placeholder for other settings', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    expect(screen.getByText('Other Settings')).toBeInTheDocument()
    expect(
      screen.getByText(/Additional settings will be available/i)
    ).toBeInTheDocument()
  })

  test('component renders without crashing', () => {
    const { container } = render(
      <Settings onExport={mockOnExport} onImport={mockOnImport} />
    )
    expect(container).toBeTruthy()
  })

  test('renders Appearance section with theme select', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)

    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument()
  })

})
