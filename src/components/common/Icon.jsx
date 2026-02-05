import React from 'react'
import PropTypes from 'prop-types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('Icon')

/**
 * Common icon component for SVG icons
 * Reduces duplication of SVG markup across components
 */
function Icon({ name, className = 'icon', ...props }) {
  const icons = {
    // Common actions
    plus: (
      <>
        <path d='M12 5v14M5 12h14' />
      </>
    ),
    x: (
      <>
        <line x1='18' y1='6' x2='6' y2='18' />
        <line x1='6' y1='6' x2='18' y2='18' />
      </>
    ),
    check: (
      <>
        <polyline points='20 6 9 17 4 12' />
      </>
    ),
    edit: (
      <>
        <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
        <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
      </>
    ),
    trash: (
      <>
        <polyline points='3 6 5 6 21 6' />
        <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
      </>
    ),
    trashAlt: (
      <>
        <path d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' />
        <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
      </>
    ),

    // Import/Export
    upload: (
      <>
        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
        <polyline points='17 8 12 3 7 8' />
        <line x1='12' y1='3' x2='12' y2='15' />
      </>
    ),
    download: (
      <>
        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
        <polyline points='7 10 12 15 17 10' />
        <line x1='12' y1='15' x2='12' y2='3' />
      </>
    ),

    // Lock states
    lock: (
      <>
        <rect x='5' y='11' width='14' height='10' rx='2' ry='2' />
        <path d='M7 11V7a5 5 0 0 1 10 0v4' />
      </>
    ),
    unlock: (
      <>
        <rect x='5' y='11' width='14' height='10' rx='2' ry='2' />
        <path d='M7 11V7a5 5 0 0 1 9.9-1' />
      </>
    ),

    // Navigation
    menu: (
      <>
        <line x1='3' y1='12' x2='21' y2='12' />
        <line x1='3' y1='6' x2='21' y2='6' />
        <line x1='3' y1='18' x2='21' y2='18' />
      </>
    ),
    filter: (
      <>
        <polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' />
      </>
    ),

    // Info/Help
    info: (
      <>
        <circle cx='12' cy='12' r='10' />
        <line x1='12' y1='16' x2='12' y2='12' />
        <line x1='12' y1='8' x2='12.01' y2='8' />
      </>
    ),
    helpCircle: (
      <>
        <circle cx='12' cy='12' r='10' />
        <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
        <line x1='12' y1='17' x2='12.01' y2='17' />
      </>
    ),
    alertCircle: (
      <>
        <circle cx='12' cy='12' r='10' />
        <line x1='12' y1='8' x2='12' y2='12' />
        <line x1='12' y1='16' x2='12.01' y2='16' />
      </>
    ),

    // Media controls
    play: (
      <>
        <polygon points='5 3 19 12 5 21 5 3' />
      </>
    ),
    pause: (
      <>
        <rect x='6' y='4' width='4' height='16' />
        <rect x='14' y='4' width='4' height='16' />
      </>
    ),
    skip: (
      <>
        <polygon points='5 4 15 12 5 20 5 4' />
        <rect x='17' y='4' width='2' height='16' />
      </>
    ),

    // Other icons
    search: (
      <>
        <circle cx='11' cy='11' r='8' />
        <line x1='21' y1='21' x2='16.65' y2='16.65' />
      </>
    ),
    moon: (
      <>
        <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
      </>
    ),
    file: (
      <>
        <path d='M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' />
        <polyline points='13 2 13 9 20 9' />
      </>
    ),
    grid: (
      <>
        <rect x='3' y='3' width='7' height='7' />
        <rect x='14' y='3' width='7' height='7' />
        <rect x='3' y='14' width='7' height='7' />
        <rect x='14' y='14' width='7' height='7' />
      </>
    ),
    list: (
      <>
        <line x1='8' y1='6' x2='21' y2='6' />
        <line x1='8' y1='12' x2='21' y2='12' />
        <line x1='8' y1='18' x2='21' y2='18' />
        <line x1='3' y1='6' x2='3.01' y2='6' />
        <line x1='3' y1='12' x2='3.01' y2='12' />
        <line x1='3' y1='18' x2='3.01' y2='18' />
      </>
    ),
    settings: (
      <>
        <circle cx='12' cy='12' r='3' />
        <path d='M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24' />
      </>
    ),

    // Schedule-specific icons
    chevronDown: (
      <>
        <polyline points='6 9 12 15 18 9' />
      </>
    ),
    chevronLeft: (
      <>
        <polyline points='15 18 9 12 15 6' />
      </>
    ),
    chevronRight: (
      <>
        <polyline points='9 18 15 12 9 6' />
      </>
    ),
    repeat: (
      <>
        <polyline points='17 1 21 5 17 9' />
        <path d='M3 11V9a4 4 0 0 1 4-4h14' />
        <polyline points='7 23 3 19 7 15' />
        <path d='M21 13v2a4 4 0 0 1-4 4H3' />
      </>
    ),
    checkCircle: (
      <>
        <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
        <polyline points='22 4 12 14.01 9 11.01' />
      </>
    ),
    users: (
      <>
        <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
        <circle cx='9' cy='7' r='4' />
        <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
        <path d='M16 3.13a4 4 0 0 1 0 7.75' />
      </>
    ),
    target: (
      <>
        <circle cx='12' cy='12' r='10' />
        <circle cx='12' cy='12' r='6' />
        <circle cx='12' cy='12' r='2' />
      </>
    ),
    inbox: (
      <>
        <polyline points='22 12 16 12 14 15 10 15 8 12 2 12' />
        <path d='M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' />
      </>
    ),
    loader: (
      <>
        <line x1='12' y1='2' x2='12' y2='6' />
        <line x1='12' y1='18' x2='12' y2='22' />
        <line x1='4.93' y1='4.93' x2='7.76' y2='7.76' />
        <line x1='16.24' y1='16.24' x2='19.07' y2='19.07' />
        <line x1='2' y1='12' x2='6' y2='12' />
        <line x1='18' y1='12' x2='22' y2='12' />
        <line x1='4.93' y1='19.07' x2='7.76' y2='16.24' />
        <line x1='16.24' y1='7.76' x2='19.07' y2='4.93' />
      </>
    )
  }

  const iconPath = icons[name]

  if (!iconPath) {
    logger.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <svg className={className} viewBox='0 0 24 24' {...props}>
      {iconPath}
    </svg>
  )
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string
}

export default Icon
