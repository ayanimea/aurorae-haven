
import PropTypes from 'prop-types'
import Icon from './Icon'

/**
 * Reusable button component with icon support
 * Provides consistent button styling and behavior
 */
function Button({
  children,
  onClick,
  icon,
  variant = 'default',
  disabled = false,
  type = 'button',
  className = '',
  ariaLabel,
  title
}) {
  const variantClasses = {
    default: 'btn',
    primary: 'btn btn-primary',
    icon: 'btn btn-icon',
    delete: 'btn btn-delete',
    save: 'btn-save',
    cancel: 'btn-cancel',
    edit: 'btn-edit'
  }

  const buttonClass = `${variantClasses[variant] || 'btn'} ${className}`.trim()

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  icon: PropTypes.string,
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'icon',
    'delete',
    'save',
    'cancel',
    'edit'
  ]),
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  title: PropTypes.string
}

export default Button
