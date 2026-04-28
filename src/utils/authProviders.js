/**
 * Single source of truth for auth provider display config and env var mapping.
 * Imported by both SignIn and Settings pages to prevent label drift.
 *
 * @type {Record<string, { label: string, icon: string }>}
 *   Keys are provider identifiers ('email', 'google', 'facebook', 'github').
 *   Each value has:
 *   - `label`: human-readable name shown in the UI
 *   - `icon`: camelCase icon name from the Icon component
 */
export const AUTH_PROVIDERS = {
  email: { label: 'Email', icon: 'mail' },
  google: { label: 'Google', icon: 'globe' },
  facebook: { label: 'Facebook', icon: 'users' },
  github: { label: 'GitHub', icon: 'gitBranch' }
}

/**
 * Maps provider keys to the environment variable that enables them.
 * VITE_AUTH_EMAIL_ENABLED is a boolean flag ('true' enables Email sign-in).
 * OAuth providers use a client-ID/app-ID string; any non-empty value means configured.
 */
export const PROVIDER_ENV_VARS = {
  email: 'VITE_AUTH_EMAIL_ENABLED',
  google: 'VITE_OAUTH_GOOGLE_CLIENT_ID',
  facebook: 'VITE_OAUTH_FACEBOOK_APP_ID',
  github: 'VITE_OAUTH_GITHUB_CLIENT_ID'
}
