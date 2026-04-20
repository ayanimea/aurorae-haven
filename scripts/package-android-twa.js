#!/usr/bin/env node

import { spawnSync } from 'child_process'
import { existsSync } from 'fs'

const manifestPath = 'android/twa-manifest.json'

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
  'npx',
  ['--yes', '@bubblewrap/cli', '--version'],
  { stdio: 'pipe' }
)
if (versionCheck.status !== 0) {
  console.error(
    '❌ Unable to run Bubblewrap CLI with npx. Install @bubblewrap/cli and retry.'
  )
  process.exit(1)
}

const build = spawnSync(
  'npx',
  ['--yes', '@bubblewrap/cli', 'build', '--config', manifestPath],
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
