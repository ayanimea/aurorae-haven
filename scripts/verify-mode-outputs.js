#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'fs'

const checks = [
  {
    path: 'dist/index.html',
    description: 'online web build output'
  },
  {
    path: 'dist-offline-build/index.html',
    description: 'offline desktop build output'
  },
  {
    path: 'dist-android-web/index.html',
    description: 'android web bundle output'
  },
  {
    path: 'android/twa-manifest.json',
    description: 'android APK packaging manifest'
  }
]

let hasFailure = false
let manifestAvailable = false

for (const check of checks) {
  if (!existsSync(check.path)) {
    console.error(`❌ Missing ${check.description}: ${check.path}`)
    hasFailure = true
    continue
  }

  const stats = statSync(check.path)
  if (stats.size === 0) {
    console.error(`❌ Empty ${check.description}: ${check.path}`)
    hasFailure = true
    continue
  }

  console.log(`✓ Found ${check.description}: ${check.path}`)
  if (check.path === 'android/twa-manifest.json') {
    manifestAvailable = true
  }
}

if (manifestAvailable) {
  const twaManifest = JSON.parse(readFileSync('android/twa-manifest.json', 'utf-8'))
  const requiredManifestFields = [
    'packageId',
    'host',
    'name',
    'startUrl',
    'iconUrl',
    'appVersionName',
    'appVersionCode'
  ]

  for (const field of requiredManifestFields) {
    if (!twaManifest[field]) {
      console.error(
        `❌ Android packaging manifest is missing required field: ${field}`
      )
      hasFailure = true
    }
  }

  if (!hasFailure) {
    console.log('✓ Android APK packaging manifest includes required fields.')
  }
}

if (hasFailure) {
  process.exit(1)
}

console.log('✓ All compilation mode outputs were generated successfully.')
