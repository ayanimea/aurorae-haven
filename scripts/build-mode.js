#!/usr/bin/env node

import { cpSync, existsSync, rmSync } from 'fs'
import { spawnSync } from 'child_process'
import { COMPILATION_MODES, getCompilationMode } from './compilationModes.js'

const modeArg = process.argv[2]
const mode = getCompilationMode(modeArg)

if (!mode) {
  console.error('❌ Unknown compilation mode.')
  console.error(`Supported modes: ${Object.keys(COMPILATION_MODES).join(', ')}`)
  process.exit(1)
}

const runNpm = (args, envOverrides = {}) => {
  const result = spawnSync('npm', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides
    }
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log(`🔧 Building mode: ${mode.key}`)
console.log(`ℹ️  ${mode.description}`)

if (mode.key === 'desktop-offline') {
  runNpm(['run', 'build:offline'], mode.buildEnv)
  process.exit(0)
}

if (mode.key === 'android') {
  runNpm(['run', 'build'], mode.buildEnv)
  if (existsSync('dist-android-web')) {
    rmSync('dist-android-web', { recursive: true, force: true })
  }
  cpSync('dist', 'dist-android-web', { recursive: true })
  console.log('✓ Android web bundle is available at dist-android-web/')
  process.exit(0)
}

runNpm(['run', 'build'], {
  ...mode.buildEnv,
  VITE_BASE_URL: process.env.VITE_BASE_URL || mode.buildEnv.VITE_BASE_URL
})
