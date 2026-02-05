import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from './common/Icon'
import MobileMenu from './Layout/MobileMenu'
import MoreMenu from './Layout/MoreMenu'
import FileInputButton from './common/FileInputButton'

function Layout({ children, onExport, onImport }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const hamburgerButtonRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const moreMenuRef = useRef(null)
  const lastScrollY = useRef(0)

  const isActive = (path) => location.pathname === path

  // TAB-NAV-05: Logo click returns to Tasks without export prompts
  const handleLogoClick = () => {
    navigate('/tasks')
  }

  // Priority 1: Auto-hide header on scroll (landscape mode)
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      // Throttle scroll events using requestAnimationFrame
      // Only the first scroll event schedules an animation frame; subsequent events
      // are ignored until the frame executes and resets ticking to false
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          // Determine scroll direction - fixed threshold gap
          if (currentScrollY <= 50) {
            document.body.classList.add('at-top')
            document.body.classList.remove('scrolling-down', 'scrolling-up')
          } else if (
            currentScrollY > lastScrollY.current &&
            currentScrollY > 50
          ) {
            // Scrolling down
            document.body.classList.add('scrolling-down')
            document.body.classList.remove('scrolling-up', 'at-top')
          } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up
            document.body.classList.add('scrolling-up')
            document.body.classList.remove('scrolling-down', 'at-top')
          }

          lastScrollY.current = currentScrollY
          ticking = false
        })

        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Initial check
    if (window.scrollY <= 50) {
      document.body.classList.add('at-top')
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.body.classList.remove('scrolling-down', 'scrolling-up', 'at-top')
    }
  }, [])

  // TAB-NAV-22: Focus trap and Esc to close
  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.classList.remove('mobile-menu-open')
      return
    }

    document.body.classList.add('mobile-menu-open')

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        hamburgerButtonRef.current?.focus()
      }
    }

    const handleFocusTrap = (e) => {
      if (!mobileMenuRef.current) return

      const focusableElements = mobileMenuRef.current.querySelectorAll(
        'a[href], button:not([disabled])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleFocusTrap)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleFocusTrap)
    }
  }, [mobileMenuOpen])

  // More menu: Escape key, click-outside handling, and body class management
  useEffect(() => {
    if (moreMenuOpen) {
      document.body.classList.add('mobile-menu-open')
    } else {
      document.body.classList.remove('mobile-menu-open')
    }

    if (!moreMenuOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMoreMenuOpen(false)
      }
    }

    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        // Don't close if clicking on the More button itself
        if (!e.target.closest('.more-button')) {
          setMoreMenuOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moreMenuOpen])

  // TAB-NAV-09: Keyboard navigation with arrow keys
  const handleTabKeyDown = (e, tabs, currentIndex) => {
    let newIndex = currentIndex

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
    } else if (e.key === 'Home') {
      e.preventDefault()
      newIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      newIndex = tabs.length - 1
    }

    if (newIndex !== currentIndex) {
      const tabElements = document.querySelectorAll('[role="tab"]')
      tabElements[newIndex]?.focus()
    }
  }

  // Primary tabs shown on mobile bottom bar
  const primaryTabs = [
    {
      path: '/tasks',
      label: 'Tasks',
      icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
    },
    {
      path: '/routines',
      label: 'Routines',
      icon: 'M12 13m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M12 9v5l3 2M9 2h6'
    },
    {
      path: '/braindump',
      label: 'Brain\u00A0Dump', // Non-breaking space for line break on mobile
      icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M20 22H6.5A2.5 2.5 0 0 1 4 19.5V5a2 2 0 0 1 2-2H20z'
    },
    {
      path: '/habits',
      label: 'Habits',
      icon: 'M7 20s6-3 6-10V4M14 4s5 0 6 5c-5 1-6-5-6-5zM2 9c2-5 8-5 8-5s0 6-8 5z'
    },
    {
      path: '/schedule',
      label: 'Schedule',
      icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18'
    }
  ]

  // Secondary tabs in More menu
  const secondaryTabs = [
    {
      path: '/library',
      label: 'Library',
      icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M20 17v-5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5M20 17v5H6.5A2.5 2.5 0 0 1 4 19.5M8 7h8M8 11h4'
    },
    {
      path: '/stats',
      label: 'Stats',
      icon: 'M3 3v18h18M7 10l4 4 4-4 4 4'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6l-.09.1a2 2 0 0 1-3.82 0l-.09.1a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1l-.1-.09a2 2 0 0 1 0-3.82l.1-.09a1.65 1.65 0 0 0 .6-1A1.65 1.65 0 0 0 4.6 8.6l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6l.09-.1a2 2 0 0 1 3.82 0l.09.1a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1 1.65 1.65 0 0 0 .6 1z'
    }
  ]

  // All tabs for desktop
  const tabs = [...primaryTabs, ...secondaryTabs]

  return (
    <>
      <div className='planet-wrap'>
        <div className='planet' />
      </div>
      {/* TAB-NAV-20: role="navigation" with aria-label="Main" */}
      <header className='appbar' role='banner'>
        <div className='inner'>
          {/* TAB-NAV-04 & TAB-NAV-05: Left Zone - Logo/Title */}
          <div className='navbar-left'>
            <button
              className='logo-button'
              onClick={handleLogoClick}
              aria-label='Return to Tasks'
              title='Stellar-Journey'
            >
              <div className='logo' aria-hidden='true' />
            </button>
            <div className='brand'>
              <b>Aurorae Haven</b>
            </div>
          </div>

          {/* TAB-NAV-06: Center Zone - Primary Tabs (Desktop) */}
          {/* TAB-NAV-20 & TAB-NAV-21: role="navigation" and role="tablist" */}
          <nav className='navbar-center' aria-label='Main' role='navigation'>
            <div
              className='appnav'
              role='tablist'
              aria-label='Primary navigation tabs'
              data-testid='desktop-tabs'
            >
              {tabs.map((tab, index) => (
                <Link
                  key={tab.path}
                  className={`nav-tab ${isActive(tab.path) ? 'active' : ''}`}
                  to={tab.path}
                  role='tab'
                  aria-selected={isActive(tab.path)}
                  aria-label={tab.label}
                  tabIndex={isActive(tab.path) ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, tabs, index)}
                >
                  <svg className='icon' viewBox='0 0 24 24' aria-hidden='true'>
                    <path d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile portrait bottom bar: Primary tabs + More button */}
            <div
              className='mobile-bottom-tabs'
              role='presentation'
              aria-hidden='true'
              data-testid='mobile-tabs'
            >
              {primaryTabs.map((tab) => (
                <Link
                  key={`mobile-${tab.path}`}
                  className={`nav-tab ${isActive(tab.path) ? 'active' : ''}`}
                  to={tab.path}
                  tabIndex={-1}
                  aria-hidden='true'
                  onClick={() => setMoreMenuOpen(false)}
                >
                  <svg className='icon' viewBox='0 0 24 24' aria-hidden='true'>
                    <path d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </Link>
              ))}
              {/* More menu button */}
              <button
                className={`nav-tab more-button ${secondaryTabs.some((tab) => isActive(tab.path)) || moreMenuOpen ? 'active' : ''}`}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-haspopup='true'
                aria-expanded={moreMenuOpen}
                aria-label='More options'
                tabIndex={-1}
                aria-hidden='true'
              >
                <svg className='icon' viewBox='0 0 24 24' aria-hidden='true'>
                  <path d='M4 6h16M4 12h16M4 18h16' />
                </svg>
                <span>More</span>
              </button>
            </div>
          </nav>

          {/* More menu for mobile portrait */}
          <MoreMenu
            isOpen={moreMenuOpen}
            onClose={() => setMoreMenuOpen(false)}
            tabs={secondaryTabs}
            isActive={isActive}
            moreMenuRef={moreMenuRef}
          />

          {/* Mobile Settings Button (tablet/phone) */}
          <Link
            className='mobile-settings-button icon-button'
            to='/settings'
            aria-label='Settings'
            title='Settings'
          >
            <Icon name='settings' />
          </Link>

          {/* TAB-NAV-13: Mobile hamburger button */}
          <button
            ref={hamburgerButtonRef}
            className='hamburger-button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label='Toggle navigation menu'
            aria-controls='mobile-menu'
          >
            <Icon name={mobileMenuOpen ? 'x' : 'menu'} />
          </button>

          {/* TAB-NAV-10: Right Zone - Global Actions */}
          <div className='navbar-right'>
            {/* TAB-NAV-10: Search icon (placeholder for future) */}
            <button
              className='icon-button'
              aria-label='Search'
              title='Search (Coming soon)'
            >
              <Icon name='search' />
            </button>

            {/* TAB-NAV-10: Theme toggle (placeholder for future) */}
            <button
              className='icon-button'
              aria-label='Toggle theme'
              title='Theme (Coming soon)'
            >
              <Icon name='moon' />
            </button>

            {/* Export/Import buttons */}
            <button className='btn' onClick={onExport} aria-label='Export data'>
              Export
            </button>
            <FileInputButton
              onFileSelect={onImport}
              accept='application/json'
              ariaLabel='Import data file'
              title='Import data'
            >
              Import
            </FileInputButton>
          </div>
        </div>
      </header>

      {/* TAB-NAV-14 & TAB-NAV-22: Mobile hamburger menu with aria-modal */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        tabs={tabs}
        isActive={isActive}
        mobileMenuRef={mobileMenuRef}
      />

      <div className='shell'>{children}</div>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  onExport: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired
}

export default Layout
