#!/usr/bin/env node

import { cpSync, existsSync, rmSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { COMPILATION_MODES, getCompilationMode } from './compilationModes.js'

export const resolveNpmCommand = (platform = process.platform) =>
  platform === 'win32' ? 'npm.cmd' : 'npm'

// Optional explicit override for advanced deployments that need a non-default base path.
export const resolveBaseUrl = (
  defaultBaseUrl,
  baseUrlOverride = process.env.AURORAE_VITE_BASE_URL_OVERRIDE
) => baseUrlOverride || defaultBaseUrl

export const getBuildCommandPlan = (
  modeArg,
  baseUrlOverride = process.env.AURORAE_VITE_BASE_URL_OVERRIDE
) => {
  const mode = getCompilationMode(modeArg)
  if (!mode) {
    return null
  }

  if (mode.key === 'desktop-offline') {
    // Offline packaging requires relative paths (./); base URL overrides are intentionally ignored for file:// and local server compatibility.
    return {
      mode,
      args: ['run', 'build:offline'],
      env: mode.buildEnv
    }
  }

  return {
    mode,
    args: ['run', 'build'],
    env: {
      ...mode.buildEnv,
      VITE_BASE_URL: resolveBaseUrl(mode.buildEnv.VITE_BASE_URL, baseUrlOverride)
    }
  }
}

export const runBuildMode = (modeArg = process.argv[2]) => {
  const plan = getBuildCommandPlan(modeArg)

  if (!plan) {
    console.error(`❌ Unknown compilation mode: '${modeArg ?? ''}'`)
    console.error(`Supported modes: ${Object.keys(COMPILATION_MODES).join(', ')}`)
    process.exit(1)
  }

  const runNpm = (args, envOverrides = {}) => {
    const result = spawnSync(resolveNpmCommand(), args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...envOverrides
      }
    })

    if (result.error) {
      console.error(`❌ Failed to run npm command: ${result.error.message}`)
      process.exit(1)
    }

    if (result.signal) {
      console.error(`❌ npm command terminated by signal: ${result.signal}`)
      process.exit(1)
    }

    if (result.status !== 0) {
      const exitCode = result.status ?? 1
      console.error(`❌ npm command failed with exit code: ${exitCode}`)
      process.exit(exitCode)
    }
  }

  console.log(`🔧 Building mode: ${plan.mode.key}`)
  console.log(`ℹ️  ${plan.mode.description}`)
  runNpm(plan.args, plan.env)

  if (plan.mode.key !== 'android') {
    return
  }

  if (existsSync('dist-android-web')) {
    rmSync('dist-android-web', { recursive: true, force: true })
  }
  cpSync('dist', 'dist-android-web', { recursive: true })
  console.log('✓ Android web bundle is available at dist-android-web/')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBuildMode()
}
