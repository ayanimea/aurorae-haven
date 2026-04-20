import PropTypes from 'prop-types'
import Icon from '../common/Icon'

/**
 * Modal showing detailed metadata for a note
 */
function NoteDetailsModal({
  note = null,
  title = '',
  category = '',
  content,
  onClose
}) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className='modal-overlay'
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role='dialog'
      aria-modal='true'
      aria-labelledby='details-modal-title'
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className='modal-content'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='document'
      >
        <div className='modal-header'>
          <h2 id='details-modal-title'>Note Details</h2>
          <button
            type='button'
            className='btn btn-icon'
            onClick={onClose}
            aria-label='Close'
          >
            <Icon name='x' />
          </button>
        </div>
        <div className='modal-body'>
          <div className='detail-row'>
            <strong>Title:</strong>
            <span>{title || 'Untitled'}</span>
          </div>
          <div className='detail-row'>
            <strong>Category:</strong>
            <span>{category || 'None'}</span>
          </div>
          <div className='detail-row'>
            <strong>Created:</strong>
            <span>
              {note?.createdAt
                ? new Date(note.createdAt).toLocaleString()
                : 'N/A'}
            </span>
          </div>
          <div className='detail-row'>
            <strong>Last Updated:</strong>
            <span>
              {note?.updatedAt
                ? new Date(note.updatedAt).toLocaleString()
                : 'N/A'}
            </span>
          </div>
          <div className='detail-row'>
            <strong>Content Length:</strong>
            <span>{content.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  )
}

NoteDetailsModal.propTypes = {
  note: PropTypes.shape({
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }),
  title: PropTypes.string,
  category: PropTypes.string,
  content: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
}

export default NoteDetailsModal
