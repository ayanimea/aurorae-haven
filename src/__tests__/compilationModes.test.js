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
  })

  it('requires google, facebook, and github auth providers in signed-in modes', () => {
    expect(getCompilationMode('android')?.authProviders).toEqual([
      'google',
      'facebook',
      'github'
    ])
    expect(getCompilationMode('web-online')?.authProviders).toEqual([
      'google',
      'facebook',
      'github'
    ])
  })

  it('returns null for unknown modes', () => {
    expect(getCompilationMode('unknown')).toBeNull()
  })
})
