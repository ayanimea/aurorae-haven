import React, { useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Button component that triggers a file input dialog
 * Provides consistent styling with regular buttons while handling file selection
 */
function FileInputButton({
  children,
  onFileSelect,
  accept = '*',
  className = 'btn',
  ariaLabel,
  title,
  disabled = false
}) {
  const fileInputRef = useRef(null)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleChange = (e) => {
    if (onFileSelect && e.target.files?.length > 0) {
      onFileSelect(e)
    }
  }

  return (
    <>
      <button
        type='button'
        className={className}
        onClick={handleClick}
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
      >
        {children}
      </button>
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleChange}
        className='sr-only'
        aria-hidden='true'
        tabIndex={-1}
      />
    </>
  )
}

FileInputButton.propTypes = {
  children: PropTypes.node.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  accept: PropTypes.string,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  title: PropTypes.string,
  disabled: PropTypes.bool
}

export default FileInputButton
