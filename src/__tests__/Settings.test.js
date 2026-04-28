import { vi } from 'vitest'

// Mock react-router-dom with a factory so Link renders as a proper <a> element
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' }))
}))

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
      directoryConfigured: false
    }
  })),
  updateSetting: vi.fn((key, value) => ({
    theme: key === 'theme' ? value : 'auto',
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
  const originalAuthRequired = process.env.VITE_AUTH_REQUIRED
  const originalAuthEmailEnabled = process.env.VITE_AUTH_EMAIL_ENABLED
  const originalGoogleClientId = process.env.VITE_OAUTH_GOOGLE_CLIENT_ID
  const originalFacebookAppId = process.env.VITE_OAUTH_FACEBOOK_APP_ID
  const originalGithubClientId = process.env.VITE_OAUTH_GITHUB_CLIENT_ID
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
    process.env.VITE_AUTH_REQUIRED = 'false'
    process.env.VITE_AUTH_EMAIL_ENABLED = ''
    process.env.VITE_OAUTH_GOOGLE_CLIENT_ID = ''
    process.env.VITE_OAUTH_FACEBOOK_APP_ID = ''
    process.env.VITE_OAUTH_GITHUB_CLIENT_ID = ''
  })

  afterEach(() => {
    restoreEnvVar('VITE_COMPILE_MODE', originalViteCompileMode)
    restoreEnvVar('VITE_AUTH_REQUIRED', originalAuthRequired)
    restoreEnvVar('VITE_AUTH_EMAIL_ENABLED', originalAuthEmailEnabled)
    restoreEnvVar('VITE_OAUTH_GOOGLE_CLIENT_ID', originalGoogleClientId)
    restoreEnvVar('VITE_OAUTH_FACEBOOK_APP_ID', originalFacebookAppId)
    restoreEnvVar('VITE_OAUTH_GITHUB_CLIENT_ID', originalGithubClientId)
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

  test('renders sign-in/sign-up and providers for signed-in web mode', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'
    process.env.VITE_AUTH_EMAIL_ENABLED = 'true'
    process.env.VITE_OAUTH_GOOGLE_CLIENT_ID = 'google-client-id'
    process.env.VITE_OAUTH_FACEBOOK_APP_ID = 'facebook-app-id'
    process.env.VITE_OAUTH_GITHUB_CLIENT_ID = 'github-client-id'

    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    const signInLink = screen.getByRole('link', { name: /sign in \/ sign up/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute('href', '/sign-in')

    const emailButton = screen.getByRole('button', {
      name: /sign in with email/i
    })
    expect(emailButton).toBeInTheDocument()
    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i
    })
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
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)

    expect(
      screen.getByText(/sign-in and sign-up are unavailable in offline mode/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /sign in \/ sign up/i })
    ).not.toBeInTheDocument()
  })

  test('sign-in/sign-up entry is a link to /sign-in', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'
    process.env.VITE_AUTH_EMAIL_ENABLED = 'true'
    process.env.VITE_OAUTH_GOOGLE_CLIENT_ID = 'google-client-id'
    process.env.VITE_OAUTH_FACEBOOK_APP_ID = 'facebook-app-id'
    process.env.VITE_OAUTH_GITHUB_CLIENT_ID = 'github-client-id'

    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)
    const signInLink = screen.getByRole('link', { name: /sign in \/ sign up/i })
    expect(signInLink).toHaveAttribute('href', '/sign-in')
  })

  test('sign-in section mentions local data sync', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'
    process.env.VITE_AUTH_EMAIL_ENABLED = 'true'
    process.env.VITE_OAUTH_GOOGLE_CLIENT_ID = 'google-client-id'
    process.env.VITE_OAUTH_FACEBOOK_APP_ID = 'facebook-app-id'
    process.env.VITE_OAUTH_GITHUB_CLIENT_ID = 'github-client-id'

    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)

    expect(
      screen.getByText(/local data will be synced to your account/i)
    ).toBeInTheDocument()
  })

  test('renders Appearance section with theme select', () => {
    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)

    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument()
  })

  test('shows auth not required message when non-offline mode does not require auth', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'false'

    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)

    expect(
      screen.getByText(/authentication is not required in this mode\./i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        /no sign-in providers are currently configured for this mode/i
      )
    ).not.toBeInTheDocument()
  })

  test('shows unconfigured providers message when auth is required but providers are missing', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'

    render(<Settings onExport={mockOnExport} onImport={mockOnImport} />)

    expect(
      screen.getByText(
        /no sign-in providers are currently configured for this mode/i
      )
    ).toBeInTheDocument()
  })
})
