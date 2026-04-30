import { useMemo, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { COMPILATION_MODES } from '../../scripts/compilationModes'
import { getEnvVar } from '../utils/environment'
import { AUTH_PROVIDERS, PROVIDER_ENV_VARS } from '../utils/authProviders'
import Icon from '../components/common/Icon'
import '../assets/styles/settings.css'

function SignIn() {
  const navigate = useNavigate()
  const [message, setMessage] = useState({ text: '', isError: false })

  const compileMode = getEnvVar('VITE_COMPILE_MODE') || 'desktop-offline'
  const authRequired = getEnvVar('VITE_AUTH_REQUIRED') === 'true'
  const modeProviders = COMPILATION_MODES[compileMode]?.authProviders ?? []

  const configuredProviders = useMemo(
    () => {
      if (!authRequired) return []
      return modeProviders
        .filter((providerKey) => {
          if (!AUTH_PROVIDERS[providerKey]) return false
          const envVar = PROVIDER_ENV_VARS[providerKey]
          if (!envVar) return false
          // VITE_AUTH_EMAIL_ENABLED is a boolean flag — only the literal string 'true' means enabled
          if (providerKey === 'email') return getEnvVar(envVar) === 'true'
          // OAuth providers use a client-ID/app-ID string; any non-empty value means configured
          return Boolean(getEnvVar(envVar))
        })
        .map((providerKey) => ({
          key: providerKey,
          ...AUTH_PROVIDERS[providerKey]
        }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authRequired, modeProviders]
  )

  const handleProviderSignIn = useCallback((providerLabel) => {
    setMessage({
      text: `${providerLabel} authentication is configured via backend auth endpoints (see docs/BACKEND_REQUIREMENTS.md). Integration in progress.`,
      isError: false
    })
  }, [])

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
            <div
              className='settings-button-group'
              style={{ marginTop: '1rem' }}
            >
              <Link
                to='/settings'
                className='settings-button settings-button-primary'
              >
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
            <div
              className='settings-button-group'
              style={{ marginTop: '1rem' }}
            >
              <Link
                to='/settings'
                className='settings-button settings-button-primary'
              >
                Back to Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className='settings-section'>
            <p className='settings-hint' style={{ marginBottom: '1.5rem' }}>
              Sign in to access your account. Data sync will be available once
              authentication is fully integrated.
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
