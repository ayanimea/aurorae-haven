import { vi } from 'vitest'

vi.mock('react-router-dom')
vi.mock('../assets/styles/settings.css', () => ({}))

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SignIn from '../pages/SignIn'

describe('SignIn Page', () => {
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

  test('renders sign-in/sign-up heading', () => {
    render(<SignIn />)
    expect(screen.getByText('Sign In / Sign Up')).toBeInTheDocument()
  })

  test('shows offline unavailable message in desktop-offline mode', () => {
    render(<SignIn />)
    expect(
      screen.getByText(/sign-in and sign-up are unavailable in offline mode/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /continue with/i })
    ).not.toBeInTheDocument()
  })

  test('shows auth not required message when auth is disabled in web mode', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'false'

    render(<SignIn />)
    expect(
      screen.getByText(/authentication is not required in this mode/i)
    ).toBeInTheDocument()
  })

  test('shows no providers configured message when auth is required but env vars are missing', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'

    render(<SignIn />)
    expect(
      screen.getByText(/no sign-in providers are currently configured/i)
    ).toBeInTheDocument()
  })

  test('shows provider buttons when auth is configured', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'
    process.env.VITE_AUTH_EMAIL_ENABLED = 'true'
    process.env.VITE_OAUTH_GOOGLE_CLIENT_ID = 'google-id'

    render(<SignIn />)

    expect(
      screen.getByRole('button', { name: /sign in with email/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign in with google/i })
    ).toBeInTheDocument()
  })

  test('clicking provider button shows integration message', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'
    process.env.VITE_AUTH_EMAIL_ENABLED = 'true'

    render(<SignIn />)

    fireEvent.click(screen.getByRole('button', { name: /sign in with email/i }))
    expect(
      screen.getByText(/configured via backend auth endpoints/i)
    ).toBeInTheDocument()
  })

  test('shows data sync info when providers are configured', () => {
    process.env.VITE_COMPILE_MODE = 'web-online'
    process.env.VITE_AUTH_REQUIRED = 'true'
    process.env.VITE_AUTH_EMAIL_ENABLED = 'true'

    render(<SignIn />)
    expect(
      screen.getByText(
        /data sync will be available once authentication is fully integrated/i
      )
    ).toBeInTheDocument()
  })
})
