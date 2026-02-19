#!/usr/bin/env node

/**
 * Create Offline Package Script
 *
 * This script creates a downloadable archive of the built application
 * for offline use. It builds the app with relative paths so users can
 * open index.html directly without needing a web server.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import { DIST_DIR, DIST_OFFLINE_DIR, OUTPUT_DIR } from './buildConstants.js'

const VERSION = JSON.parse(readFileSync('package.json', 'utf-8')).version

/**
 * Copy embedded server and launcher scripts to offline build
 */
async function copyEmbeddedServer() {
  const { copyFileSync, chmodSync } = await import('fs')
  const { fileURLToPath } = await import('url')
  const { dirname } = await import('path')

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  console.log('📦 Copying embedded servers and launchers...')

  // Copy Python embedded server
  const pythonServerSrc = join(__dirname, 'embedded-server.py')
  const pythonServerDest = join(DIST_OFFLINE_DIR, 'embedded-server.py')
  copyFileSync(pythonServerSrc, pythonServerDest)

  // Copy Node.js embedded server
  const nodeServerSrc = join(__dirname, 'embedded-server.js')
  const nodeServerDest = join(DIST_OFFLINE_DIR, 'embedded-server.js')
  copyFileSync(nodeServerSrc, nodeServerDest)

  // Copy all launcher scripts
  const launcherTemplates = [
    'start-aurorae-haven.bat',
    'start-aurorae-haven.sh',
    'start-aurorae-haven.command',
    'start-aurorae-haven-python.bat',
    'start-aurorae-haven-python.sh',
    'start-aurorae-haven-python.command'
  ]

  for (const launcher of launcherTemplates) {
    const src = join(__dirname, 'launcher-templates', launcher)
    const dest = join(DIST_OFFLINE_DIR, launcher)
    if (existsSync(src)) {
      copyFileSync(src, dest)

      // Make shell scripts executable on Unix-like systems
      if (
        launcher.endsWith('.sh') ||
        launcher.endsWith('.command') ||
        launcher.endsWith('.py')
      ) {
        try {
          chmodSync(dest, 0o755)
        } catch (err) {
          // Silently ignore chmod errors on Windows
        }
      }
    }
  }

  // Make embedded servers executable on Unix-like systems
  try {
    chmodSync(pythonServerDest, 0o755)
    chmodSync(nodeServerDest, 0o755)
  } catch (err) {
    // Silently ignore chmod errors on Windows
  }

  console.log('✓ Embedded servers and launchers copied')
}

/**
 * Build the application with relative base path for offline use
 */
async function buildForOffline() {
  const { execSync } = await import('child_process')

  console.log(
    '🔨 Building application for offline use (with relative paths)...'
  )

  // Clean up previous offline build
  if (existsSync(DIST_OFFLINE_DIR)) {
    rmSync(DIST_OFFLINE_DIR, { recursive: true, force: true })
  }

  try {
    // Build with relative base path for offline use
    try {
      execSync('npm run build', {
        stdio: 'inherit',
        encoding: 'utf-8',
        env: { ...process.env, VITE_BASE_URL: './', CI: 'true' }
      })
    } catch (buildError) {
      throw new Error(
        `Vite build failed: ${buildError.message}\n` +
          `  Make sure dependencies are installed: npm ci\n` +
          `  Exit code: ${buildError.status || 'unknown'}`
      )
    }

    // Verify build output exists
    if (!existsSync(DIST_DIR)) {
      throw new Error(
        `Build completed but dist/ directory not found.\n` +
          `  Expected location: ${DIST_DIR}\n` +
          `  This may indicate a build configuration issue.`
      )
    }

    // Copy the dist directory to our offline build directory
    // Note: We copy instead of move to preserve dist/ for GitHub Pages deployment
    try {
      execSync(`cp -r "${DIST_DIR}" "${DIST_OFFLINE_DIR}"`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      })
    } catch (cpError) {
      throw new Error(
        `Failed to copy build directory: ${cpError.message}\n` +
          `  From: ${DIST_DIR}\n` +
          `  To: ${DIST_OFFLINE_DIR}`
      )
    }

    // Verify the copy was successful
    if (!existsSync(DIST_OFFLINE_DIR)) {
      throw new Error(
        `Build directory was not copied to expected location: ${DIST_OFFLINE_DIR}`
      )
    }

    // Copy embedded server and launchers
    await copyEmbeddedServer()

    console.log('✓ Offline build completed with relative paths')
    return true
  } catch (error) {
    console.error('❌ Build failed:')
    console.error(error.message)
    return false
  }
}

/**
 * Create a tar.gz archive of the offline build
 */
async function createTarGz() {
  console.log('📦 Creating offline package...')

  if (!existsSync(DIST_OFFLINE_DIR)) {
    console.error('❌ Error: offline build directory not found. Build failed.')
    process.exit(1)
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const outputFile = join(
    OUTPUT_DIR,
    `aurorae-haven-offline-v${VERSION}.tar.gz`
  )

  try {
    // For simplicity, we'll use a shell command to create tar.gz
    const { execSync } = await import('child_process')

    console.log(`  → Archiving ${DIST_OFFLINE_DIR}/ to ${outputFile}`)

    // Validate source directory before archiving
    if (!existsSync(DIST_OFFLINE_DIR)) {
      throw new Error(
        `Source directory not found: ${DIST_OFFLINE_DIR}. Build may have failed.`
      )
    }

    // Add README to the offline build directory
    const readmeContent = await generateReadme()
    const readmePath = join(DIST_OFFLINE_DIR, 'README.md')
    writeFileSync(readmePath, readmeContent)
    console.log('  → Added README.md to package')

    // Create tar.gz using shell command (more reliable and compatible)
    // Note: Using spawnSync with array args to prevent command injection
    try {
      const { spawnSync } = await import('child_process')
      const result = spawnSync(
        'tar',
        ['-czf', outputFile, '-C', DIST_OFFLINE_DIR, '.'],
        {
          stdio: 'inherit'
        }
      )

      if (result.error) {
        throw result.error
      }

      if (result.status !== 0) {
        throw new Error(
          `tar command failed with exit code ${result.status}: ${result.stderr}`
        )
      }
    } catch (tarError) {
      // Provide detailed error information based on error type
      if (tarError.code === 127 || tarError.message.includes('not found')) {
        throw new Error(
          'tar command not found. Please install tar utility:\n' +
            '  - Linux/macOS: tar is usually pre-installed\n' +
            '  - Windows: Install via Git Bash, WSL, or 7-Zip'
        )
      } else if (
        tarError.message.includes('Permission denied') ||
        tarError.code === 'EACCES'
      ) {
        throw new Error(
          `Permission denied while creating archive.\n` +
            `  - Check write permissions for: ${OUTPUT_DIR}\n` +
            `  - Check read permissions for: ${DIST_OFFLINE_DIR}`
        )
      } else if (
        tarError.message.includes('No space left') ||
        tarError.code === 'ENOSPC'
      ) {
        throw new Error(
          'No space left on device. Free up disk space and try again.'
        )
      } else {
        throw new Error(
          `Failed to create tar.gz archive: ${tarError.message}\n` +
            `  Command: tar -czf "${outputFile}" -C "${DIST_OFFLINE_DIR}" .\n` +
            `  Exit code: ${tarError.status || 'unknown'}`
        )
      }
    }

    // Verify the archive was created successfully
    if (!existsSync(outputFile)) {
      throw new Error(
        `Archive was not created at expected location: ${outputFile}`
      )
    }

    // Get file size
    const stats = statSync(outputFile)
    const sizeKB = (stats.size / 1024).toFixed(2)

    // Verify the archive has content
    if (stats.size === 0) {
      throw new Error(
        'Archive was created but is empty. Source directory may be empty.'
      )
    }

    console.log(`✓ Offline package created successfully!`)
    console.log(`  → Location: ${outputFile}`)
    console.log(`  → Size: ${sizeKB} KB`)
    console.log('')
    console.log('📝 Usage Instructions:')
    console.log('  1. Extract: tar -xzf aurorae-haven-offline-*.tar.gz')
    console.log('  2. Read README.md in the extracted folder')
    console.log(
      '  3. Start a local web server (e.g., python3 -m http.server 8000)'
    )
    console.log('  4. Open http://localhost:8000 in your browser')
    console.log('')
    console.log('⚠️  Important: A local web server is required (see README.md)')

    return true
  } catch (error) {
    console.error('❌ Error creating package:')
    console.error(error.message)
    return false
  }
}

/**
 * Alternative: Create a simple ZIP using built-in archiver
 * Fallback if tar command is not available
 */
async function createSimpleArchive() {
  console.log('📦 Creating simple archive (fallback method)...')

  if (!existsSync(DIST_OFFLINE_DIR)) {
    console.error('❌ Error: offline build directory not found. Build failed.')
    process.exit(1)
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const outputFile = join(OUTPUT_DIR, `aurorae-haven-offline-v${VERSION}.tar`)

  console.log(`  → Creating archive: ${outputFile}`)
  console.log('  ℹ️  Note: Compression not available, using uncompressed tar')

  // Create README for the offline package
  const readmeContent = await generateReadme()

  // Try to create ZIP with adm-zip
  try {
    return await createZipWithAdmZip(
      outputFile.replace('.tar', '.zip'),
      readmeContent
    )
  } catch (error) {
    console.warn('⚠️  adm-zip not available, using basic method:', error.message)
  }

  // Fallback: Just copy files to a folder with README
  const outputFolder = join(OUTPUT_DIR, `aurorae-haven-offline-v${VERSION}`)

  if (!existsSync(outputFolder)) {
    mkdirSync(outputFolder, { recursive: true })
  }

  console.log(`  → Copying files to: ${outputFolder}`)

  const { execSync } = await import('child_process')
  execSync(`cp -r ${DIST_OFFLINE_DIR}/* "${outputFolder}/"`, {
    stdio: 'inherit'
  })

  // Write README
  const readmePath = join(outputFolder, 'README-OFFLINE.md')
  const fs = await import('fs')
  fs.writeFileSync(readmePath, readmeContent)

  console.log('✓ Offline package folder created!')
  console.log(`  → Location: ${outputFolder}`)
  console.log('  → You can now ZIP this folder manually or use it directly')

  return true
}

/**
 * Generate README content for offline package
 */
async function generateReadme() {
  const { fileURLToPath } = await import('url')
  const { dirname } = await import('path')

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const templatePath = join(__dirname, 'offline-package-readme-template.md')
  let content = readFileSync(templatePath, 'utf-8')

  // Replace placeholders
  content = content.replace(/{{VERSION}}/g, VERSION)
  content = content.replace(/{{BUILD_DATE}}/g, new Date().toISOString())

  return content
}

/**
 * Create ZIP using adm-zip package
 */
async function createZipWithAdmZip(outputFile, readmeContent) {
  const { default: AdmZip } = await import('adm-zip')

  const zip = new AdmZip()

  // Add README
  zip.addFile('README.md', Buffer.from(readmeContent, 'utf-8'))

  // Add all files from offline build directory recursively
  zip.addLocalFolder(DIST_OFFLINE_DIR, '')

  zip.writeZip(outputFile)

  const sizeKB = (statSync(outputFile).size / 1024).toFixed(2)
  console.log('✓ ZIP archive created successfully!')
  console.log(`  → Location: ${outputFile}`)
  console.log(`  → Size: ${sizeKB} KB`)
  return true
}

/**
 * Create ZIP archive using archiver
 */
async function createZip() {
  console.log('📦 Creating ZIP archive...')

  if (!existsSync(DIST_OFFLINE_DIR)) {
    console.error('❌ Error: offline build directory not found. Build failed.')
    return false
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const outputFile = join(OUTPUT_DIR, `aurorae-haven-offline-v${VERSION}.zip`)

  try {
    const readmeContent = await generateReadme()
    const { writeFileSync } = await import('fs')

    // Add README to the offline build directory
    const readmePath = join(DIST_OFFLINE_DIR, 'README.md')
    writeFileSync(readmePath, readmeContent)
    console.log('  → Added README.md to package')

    // Try to create ZIP with adm-zip
    const admZip = await import('adm-zip').catch(() => null)

    if (!admZip) {
      console.warn('⚠️  adm-zip package not available, skipping ZIP creation')
      return false
    }

    await createZipWithAdmZip(outputFile, readmeContent)
    return true
  } catch (error) {
    console.error('❌ Error creating ZIP:')
    console.error(error.message)
    return false
  }
}

// Main execution
;(async () => {
  console.log('🌌 Aurorae Haven - Offline Package Creator\n')

  // Step 1: Build for offline with relative paths
  const buildSuccess = await buildForOffline()
  if (!buildSuccess) {
    console.error('❌ Build failed, cannot create package')
    process.exit(1)
  }

  // Step 2: Create tar.gz archive
  let tarGzSuccess = false
  try {
    tarGzSuccess = await createTarGz()
  } catch (error) {
    console.warn('⚠️  tar.gz creation failed:', error.message)
  }

  // Note: We no longer create a ZIP archive here because GitHub Actions
  // will automatically create one from the directory specified by DIST_OFFLINE_DIR.
  // Creating a ZIP here would result in nested archives (zip-in-zip).

  // Report results
  console.log('\n' + '='.repeat(70))
  if (tarGzSuccess) {
    console.log('✅ Offline package creation complete!')
    console.log('  ✓ tar.gz created for releases and offline-releases branch')
    console.log(
      `  ℹ️  GitHub Actions will create a ZIP from ${DIST_OFFLINE_DIR}/ for artifacts`
    )

    // Keep the temporary build directory for GitHub Actions to use
    console.log(
      `  ℹ️  Keeping ${DIST_OFFLINE_DIR}/ for GitHub Actions artifact upload`
    )
    process.exit(0)
  } else {
    // Clean up on failure
    if (existsSync(DIST_OFFLINE_DIR)) {
      rmSync(DIST_OFFLINE_DIR, { recursive: true, force: true })
      console.log('  ✓ Cleaned up temporary build directory')
    }
    console.error('❌ Failed to create offline package')
    process.exit(1)
  }
})()
