
import { useState } from 'react'
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
  onNestNote,
  onNoteContextMenu,
  onNewNote,
  sortMode,
  onSortModeChange
}) {
  const [draggedNoteId, setDraggedNoteId] = useState(null)
  const [nestTargets, setNestTargets] = useState({})
  if (!showNoteList) return null

  const visibleNotes = filteredNotes

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
      <label className='note-list-sort'>
        Sort notes
        <select
          value={sortMode}
          onChange={(event) => onSortModeChange(event.target.value)}
          aria-label='Sort notes'
        >
          <option value='recent'>Recently updated</option>
          <option value='category'>Category A–Z</option>
        </select>
      </label>
      <p className='note-list-hint'>
        Drag a note onto a top-level note to nest it (two levels maximum).
      </p>
      <div className='note-list'>
        {visibleNotes.map((note) => {
          const parentNote = note.parentNoteId
            ? notes.find((item) => item.id === note.parentNoteId)
            : null
          const canNest =
            !note.locked &&
            !notes.some((item) => item.parentNoteId === note.id)
          const parentOptions = canNest
            ? notes.filter(
                (item) =>
                  item.id !== note.id &&
                  !item.locked &&
                  !item.parentNoteId
              )
            : []
          const nestTarget = nestTargets[note.id] || ''
          return <div
            key={note.id}
            draggable={!note.locked}
            className={clsx('note-item', {
              active: note.id === currentNoteId,
              'sub-note': Boolean(note.parentNoteId)
            })}
            onDragStart={(event) => {
              if (note.locked) {
                event.preventDefault()
                return
              }
              setDraggedNoteId(note.id)
              event.dataTransfer?.setData('text/plain', note.id)
            }}
            onDragOver={(event) => {
              if (
                draggedNoteId &&
                draggedNoteId !== note.id &&
                !note.locked &&
                !note.parentNoteId &&
                !notes.some((item) => item.parentNoteId === draggedNoteId)
              ) {
                event.preventDefault()
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              const sourceId =
                draggedNoteId || event.dataTransfer?.getData('text/plain')
              if (
                sourceId &&
                sourceId !== note.id &&
                !note.locked &&
                !note.parentNoteId &&
                !notes.some((item) => item.parentNoteId === sourceId)
              ) {
                onNestNote(sourceId, note.id)
              }
              setDraggedNoteId(null)
            }}
            onDragEnd={() => setDraggedNoteId(null)}
            onContextMenu={(e) => onNoteContextMenu(e, note)}
            role='group'
            aria-label={`Note: ${note.title || 'Untitled'}`}
          >
            <button
              type='button'
              className='note-item-title'
              onClick={() => onNoteClick(note)}
              title={note.title || 'Untitled'}
            >
              {note.locked && (
                <svg
                  className='icon note-item-lock-icon'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <rect x='5' y='11' width='14' height='10' rx='2' ry='2' />
                  <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                </svg>
              )}
              {note.title || 'Untitled'}
            </button>
            <div className='note-item-metadata'>
              <div className='note-item-date'>
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
              {note.category && (
                <div className='note-item-category'>{note.category}</div>
              )}
              {note.parentNoteId && (
                <div className='note-item-parent'>
                  Sub-note of {parentNote?.title || 'Untitled'}
                </div>
              )}
              {parentOptions.length > 0 && (
                <div className='note-item-nesting'>
                  <label>
                    Nest under
                    <select
                      value={nestTarget}
                      onChange={(event) =>
                        setNestTargets((targets) => ({
                          ...targets,
                          [note.id]: event.target.value
                        }))
                      }
                      aria-label={`Choose a parent for ${note.title || 'Untitled'}`}
                    >
                      <option value=''>Choose a note</option>
                      {parentOptions.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          Nest under {parent.title || 'Untitled'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type='button'
                    className='btn'
                    aria-label={`Nest ${note.title || 'Untitled'} under the selected parent`}
                    disabled={!nestTarget}
                    onClick={() => {
                      onNestNote(note.id, nestTarget)
                      setNestTargets((targets) => ({
                        ...targets,
                        [note.id]: ''
                      }))
                    }}
                  >
                    Nest note
                  </button>
                </div>
              )}
            </div>
          </div>
        })}
        {visibleNotes.length === 0 && notes.length > 0 && (
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
  onNestNote: PropTypes.func.isRequired,
  onNoteContextMenu: PropTypes.func.isRequired,
  onNewNote: PropTypes.func.isRequired,
  sortMode: PropTypes.string.isRequired,
  onSortModeChange: PropTypes.func.isRequired
}

export default NotesList
