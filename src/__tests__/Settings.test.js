import { vi } from 'vitest'

// Mock react-router-dom (uses src/__mocks__/react-router-dom.js)
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
    autoSave: {
      enabled: false,
      intervalMinutes: 5,
      keepCount: 10,
      directoryConfigured: false
    }
  })),
  updateSetting: vi.fn((key, value) => ({
    autoSave: {
      enabled: key === 'autoSave.enabled' ? value : false,
      intervalMinutes: key === 'autoSave.intervalMinutes' ? value : 5,
      keepCount: key === 'autoSave.keepCount' ? value : 10,
      directoryConfigured:
        key === 'autoSave.directoryConfigured' ? value : false
    }
  })),
  getSetting: vi.fn((key) => {
    if (key === 'autoSave.keepCount') return 10
    return undefined
  })
}))

// Mock the importData module
vi.mock('../utils/importData', () => ({
  reloadPageAfterDelay: vi.fn(),
  IMPORT_SUCCESS_MESSAGE: 'Data imported successfully'
}))

describe('Settings Component', () => {
  const originalAuroraeCompileMode = process.env.AURORAE_COMPILE_MODE
  const originalViteCompileMode = process.env.VITE_COMPILE_MODE
  const originalAuthRequired = process.env.VITE_AUTH_REQUIRED

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.VITE_COMPILE_MODE = 'desktop-offline'
    process.env.AURORAE_COMPILE_MODE = 'desktop-offline'
    process.env.VITE_AUTH_REQUIRED = 'false'
  })

  afterEach(() => {
    process.env.VITE_COMPILE_MODE = originalViteCompileMode
    process.env.AURORAE_COMPILE_MODE = originalAuroraeCompileMode
    process.env.VITE_AUTH_REQUIRED = originalAuthRequired
  })

  test('renders settings page with title', () => {
    render(<Settings />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Customize your experience')).toBeInTheDocument()
  })

  test('renders auto-save section when File System API is supported', () => {
    render(<Settings />)
    expect(screen.getByText('Automatic Save')).toBeInTheDocument()
  })

  test('shows warning when File System API is not supported', () => {
    autoSaveFS.isFileSystemAccessSupported.mockReturnValue(false)

    render(<Settings />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText(/Not Supported/)).toBeInTheDocument()
  })

  test('renders placeholder for other settings', () => {
    render(<Settings />)
    expect(screen.getByText('Other Settings')).toBeInTheDocument()
    expect(
      screen.getByText(/Additional settings will be available/i)
    ).toBeInTheDocument()
  })

  test('component renders without crashing', () => {
    const { container } = render(<Settings />)
    expect(container).toBeTruthy()
  })

  test('renders sign-in/sign-up and providers for signed-in web mode', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.AURORAE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'

    render(<Settings />)
    const authButton = screen.getByRole('button', { name: /sign in \/ sign up/i })
    expect(authButton).toBeInTheDocument()

    const emailButton = screen.getByRole('button', { name: /sign in with email/i })
    expect(emailButton).toBeInTheDocument()
    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    expect(googleButton).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign in with facebook/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign in with github/i })
    ).toBeInTheDocument()

    fireEvent.click(googleButton)
    expect(
      screen.getByText(/configured via backend auth endpoints/i)
    ).toBeInTheDocument()
  })

  test('shows sign-in unavailable message in offline mode', () => {
    render(<Settings />)

    expect(
      screen.getByText(/sign-in and sign-up are unavailable in offline mode/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /sign in \/ sign up/i })
    ).not.toBeInTheDocument()
  })

  test('shows integration message when sign-in/sign-up button is clicked', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.AURORAE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'

    render(<Settings />)
    fireEvent.click(screen.getByRole('button', { name: /sign in \/ sign up/i }))

    expect(
      screen.getByText(/sign-in and sign-up are configured via backend auth endpoints/i)
    ).toBeInTheDocument()
  })
})
