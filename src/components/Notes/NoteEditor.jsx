import { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../common/Icon'
import { handleEnterKey } from '../../utils/listContinuation'
import { getUniqueCategories } from '../../utils/notes/noteFilters'

// Editor pane width constraints (percentage of container)
const MIN_EDITOR_WIDTH_PERCENT = 20
const MAX_EDITOR_WIDTH_PERCENT = 80
const DEFAULT_EDITOR_WIDTH_PERCENT = 50
const EDITOR_WIDTH_STEP_PERCENT = 5

/**
 * Component for editing a note's title, category, and markdown content
 */
function NoteEditor({
  currentNote,
  currentNoteId,
  title,
  category,
  content,
  preview,
  notes,
  showNoteList,
  onTitleChange,
  onCategoryChange,
  onContentChange,
  onToggleNoteList,
  onNewNote,
  onImport,
  onExport,
  onExportOdt,
  onExportAllOdt,
  onExportAllOdtZip,
  onPrint,
  isPrintSupported,
  onDelete,
  onLockToggle,
  onShowDetails
}) {
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const splitContainerRef = useRef(null)
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH_PERCENT)
  const [isResizing, setIsResizing] = useState(false)

  // Sync scroll between editor and preview
  useEffect(() => {
    const editor = editorRef.current
    const preview = previewRef.current

    if (!editor || !preview) return

    const handleScroll = () => {
      const scrollPercentage = editor.scrollTop / editor.scrollHeight
      preview.scrollTop = scrollPercentage * preview.scrollHeight
    }

    editor.addEventListener('scroll', handleScroll)
    return () => editor.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle resize functionality
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const container = splitContainerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Constrain width between min and max percentages
      const constrainedWidth = Math.min(
        Math.max(newWidth, MIN_EDITOR_WIDTH_PERCENT),
        MAX_EDITOR_WIDTH_PERCENT
      )
      setEditorWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  return (
    <>
      <div className='card-h'>
        <div className='title-input-wrapper'>
          {!showNoteList && (
            <button type="button"
              className='btn btn-icon toggle-notes-btn'
              onClick={onToggleNoteList}
              aria-label='Show notes list'
              title='Show notes list'
            >
              <svg
                className='icon'
                viewBox='0 0 24 24'
                role='img'
                aria-hidden='true'
              >
                <line x1='3' y1='12' x2='21' y2='12' />
                <line x1='3' y1='6' x2='21' y2='6' />
                <line x1='3' y1='18' x2='21' y2='18' />
              </svg>
            </button>
          )}
          <input
            type='text'
            className='note-title-input'
            placeholder='Note title...'
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={!currentNoteId || currentNote?.locked}
            aria-label='Note title'
          />
          <input
            type='text'
            className='note-category-input'
            placeholder='Category...'
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={!currentNoteId || currentNote?.locked}
            list='category-suggestions'
            aria-label='Note category'
          />
          <datalist id='category-suggestions'>
            {getUniqueCategories(notes).map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div className='toolbar'>
          <label className='btn' aria-label='Import' title='Import'>
            <Icon name='upload' />
            <input
              type='file'
              accept='.md,.markdown,.txt'
              onChange={onImport}
              style={{ display: 'none' }}
              aria-label='Import markdown file'
            />
          </label>
          <button type='button'
            className='btn'
            onClick={onExport}
            aria-label='Export'
            title='Export'
            disabled={!currentNoteId}
          >
            <Icon name='download' />
          </button>
          <button type='button'
            className='btn'
            onClick={onExportOdt}
            aria-label='Export current note as ODT'
            title='Export current note as OpenDocument Text (.odt) file'
            disabled={!currentNoteId}
          >
            <Icon name='file' />
          </button>
          <button type='button'
            className='btn'
            onClick={onExportAllOdt}
            aria-label='Export all notes as combined ODT'
            title='Export all notes as a single ODT document (one note per page)'
            disabled={notes.length === 0}
          >
            <Icon name='list' />
          </button>
          <button type='button'
            className='btn'
            onClick={onExportAllOdtZip}
            aria-label='Export all ODT as zip'
            title='Export all notes as a ZIP archive containing ODT files'
            disabled={notes.length === 0}
          >
            <Icon name='inbox' />
          </button>
          <button type='button'
            className='btn'
            onClick={onPrint}
            aria-label='Print'
            title='Print'
            disabled={!currentNoteId || !isPrintSupported}
          >
            <Icon name='print' />
          </button>
          <button type='button'
            className='btn btn-delete'
            onClick={() => onDelete()}
            aria-label='Delete'
            title='Delete'
            disabled={!currentNoteId || currentNote?.locked}
          >
            <Icon name='trashAlt' />
          </button>
          <button type='button'
            className='btn'
            onClick={onNewNote}
            aria-label='New note'
            title='New note'
          >
            <Icon name='plus' />
          </button>
          <button type='button'
            className='btn'
            onClick={onLockToggle}
            aria-label={currentNote?.locked ? 'Unlock note' : 'Lock note'}
            title={currentNote?.locked ? 'Unlock note' : 'Lock note'}
            disabled={!currentNoteId}
          >
            <Icon name={currentNote?.locked ? 'lock' : 'unlock'} />
          </button>
          <button type='button'
            className='btn'
            onClick={onShowDetails}
            aria-label='Show note details'
            title='Show note details'
            disabled={!currentNoteId}
          >
            <Icon name='info' />
          </button>
        </div>
      </div>
      <div className='card-b'>
        <div
          className='note-editor-split'
          ref={splitContainerRef}
          style={{
            '--editor-width': `${editorWidth}%`
          }}
        >
          <div className='editor-pane'>
            <textarea
              ref={editorRef}
              className='editor'
              placeholder='Start writing your note in Markdown...'
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  const cursorPos = e.target.selectionStart
                  const result = handleEnterKey(content, cursorPos)

                  if (result) {
                    e.preventDefault()
                    onContentChange(result.newValue)
                    // Set cursor position after state update
                    setTimeout(() => {
                      if (editorRef.current) {
                        editorRef.current.selectionStart = result.newCursorPos
                        editorRef.current.selectionEnd = result.newCursorPos
                      }
                    }, 0)
                  }
                } else if (e.ctrlKey && e.key === 's') {
                  e.preventDefault()
                }
              }}
              disabled={!currentNoteId || currentNote?.locked}
              aria-label='Markdown editor'
            />
          </div>
          <button type="button"
            className='resize-handle'
            onMouseDown={handleResizeStart}
            aria-label='Resize editor and preview'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setEditorWidth(
                  Math.max(
                    MIN_EDITOR_WIDTH_PERCENT,
                    editorWidth - EDITOR_WIDTH_STEP_PERCENT
                  )
                )
              } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                setEditorWidth(
                  Math.min(
                    MAX_EDITOR_WIDTH_PERCENT,
                    editorWidth + EDITOR_WIDTH_STEP_PERCENT
                  )
                )
              }
            }}
          />
          <div className='preview-pane'>
            <div
              ref={previewRef}
              className='preview'
              role='region'
              dangerouslySetInnerHTML={{ __html: preview }}
              aria-label='Markdown preview'
            />
          </div>
        </div>
      </div>
    </>
  )
}

NoteEditor.propTypes = {
  currentNote: PropTypes.object,
  currentNoteId: PropTypes.string,
  title: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  preview: PropTypes.string.isRequired,
  notes: PropTypes.array.isRequired,
  showNoteList: PropTypes.bool.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onContentChange: PropTypes.func.isRequired,
  onToggleNoteList: PropTypes.func.isRequired,
  onNewNote: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onExportOdt: PropTypes.func.isRequired,
  onExportAllOdt: PropTypes.func.isRequired,
  onExportAllOdtZip: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
  isPrintSupported: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onLockToggle: PropTypes.func.isRequired,
  onShowDetails: PropTypes.func.isRequired
}

export default NoteEditor
