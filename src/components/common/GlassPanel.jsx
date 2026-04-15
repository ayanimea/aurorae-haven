/**
 * GlassPanel - Figma-sourced glassmorphism panel component
 * Ported from Figma ZIP: src/app/components/ui/GlassPanel.tsx
 */
import PropTypes from 'prop-types'

const accentBorders = {
  none: 'rgba(255,255,255,0.07)',
  red: 'rgba(220,90,90,0.2)',
  blue: 'rgba(90,130,220,0.2)',
  amber: 'rgba(220,180,70,0.2)',
  purple: 'rgba(160,100,220,0.2)',
  cyan: 'rgba(70,200,220,0.2)',
  emerald: 'rgba(70,200,130,0.2)'
}

const accentBg = {
  none: 'rgba(14,14,28,0.55)',
  red: 'rgba(35,14,18,0.55)',
  blue: 'rgba(14,16,35,0.55)',
  amber: 'rgba(32,26,14,0.55)',
  purple: 'rgba(24,14,32,0.55)',
  cyan: 'rgba(12,22,28,0.55)',
  emerald: 'rgba(12,26,20,0.55)'
}

function GlassPanel({ children, className, style, accent, hover }) {
  const borderColor = accentBorders[accent]

  return (
    <div
      className={`glass-panel ${hover ? 'glass-panel--hover' : ''} ${className ?? ''}`}
      style={{
        background: accentBg[accent],
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(20px) saturate(1.1)',
        borderRadius: '12px',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
    >
      {children}
    </div>
  )
}

GlassPanel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  accent: PropTypes.oneOf(['none', 'red', 'blue', 'amber', 'purple', 'cyan', 'emerald']),
  hover: PropTypes.bool
}

GlassPanel.defaultProps = {
  className: '',
  style: undefined,
  accent: 'none',
  hover: false
}

export default GlassPanel
