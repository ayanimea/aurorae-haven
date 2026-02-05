import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

/**
 * More menu component for mobile bottom tab bar
 * Shows secondary tabs (Library, Stats, Settings) in an expanded bar
 */
function MoreMenu({ isOpen, onClose, tabs, isActive, moreMenuRef }) {
  if (!isOpen) return null

  return (
    <nav
      ref={moreMenuRef}
      className='more-menu'
      role='navigation'
      aria-label='Additional navigation options'
    >
      <div className='more-menu-content'>
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            className={`more-menu-item ${isActive(tab.path) ? 'active' : ''}`}
            to={tab.path}
            onClick={onClose}
            aria-current={isActive(tab.path) ? 'page' : undefined}
            aria-label={tab.label}
            title={tab.label}
          >
            <svg className='icon' viewBox='0 0 24 24' aria-hidden='true'>
              <path d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

MoreMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired
    })
  ).isRequired,
  isActive: PropTypes.func.isRequired,
  moreMenuRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ])
}

export default MoreMenu
