// src/index.js
import React, { useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom'
// Styles
import './assets/styles/styles.css'

// Shell components
import Layout from './components/Layout.jsx'
import Toast from './components/Toast.jsx'

// Pages
import Home from './pages/Home.jsx'
import Schedule from './pages/Schedule.jsx'
import Routines from './pages/Routines.jsx'
import Notes from './pages/Notes.jsx'
import Tasks from './pages/Tasks.jsx'
import Habits from './pages/Habits.jsx'
import Stats from './pages/Stats.jsx'
import Library from './pages/Library.jsx'
import Settings from './pages/Settings.jsx'

// Utils
import {
  exportJSON,
  importJSON,
  reloadPageAfterDelay,
  IMPORT_SUCCESS_MESSAGE
} from './utils/dataManager'
import { normalizeRedirectPath } from './utils/redirectHelpers'
import { createLogger } from './utils/logger'
import { getSettings } from './utils/settingsManager'
import { initAutoSave } from './utils/autoSaveFS'
import { withErrorHandling } from './utils/errorHandler'

// Create namespaced loggers for different concerns
const redirectLogger = createLogger('RedirectHandler')
const routerLogger = createLogger('RouterApp')
const swLogger = createLogger('ServiceWorker')

// Component to handle GitHub Pages 404 redirect
function RedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    redirectLogger.log('Checking for redirectPath in sessionStorage...')
    const redirectPath = sessionStorage.getItem('redirectPath')
    redirectLogger.log('redirectPath:', redirectPath)

    if (redirectPath) {
      sessionStorage.removeItem('redirectPath')
      const basename = import.meta.env.BASE_URL || '/'
      redirectLogger.log('basename:', basename)

      // Use shared utility to normalize the redirect path
      const path = normalizeRedirectPath(redirectPath, basename)
      redirectLogger.log('Normalized path:', path)

      // Navigate to the correct route
      redirectLogger.log('Navigating to:', path)
      navigate(path, { replace: true })
    } else {
      redirectLogger.log('No redirectPath found, normal page load')
    }
  }, [navigate])

  return null
}

function RouterApp() {
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = useCallback((message) => {
    setToast({ visible: true, message })
  }, [])

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: '' })
  }, [])

  const handleExport = useCallback(async () => {
    await withErrorHandling(
      async () => {
        await exportJSON()
        showToast('Data exported successfully')
      },
      'Exporting data',
      {
        showToast: false,
        onError: (error) => {
          showToast('Export failed: ' + error.message)
        }
      }
    )
  }, [showToast])

  const handleImport = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      if (file) {
        await withErrorHandling(
          async () => {
            await importJSON(file)
            showToast(IMPORT_SUCCESS_MESSAGE)
            // Use shared utility function for page reload
            reloadPageAfterDelay(1500)
          },
          'Importing data',
          {
            showToast: false,
            onError: (error) => {
              showToast('Import failed: ' + error.message)
            }
          }
        )
        // allow re-selecting the same file next time
        e.target.value = ''
      }
    },
    [showToast]
  )

  // Use import.meta.env.BASE_URL for Vite (GitHub Pages project site, see DEFAULT_GITHUB_PAGES_BASE_PATH in configConstants.js)
  // For offline builds with BASE_URL='./', normalize to '/' for React Router
  const baseUrl = import.meta.env.BASE_URL || '/'
  const basename = baseUrl === './' ? '/' : baseUrl

  routerLogger.log('BASE_URL:', import.meta.env.BASE_URL)
  routerLogger.log('baseUrl:', baseUrl)
  routerLogger.log('basename for BrowserRouter:', basename)

  // Initialize auto-save system on mount
  useEffect(() => {
    const settings = getSettings()
    if (settings.autoSave) {
      initAutoSave(settings.autoSave).catch((error) => {
        routerLogger.error('Failed to initialize auto-save:', error)
      })
    }
  }, [])

  return (
    <BrowserRouter basename={basename}>
      <RedirectHandler />
      <Layout onExport={handleExport}>
        <Routes>
          {/* Figma-aligned landing: Tasks at root */}
          <Route path='/' element={<Tasks />} />

          {/* Explicit routes */}
          <Route path='/home' element={<Home />} />
          <Route path='/schedule' element={<Schedule />} />
          <Route path='/routines' element={<Routines />} />
          {/* Legacy route redirect */}
          <Route
            path='/sequences'
            element={<Navigate to='/routines' replace />}
          />
          <Route path='/braindump' element={<Notes />} />
          <Route path='/brain-dump' element={<Notes />} />
          <Route path='/tasks' element={<Tasks />} />
          <Route path='/habits' element={<Habits />} />
          <Route path='/stats' element={<Stats />} />
          <Route path='/library' element={<Library />} />
          <Route
            path='/settings'
            element={
              <Settings onExport={handleExport} onImport={handleImport} />
            }
          />

          {/* Fallback: unknown routes → home */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Layout>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={hideToast}
      />
    </BrowserRouter>
  )
}

// Clean up old service workers registered at wrong scope
// This fixes the issue where an old SW at root scope (/) interferes with the new SW at the configured base path
if ('serviceWorker' in navigator) {
  const expectedScope = new URL(
    import.meta.env.BASE_URL || '/',
    window.location.origin
  ).href
  swLogger.log('Expected scope:', expectedScope)

  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      swLogger.log(
        'Found',
        registrations.length,
        'registered service worker(s)'
      )

      registrations.forEach((registration) => {
        const scopeUrl = registration.scope
        swLogger.log('Checking SW with scope:', scopeUrl)

        // Unregister service workers with wrong scope
        if (scopeUrl !== expectedScope) {
          swLogger.log('Unregistering SW with wrong scope:', scopeUrl)
          registration
            .unregister()
            .then((success) => {
              if (success) {
                swLogger.log('Successfully unregistered old SW')
              }
            })
            .catch((error) => {
              swLogger.error('Failed to unregister SW:', error)
            })
        } else {
          swLogger.log('SW scope is correct, keeping it')
        }
      })
    })
    .catch((error) => {
      swLogger.error('Error checking registrations:', error)
    })
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <RouterApp />
  </React.StrictMode>
)

// Service worker is automatically registered by vite-plugin-pwa via registerSW.js
// The plugin generates sw.js with proper navigation fallback configuration

// Log service worker status for debugging
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready
    .then((registration) => {
      swLogger.log('Service worker is active and ready')
      swLogger.log('Scope:', registration.scope)
      swLogger.log('Active SW:', registration.active?.scriptURL)
    })
    .catch((error) => {
      swLogger.error('No service worker is ready yet:', error.message)
    })
}
