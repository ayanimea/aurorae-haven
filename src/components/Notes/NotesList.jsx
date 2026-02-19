
import PropTypes from 'prop-types'
import clsx from 'clsx'
import Icon from '../common/Icon'

/**
 * Component for displaying and searching the list of notes
 */
function NotesList({
  notes,
  filteredNotes,
  currentNoteId,
  searchQuery,
  showNoteList,
  onSearchChange,
  onClearSearch,
  onToggleNoteList,
  onFilterClick,
  onNoteClick,
  onNoteContextMenu,
  onNewNote
}) {
  if (!showNoteList) return null

  return (
    <div className='note-list-sidebar'>
      <div className='note-list-header'>
        <div className='note-list-header-left'>
          <strong>Notes</strong>
          <button type="button"
            className='btn btn-icon toggle-notes-btn'
            onClick={onToggleNoteList}
            aria-label='Hide notes list'
            title='Hide notes list'
          >
            <Icon name='menu' />
          </button>
          <button type="button"
            className='btn btn-icon'
            onClick={onFilterClick}
            aria-label='Filter Notes'
            title='Filter Notes'
          >
            <Icon name='filter' />
          </button>
        </div>
        <button type="button"
          className='btn btn-icon'
          onClick={onNewNote}
          aria-label='New Note'
          title='New Note'
        >
          <Icon name='plus' />
        </button>
      </div>
      <div className='note-search'>
        <input
          type='text'
          placeholder='Search notes...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='note-search-input'
          aria-label='Search notes'
        />
        {searchQuery && (
          <button type="button"
            className='btn btn-icon note-search-clear'
            onClick={onClearSearch}
            aria-label='Clear search'
            title='Clear search'
          >
            <Icon name='x' />
          </button>
        )}
      </div>
      <div className='note-list'>
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={clsx('note-item', { active: note.id === currentNoteId })}
            onClick={() => onNoteClick(note)}
            onContextMenu={(e) => onNoteContextMenu(e, note)}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNoteClick(note)
              }
            }}
          >
            <div className='note-item-title' title={note.title || 'Untitled'}>
              {note.locked && (
                <svg
                  className='icon note-item-lock-icon'
                  viewBox='0 0 24 24'
                  aria-label='Locked'
                >
                  <rect x='5' y='11' width='14' height='10' rx='2' ry='2' />
                  <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                </svg>
              )}
              {note.title || 'Untitled'}
            </div>
            <div className='note-item-metadata'>
              <div className='note-item-date'>
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
              {note.category && (
                <div className='note-item-category'>{note.category}</div>
              )}
            </div>
          </div>
        ))}
        {filteredNotes.length === 0 && notes.length > 0 && (
          <div className='note-list-empty'>
            No notes found matching &quot;{searchQuery}&quot;
          </div>
        )}
        {notes.length === 0 && (
          <div className='note-list-empty'>
            No notes yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  )
}

NotesList.propTypes = {
  notes: PropTypes.array.isRequired,
  filteredNotes: PropTypes.array.isRequired,
  currentNoteId: PropTypes.string,
  searchQuery: PropTypes.string.isRequired,
  showNoteList: PropTypes.bool.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onClearSearch: PropTypes.func.isRequired,
  onToggleNoteList: PropTypes.func.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  onNoteClick: PropTypes.func.isRequired,
  onNoteContextMenu: PropTypes.func.isRequired,
  onNewNote: PropTypes.func.isRequired
}

export default NotesList
