import { useMemo, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { COMPILATION_MODES } from '../../scripts/compilationModes'
import Icon from '../components/common/Icon'
import '../assets/styles/settings.css'

const AUTH_PROVIDER_LABELS = {
  email: 'Email',
  google: 'Google',
  facebook: 'Facebook',
  github: 'GitHub'
}

const AUTH_PROVIDER_ICONS = {
  email: 'mail',
  google: 'globe',
  facebook: 'users',
  github: 'gitBranch'
}

function SignIn() {
  const navigate = useNavigate()
  const [message, setMessage] = useState({ text: '', isError: false })

  const processEnv =
    typeof process !== 'undefined' && process?.env ? process.env : {}
  const viteEnv =
    typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env : {}
  const isTestEnv =
    viteEnv.MODE === 'test' || processEnv.NODE_ENV === 'test'
  const getEnvVariable = (key) =>
    isTestEnv ? processEnv[key] ?? viteEnv[key] : viteEnv[key] ?? processEnv[key]

  const compileMode = getEnvVariable('VITE_COMPILE_MODE') || 'desktop-offline'
  const authRequired = getEnvVariable('VITE_AUTH_REQUIRED') === 'true'
  const modeProviders = COMPILATION_MODES[compileMode]?.authProviders ?? []
  const emailAuthEnabled = getEnvVariable('VITE_AUTH_EMAIL_ENABLED') === 'true'
  const googleClientId = getEnvVariable('VITE_OAUTH_GOOGLE_CLIENT_ID') || ''
  const facebookAppId = getEnvVariable('VITE_OAUTH_FACEBOOK_APP_ID') || ''
  const githubClientId = getEnvVariable('VITE_OAUTH_GITHUB_CLIENT_ID') || ''

  const configuredProviders = useMemo(
    () => {
      if (!authRequired) return []
      return modeProviders
        .filter((provider) => {
          if (provider === 'email') return emailAuthEnabled
          if (provider === 'google') return Boolean(googleClientId)
          if (provider === 'facebook') return Boolean(facebookAppId)
          if (provider === 'github') return Boolean(githubClientId)
          return false
        })
        .map((provider) => ({
          key: provider,
          label: AUTH_PROVIDER_LABELS[provider],
          icon: AUTH_PROVIDER_ICONS[provider]
        }))
        .filter((provider) => Boolean(provider.label))
    },
    [
      authRequired,
      modeProviders,
      emailAuthEnabled,
      googleClientId,
      facebookAppId,
      githubClientId
    ]
  )

  const handleProviderSignIn = useCallback(
    (providerLabel) => {
      setMessage({
        text: `${providerLabel} authentication is configured via backend auth endpoints (see docs/BACKEND_REQUIREMENTS.md). Integration in progress.`,
        isError: false
      })
    },
    []
  )

  const handleBackClick = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // Offline / auth-not-required guard
  const authUnavailable = compileMode === 'desktop-offline' || !authRequired
  const noProviders = authRequired && configuredProviders.length === 0

  return (
    <div className='card'>
      <div className='card-h'>
        <strong>Sign In / Sign Up</strong>
        <button
          type='button'
          className='figma-icon-btn'
          onClick={handleBackClick}
          aria-label='Go back'
          title='Go back'
        >
          <Icon name='x' />
        </button>
      </div>
      <div className='card-b'>
        {authUnavailable ? (
          <div className='settings-section'>
            <p className='settings-placeholder-text'>
              {compileMode === 'desktop-offline'
                ? 'Sign-in and sign-up are unavailable in offline mode. All data is stored locally on your device.'
                : 'Authentication is not required in this mode.'}
            </p>
            <div className='settings-button-group' style={{ marginTop: '1rem' }}>
              <Link to='/settings' className='settings-button settings-button-primary'>
                Back to Settings
              </Link>
            </div>
          </div>
        ) : noProviders ? (
          <div className='settings-section'>
            <p className='settings-placeholder-text'>
              No sign-in providers are currently configured for this mode.
            </p>
            <p className='settings-hint'>
              Set the required environment variables (
              <code>VITE_AUTH_EMAIL_ENABLED</code>,{' '}
              <code>VITE_OAUTH_GOOGLE_CLIENT_ID</code>, etc.) and rebuild to
              enable sign-in.
            </p>
            <div className='settings-button-group' style={{ marginTop: '1rem' }}>
              <Link to='/settings' className='settings-button settings-button-primary'>
                Back to Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className='settings-section'>
            <p className='settings-hint' style={{ marginBottom: '1.5rem' }}>
              Any existing local data will be synced to your account when you
              sign in.
            </p>

            <div className='signin-provider-list'>
              {configuredProviders.map((provider) => (
                <button
                  type='button'
                  key={provider.key}
                  className='signin-provider-btn'
                  onClick={() => handleProviderSignIn(provider.label)}
                  aria-label={`Sign in with ${provider.label}`}
                >
                  <Icon name={provider.icon} className='signin-provider-icon' />
                  <span>Continue with {provider.label}</span>
                </button>
              ))}
            </div>

            {message.text && (
              <div
                className={`settings-message ${message.isError ? 'settings-message-error' : ''}`}
                role='status'
                aria-live='polite'
              >
                {message.text}
              </div>
            )}

            <p className='signin-footer-text'>
              By signing in you agree to your data being synced to an account.{' '}
              <Link to='/settings' className='signin-footer-link'>
                Return to Settings
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignIn
