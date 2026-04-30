import { describe, expect, it } from 'vitest'
import {
  COMPILATION_MODES,
  getCompilationMode
} from '../../scripts/compilationModes.js'

describe('compilation modes', () => {
  it('defines android, desktop-offline, and web-online modes', () => {
    expect(Object.keys(COMPILATION_MODES).sort()).toEqual([
      'android',
      'desktop-offline',
      'web-online'
    ])
    expect(getCompilationMode('android')?.buildEnv.VITE_COMPILE_MODE).toBe('android')
    expect(getCompilationMode('desktop-offline')?.buildEnv.VITE_COMPILE_MODE).toBe(
      'desktop-offline'
    )
    expect(getCompilationMode('desktop-offline')?.buildEnv.VITE_BASE_URL).toBe('./')
    expect(getCompilationMode('web-online')?.buildEnv.VITE_COMPILE_MODE).toBe('web-online')
  })

  it('requires email, google, facebook, and github auth providers in signed-in modes', () => {
    expect(getCompilationMode('android')?.authProviders).toEqual([
      'email',
      'google',
      'facebook',
      'github'
    ])
    expect(getCompilationMode('web-online')?.authProviders).toEqual([
      'email',
      'google',
      'facebook',
      'github'
    ])
  })

  it('returns null for unknown modes', () => {
    expect(getCompilationMode('unknown')).toBeNull()
  })
})
