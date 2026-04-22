#!/usr/bin/env node

import { spawnSync } from 'child_process'
import { existsSync } from 'fs'

const manifestPath = 'android/twa-manifest.json'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const bubblewrapCliVersion = '1.24.1'
const bubblewrapCliPackage = `@bubblewrap/cli@${bubblewrapCliVersion}`

if (!existsSync('dist-android-web/')) {
  console.error(
    '❌ dist-android-web/ not found. Run `npm run build:mode:android` first.'
  )
  process.exit(1)
}

if (!existsSync(manifestPath)) {
  console.error(`❌ Missing ${manifestPath}.`)
  process.exit(1)
}

const versionCheck = spawnSync(
  npxCommand,
  ['--yes', bubblewrapCliPackage, '--version'],
  { stdio: 'pipe' }
)
if (versionCheck.error) {
  console.error(
    `❌ Unable to execute npx for Bubblewrap CLI check: ${versionCheck.error.message}`
  )
  process.exit(1)
}
if (versionCheck.status !== 0) {
  const stderr = versionCheck.stderr?.toString().trim()
  const stdout = versionCheck.stdout?.toString().trim()
  const output = stderr || stdout
  console.error(
    `❌ Unable to run Bubblewrap CLI (${bubblewrapCliPackage}) with npx (exit code: ${versionCheck.status ?? 'unknown'}). Run "npx --yes ${bubblewrapCliPackage} --version" to troubleshoot.${output ? `\n${output}` : ''}`
  )
  process.exit(1)
}

const build = spawnSync(
  npxCommand,
  ['--yes', bubblewrapCliPackage, 'build', '--config', manifestPath],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      BUBBLEWRAP_BUILD_DIR: 'dist-android-web'
    }
  }
)

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

console.log('✓ Android package build command completed.')
