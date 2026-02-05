/**
 * Tests for Layout component (Global Navbar - TAB-NAV)
 * Validates navbar structure, accessibility, keyboard navigation, and responsive behavior
 */

import React from 'react'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout.jsx'

// Helper to render component with router
const renderWithRouter = (component, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route)
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

// Mock functions for export/import
const mockOnExport = jest.fn()
const mockOnImport = jest.fn()

describe('Layout Component - Global Navbar (TAB-NAV)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TAB-NAV-01: Three-zone structure', () => {
    test('renders left zone with logo and title', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      // Logo button
      expect(
        screen.getByRole('button', { name: /return to tasks/i })
      ).toBeInTheDocument()

      // Brand text (slogan removed for compact design)
      expect(screen.getByText(/aurorae haven/i)).toBeInTheDocument()
    })

    test('renders center zone with primary tabs', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      // Check all primary tabs exist
      expect(screen.getByRole('tab', { name: /^tasks$/i })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /^routines$/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /^habits$/i })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /^schedule$/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /brain[\s\u00A0]dump/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /^library$/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: /^settings$/i })
      ).toBeInTheDocument()
    })

    test('renders right zone with global actions', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      // Search and theme toggle icons
      expect(
        screen.getByRole('button', { name: /search/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /toggle theme/i })
      ).toBeInTheDocument()

      // Export/Import buttons
      expect(
        screen.getByRole('button', { name: /export data/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/import/i)).toBeInTheDocument()
    })
  })

  describe('TAB-NAV-04 & TAB-NAV-05: Logo functionality', () => {
    test('logo button has proper accessibility attributes', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const logoButton = screen.getByRole('button', {
        name: /return to tasks/i
      })
      expect(logoButton).toHaveAttribute('title', 'Stellar-Journey')
    })

    test('logo button is clickable', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>,
        { route: '/schedule' }
      )

      const logoButton = screen.getByRole('button', {
        name: /return to tasks/i
      })

      // Should not throw error
      expect(() => fireEvent.click(logoButton)).not.toThrow()
    })
  })

  describe('TAB-NAV-06 & TAB-NAV-07: Primary tabs styling', () => {
    test('all eight primary tabs are present', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(8)
    })

    test('tabs have proper structure with icons and text', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })

      // Check for icon (SVG) and text
      expect(tasksTab.querySelector('svg')).toBeInTheDocument()
      expect(tasksTab.querySelector('span')).toHaveTextContent('Tasks')
    })
  })

  describe('TAB-NAV-08: Active tab state', () => {
    test('tasks tab has aria-selected when on /tasks route', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>,
        { route: '/tasks' }
      )

      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })
      // aria-selected uses boolean true, which becomes string 'true' in HTML
      expect(tasksTab).toHaveAttribute('aria-selected')
    })

    test('tabs have tabindex attribute for keyboard navigation', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>,
        { route: '/tasks' }
      )

      const routinesTab = screen.getByRole('tab', { name: /^routines$/i })
      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })

      // Both tabs should have tabindex attribute (either 0 or -1)
      expect(routinesTab).toHaveAttribute('tabindex')
      expect(tasksTab).toHaveAttribute('tabindex')
    })

    test('tabs have active class styling capability', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>,
        { route: '/tasks' }
      )

      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })
      // Check tasks tab has nav-tab class (base styling)
      expect(tasksTab.className).toContain('nav-tab')
    })
  })

  describe('TAB-NAV-09: Keyboard navigation', () => {
    test('tabs can be focused with Tab key', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })
      tasksTab.focus()
      expect(tasksTab).toHaveFocus()
    })

    test('arrow right key moves focus to next tab', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>,
        { route: '/tasks' }
      )

      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })
      const routinesTab = screen.getByRole('tab', { name: /^routines$/i })

      tasksTab.focus()
      fireEvent.keyDown(tasksTab, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(routinesTab).toHaveFocus()
      })
    })

    test('arrow left key moves focus to previous tab', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const routinesTab = screen.getByRole('tab', { name: /^routines$/i })
      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })

      routinesTab.focus()
      fireEvent.keyDown(routinesTab, { key: 'ArrowLeft' })

      await waitFor(() => {
        expect(tasksTab).toHaveFocus()
      })
    })

    test('home key moves focus to first tab', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const settingsTab = screen.getByRole('tab', { name: /^settings$/i })
      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })

      settingsTab.focus()
      fireEvent.keyDown(settingsTab, { key: 'Home' })

      await waitFor(() => {
        expect(tasksTab).toHaveFocus()
      })
    })

    test('end key moves focus to last tab', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const tasksTab = screen.getByRole('tab', { name: /^tasks$/i })
      const settingsTab = screen.getByRole('tab', { name: /^settings$/i })

      tasksTab.focus()
      fireEvent.keyDown(tasksTab, { key: 'End' })

      await waitFor(() => {
        expect(settingsTab).toHaveFocus()
      })
    })
  })

  describe('TAB-NAV-10: Right zone global actions', () => {
    test('search icon button is present', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toBeInTheDocument()
      expect(searchButton).toHaveAttribute('title', 'Search (Coming soon)')
    })

    test('theme toggle button is present', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const themeButton = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeButton).toBeInTheDocument()
      expect(themeButton).toHaveAttribute('title', 'Theme (Coming soon)')
    })

    test('export button calls onExport handler', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const exportButton = screen.getByRole('button', { name: /export data/i })
      fireEvent.click(exportButton)

      expect(mockOnExport).toHaveBeenCalledTimes(1)
    })

    test('import file input calls onImport handler', () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      // Find the hidden file input
      const importInput = container.querySelector('input[type="file"]')
      const file = new File(['{}'], 'test.json', { type: 'application/json' })

      fireEvent.change(importInput, { target: { files: [file] } })

      expect(mockOnImport).toHaveBeenCalledTimes(1)
    })
  })

  describe('TAB-NAV-13: Mobile hamburger menu', () => {
    test('hamburger button is present', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i
      })
      expect(hamburgerButton).toBeInTheDocument()
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
      expect(hamburgerButton).toHaveAttribute('aria-controls', 'mobile-menu')
    })

    test('clicking hamburger opens mobile menu', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i
      })
      fireEvent.click(hamburgerButton)

      // Check aria-expanded changed
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

      // Check mobile menu appears
      await waitFor(() => {
        const mobileMenu = screen.getByRole('navigation', {
          name: /mobile navigation menu/i
        })
        expect(mobileMenu).toBeInTheDocument()
      })
    })

    test('mobile menu has all navigation items', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i
      })
      fireEvent.click(hamburgerButton)

      await waitFor(() => {
        // Get the mobile menu container
        const mobileMenu = screen.getByRole('navigation', {
          name: /mobile navigation menu/i
        })

        // Mobile menu items are links, not menuitems (accessibility fix)
        const expectedNavItems = [
          /tasks/i,
          /routines/i,
          /brain[\s\u00A0]dump/i, // support both regular and non-breaking space
          /habits/i,
          /schedule/i,
          /library/i,
          /stats/i,
          /settings/i
        ]

        expectedNavItems.forEach((pattern) => {
          const link = within(mobileMenu).getByRole('link', { name: pattern })
          expect(link).toBeInTheDocument()
        })
      })
    })

    test('clicking mobile menu item closes menu and navigates', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i
      })
      fireEvent.click(hamburgerButton)

      await waitFor(() => {
        // Mobile menu items are links, not menuitems (accessibility fix)
        const tasksMenuItem = screen.getByRole('link', { name: /tasks/i })
        fireEvent.click(tasksMenuItem)
      })

      // Menu should close
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('TAB-NAV-20 & TAB-NAV-21: ARIA roles and labels', () => {
    test('header has role="banner"', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const banner = screen.getByRole('banner')
      expect(banner).toBeInTheDocument()
    })

    test('nav has role="navigation" with aria-label', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const nav = screen.getByRole('navigation', { name: /main/i })
      expect(nav).toBeInTheDocument()
    })

    test('tablist has proper aria-label', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const tablist = screen.getByRole('tablist', {
        name: /primary navigation tabs/i
      })
      expect(tablist).toBeInTheDocument()
    })

    test('all tabs have role="tab"', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const tabs = screen.getAllByRole('tab')
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('role', 'tab')
      })
    })
  })

  describe('TAB-NAV-22: Focus trap and escape key', () => {
    test('pressing Escape closes mobile menu', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i
      })
      fireEvent.click(hamburgerButton)

      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')
      })

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
      })
    })

    test('mobile menu renders when hamburger button is clicked', async () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const hamburgerButton = screen.getByRole('button', {
        name: /toggle navigation menu/i
      })
      fireEvent.click(hamburgerButton)

      await waitFor(() => {
        const mobileMenu = screen.getByRole('navigation', {
          name: /mobile navigation menu/i
        })
        expect(mobileMenu).toBeInTheDocument()
      })
    })
  })

  describe('Content rendering', () => {
    test('renders children content', () => {
      renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div data-testid='test-content'>Test Content</div>
        </Layout>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('renders planet decoration', () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const planetWrap = container.querySelector('.planet-wrap')
      expect(planetWrap).toBeInTheDocument()

      const planet = container.querySelector('.planet')
      expect(planet).toBeInTheDocument()
    })
  })

  describe('MoreMenu component tests', () => {
    test('More button is present in the UI', () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      expect(moreButton).toBeInTheDocument()
    })

    test('More button has correct accessibility attributes', () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      expect(moreButton).toHaveAttribute('aria-expanded', 'false')
      expect(moreButton).toHaveAttribute('aria-haspopup', 'true')
    })

    test('clicking More button opens MoreMenu', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'true')
        const moreMenu = screen.getByRole('navigation', {
          name: /additional navigation options/i
        })
        expect(moreMenu).toBeInTheDocument()
      })
    })

    test('MoreMenu displays correct secondary tabs', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        const moreMenu = screen.getByRole('navigation', {
          name: /additional navigation options/i
        })

        // MoreMenu should have Library, Stats, and Settings (secondary tabs)
        const expectedTabs = [/library/i, /stats/i, /settings/i]

        expectedTabs.forEach((pattern) => {
          const link = within(moreMenu).getByRole('link', { name: pattern })
          expect(link).toBeInTheDocument()
        })
      })
    })

    test('clicking MoreMenu item closes menu and navigates', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'true')
      })

      const libraryLink = screen.getByRole('link', { name: /library/i })
      fireEvent.click(libraryLink)

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'false')
      })
    })

    test('pressing Escape closes MoreMenu', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'true')
      })

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'false')
      })
    })

    test('clicking outside MoreMenu closes it', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'true')
      })

      // Click outside the menu (on the body)
      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(moreButton).toHaveAttribute('aria-expanded', 'false')
      })
    })

    test('MoreMenu has proper ARIA attributes', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        const moreMenu = screen.getByRole('navigation', {
          name: /additional navigation options/i
        })

        expect(moreMenu).toHaveAttribute('role', 'navigation')
        expect(moreMenu).toHaveAttribute(
          'aria-label',
          'Additional navigation options'
        )
      })
    })

    test('opening MoreMenu adds mobile-menu-open class to body', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')

      // Initially, body should not have the class
      expect(document.body.classList.contains('mobile-menu-open')).toBe(false)

      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(document.body.classList.contains('mobile-menu-open')).toBe(true)
      })
    })

    test('closing MoreMenu removes mobile-menu-open class from body', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')

      // Open the menu
      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(document.body.classList.contains('mobile-menu-open')).toBe(true)
      })

      // Close the menu
      fireEvent.click(moreButton)

      await waitFor(() => {
        expect(document.body.classList.contains('mobile-menu-open')).toBe(false)
      })
    })

    test('MoreMenu items have correct to paths', async () => {
      const { container } = renderWithRouter(
        <Layout onExport={mockOnExport} onImport={mockOnImport}>
          <div>Content</div>
        </Layout>
      )

      const moreButton = container.querySelector('.more-button')
      fireEvent.click(moreButton)

      await waitFor(() => {
        const moreMenu = screen.getByRole('navigation', {
          name: /additional navigation options/i
        })
        // Verify all secondary tabs exist with correct paths
        const libraryLink = within(moreMenu).getByRole('link', {
          name: /library/i
        })
        expect(libraryLink).toBeInTheDocument()
        expect(libraryLink).toHaveAttribute('href', '/library')

        const statsLink = within(moreMenu).getByRole('link', { name: /stats/i })
        expect(statsLink).toHaveAttribute('href', '/stats')

        const settingsLink = within(moreMenu).getByRole('link', {
          name: /settings/i
        })
        expect(settingsLink).toHaveAttribute('href', '/settings')
      })
    })
  })
})
