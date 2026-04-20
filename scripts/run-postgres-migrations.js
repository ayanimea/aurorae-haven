#!/usr/bin/env node

import { readdirSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is required.')
  process.exit(1)
}

const migrationsDir = 'database/postgresql/migrations'
const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b))

if (migrations.length === 0) {
  console.error(`❌ No migration files found in ${migrationsDir}.`)
  process.exit(1)
}

for (const migration of migrations) {
  const migrationPath = join(migrationsDir, migration)
  console.log(`▶ Running migration: ${migrationPath}`)

  const result = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', databaseUrl, '-f', migrationPath], {
    stdio: 'inherit'
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('✓ PostgreSQL migrations completed successfully.')
