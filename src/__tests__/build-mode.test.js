import { describe, expect, it } from 'vitest'
import {
  getBuildCommandPlan,
  resolveBaseUrl,
  resolveNpmCommand
} from '../../scripts/build-mode.js'

describe('build-mode script helpers', () => {
  it('resolves npm command by platform', () => {
    expect(resolveNpmCommand('win32')).toBe('npm.cmd')
    expect(resolveNpmCommand('linux')).toBe('npm')
  })

  it('resolves base URL with optional explicit override', () => {
    expect(resolveBaseUrl('/aurorae-haven/', '/')).toBe('/')
    expect(resolveBaseUrl('./', '')).toBe('./')
  })

  it('returns a deterministic build plan per mode', () => {
    expect(getBuildCommandPlan('desktop-offline', '/')).toMatchObject({
      args: ['run', 'build:offline'],
      env: {
        VITE_COMPILE_MODE: 'desktop-offline',
        VITE_BASE_URL: '/',
        VITE_AUTH_REQUIRED: 'false'
      }
    })

    expect(getBuildCommandPlan('android', '/')).toMatchObject({
      args: ['run', 'build'],
      env: {
        VITE_COMPILE_MODE: 'android',
        VITE_BASE_URL: '/',
        VITE_AUTH_REQUIRED: 'true'
      }
    })

    expect(getBuildCommandPlan('web-online')).toMatchObject({
      args: ['run', 'build'],
      env: {
        VITE_COMPILE_MODE: 'web-online',
        VITE_BASE_URL: '/aurorae-haven/',
        VITE_AUTH_REQUIRED: 'true'
      }
    })
  })

  it('preserves default base URL when override is not provided', () => {
    expect(getBuildCommandPlan('desktop-offline')).toMatchObject({
      env: {
        VITE_BASE_URL: './'
      }
    })
  })

  it('applies explicit base URL override for desktop-offline mode', () => {
    expect(getBuildCommandPlan('desktop-offline', '/custom-base/')).toMatchObject({
      env: {
        VITE_BASE_URL: '/custom-base/'
      }
    })
  })

  it('returns null for unknown modes', () => {
    expect(getBuildCommandPlan('unknown')).toBeNull()
  })
})
