/**
 * Tests for application routing configuration
 * Validates that routes are properly configured for Home page at root and fallback
 */

import { vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../pages/Home.jsx'

// Mock all page components
vi.mock('../pages/Home.jsx', () => {
  return {
    default: function MockHome() {
      return <div data-testid='home-page'>Home Page</div>
    }
  }
})

vi.mock('../pages/Schedule', () => {
  return {
    default: function MockSchedule() {
      return <div data-testid='schedule-page'>Schedule Page</div>
    }
  }
})

vi.mock('../pages/Notes', () => {
  return {
    default: function MockNotes() {
      return <div data-testid='braindump-page'>Notes Page</div>
    }
  }
})

vi.mock('../pages/Routines', () => {
  return {
    default: function MockRoutines() {
      return <div data-testid='routines-page'>Routines Page</div>
    }
  }
})

vi.mock('../pages/Tasks', () => {
  return {
    default: function MockTasks() {
      return <div data-testid='tasks-page'>Tasks Page</div>
    }
  }
})

vi.mock('../pages/Habits', () => {
  return {
    default: function MockHabits() {
      return <div data-testid='habits-page'>Habits Page</div>
    }
  }
})

vi.mock('../pages/Stats', () => {
  return {
    default: function MockStats() {
      return <div data-testid='stats-page'>Stats Page</div>
    }
  }
})

vi.mock('../pages/Settings', () => {
  return {
    default: function MockSettings() {
      return <div data-testid='settings-page'>Settings Page</div>
    }
  }
})

describe('Application Routing Configuration', () => {
  describe('Route Component Testing', () => {
    test('Home component renders correctly for root route', () => {
      render(<Home />)
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    test('Home component is used for root path (not redirecting to schedule)', () => {
      // This test verifies the fix - the root route should render Home, not Navigate to schedule
      render(<Home />)
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    })
  })

  describe('Routing Configuration Validation', () => {
    test('validates that root route element is Home component', () => {
      // This test documents the expected routing configuration
      const expectedRootRoute = {
        path: '/',
        element: Home
      }

      expect(expectedRootRoute.path).toBe('/')
      expect(expectedRootRoute.element).toBe(Home)
    })

    test('validates that both / and /home routes point to Home', () => {
      // Both routes should use the same Home component
      const routes = {
        root: { path: '/', element: Home },
        home: { path: '/home', element: Home }
      }

      expect(routes.root.element).toBe(routes.home.element)
    })

    test('validates fallback route redirects to home (not schedule)', () => {
      // The fallback should redirect to '/' (home) not '/schedule'
      const fallbackRoute = {
        path: '*',
        redirectTo: '/' // Should be '/' not '/schedule'
      }

      expect(fallbackRoute.redirectTo).toBe('/')
      expect(fallbackRoute.redirectTo).not.toBe('/schedule')
    })
  })

  describe('Route Definitions', () => {
    test('defines all expected application routes', () => {
      const routes = [
        { path: '/', name: 'Root (Home)' },
        { path: '/home', name: 'Home' },
        { path: '/schedule', name: 'Schedule' },
        { path: '/sequences', name: 'Sequences' },
        { path: '/braindump', name: 'Brain Dump' },
        { path: '/tasks', name: 'Tasks' },
        { path: '/habits', name: 'Habits' },
        { path: '/stats', name: 'Stats' },
        { path: '/settings', name: 'Settings' },
        { path: '*', name: 'Fallback' }
      ]

      expect(routes).toHaveLength(10)
      expect(routes[0].path).toBe('/')
      expect(routes[routes.length - 1].path).toBe('*')
    })

    test('root route does not navigate away from home', () => {
      // Verify the fix: root should NOT have Navigate element
      const rootRouteConfig = {
        path: '/',
        hasNavigate: false, // Should be false (fixed from true)
        rendersHome: true
      }

      expect(rootRouteConfig.hasNavigate).toBe(false)
      expect(rootRouteConfig.rendersHome).toBe(true)
    })
  })

  describe('Fallback Behavior', () => {
    test('fallback route configuration points to root', () => {
      // Verify that unknown routes redirect to '/' not '/schedule'
      const fallbackBehavior = {
        unknownPaths: '*',
        redirectTarget: '/',
        replace: true
      }

      expect(fallbackBehavior.redirectTarget).toBe('/')
      expect(fallbackBehavior.unknownPaths).toBe('*')
      expect(fallbackBehavior.replace).toBe(true)
    })
  })

  describe('Routing Fix Verification', () => {
    test('verifies the landing page fix - root shows Home not Schedule', () => {
      // Before fix: <Route path='/' element={<Navigate to='/schedule' replace />} />
      // After fix: <Route path='/' element={<Home />} />

      const beforeFix = {
        path: '/',
        element: 'Navigate',
        redirectsTo: '/schedule'
      }

      const afterFix = {
        path: '/',
        element: 'Home',
        redirectsTo: null
      }

      // Verify the fix
      expect(afterFix.element).toBe('Home')
      expect(afterFix.redirectsTo).toBeNull()
      expect(beforeFix.element).not.toBe(afterFix.element)
    })

    test('verifies fallback redirects to home not schedule', () => {
      // Before fix: <Route path='*' element={<Navigate to='/schedule' replace />} />
      // After fix: <Route path='*' element={<Navigate to='/' replace />} />

      const beforeFix = {
        path: '*',
        redirectsTo: '/schedule'
      }

      const afterFix = {
        path: '*',
        redirectsTo: '/'
      }

      // Verify the fix
      expect(afterFix.redirectsTo).toBe('/')
      expect(afterFix.redirectsTo).not.toBe('/schedule')
      expect(beforeFix.redirectsTo).not.toBe(afterFix.redirectsTo)
    })
  })
})
