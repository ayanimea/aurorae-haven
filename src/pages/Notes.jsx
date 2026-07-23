import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'
import { configureSanitization } from '../utils/sanitization'
import { preprocessLatex } from '../utils/latexPreprocessor'
import { injectTocHtml, slugify } from '../utils/notes/tocGenerator'
import {
  createNewNote,
  createNoteFromImport,
  toggleNoteLock,
  deleteNote as deleteNoteUtil,
  exportNoteToFile,
  exportNoteToOdtFile,
  exportAllNotesToMarkdownZip,
  exportAllNotesToCombinedOdt,
  exportAllNotesToOdtZip
} from '../utils/notes/noteOperations'
import NoteDetailsModal from '../components/Notes/NoteDetailsModal'
import HelpModal from '../components/Notes/HelpModal'
import NewNoteModal from '../components/Notes/NewNoteModal'
import NotesList from '../components/Notes/NotesList'
import NoteEditor from '../components/Notes/NoteEditor'
import FilterModal from '../components/Notes/FilterModal'
import ContextMenu from '../components/Notes/ContextMenu'
import ConfirmModal from '../components/common/ConfirmModal'
import { useNotesState } from '../hooks/useNotesState'
import { useToast } from '../hooks/useToast'
import { createLogger } from '../utils/logger'
import { getNoteTemplateById } from '../data/noteTemplates'

const logger = createLogger('Notes')

// Configure marked once at module level to avoid reconfiguration on re-renders
// Error handling for KaTeX extension to gracefully handle load failures
// Note: displayMode is auto-detected by markedKatex: $...$ for inline, $$...$$ for display
try {
  marked.use(
    markedKatex({
      throwOnError: false
    })
  )
} catch (error) {
  logger.warn(
    'KaTeX extension failed to load. LaTeX rendering will be disabled.',
    error
  )
  // Marked will continue to work without KaTeX, falling back to plain markdown
}

// Common marked configuration options
const markedOptions = {
  breaks: true,
  gfm: true
}

// Configure marked options at module level, handling both old and new API
try {
  if (typeof marked.setOptions === 'function') {
    marked.setOptions(markedOptions)
  } else if (typeof marked.use === 'function') {
    marked.use(markedOptions)
  }
} catch (error) {
  logger.warn('Failed to configure marked options:', error)
}

// Extract plain text from a marked inline token array without regex-based
// HTML tag stripping (which is incomplete for edge cases like nested angle
// brackets). Recursing over the token tree is safe and complete.
function tokensToPlainText(tokens) {
  if (!Array.isArray(tokens)) return ''
  return tokens
    .map(t => {
      if (t.type === 'html') return ''
      if (t.tokens) return tokensToPlainText(t.tokens)
      return t.text ?? t.raw ?? ''
    })
    .join('')
}

let headingSlugCounts = {}

// Add a custom heading renderer that injects id attributes so that [TOC]
// anchor links (e.g. #introduction) resolve to the correct heading in-page.
// The slug algorithm mirrors tocGenerator.slugify so IDs and href values match.
try {
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const rawText = this.parser.parseInline(tokens)
        // Derive plain text directly from the token tree to get a clean string
        // for slug generation, avoiding incomplete regex-based HTML stripping.
        const plainText = tokensToPlainText(tokens)
        const baseSlug = slugify(plainText)
        const existingCount = headingSlugCounts[baseSlug] ?? 0
        headingSlugCounts[baseSlug] = existingCount + 1
        const id =
          existingCount === 0 ? baseSlug : `${baseSlug}-${existingCount}`
        return `<h${depth} id="${id}">${rawText}</h${depth}>\n`
      }
    }
  })
} catch (error) {
  logger.warn('Failed to configure marked heading renderer:', error)
}

function Notes() {
  const isPrintSupported =
    typeof window !== 'undefined' && typeof window.print === 'function'

  // Use custom hooks for state management
  const {
    notes,
    currentNoteId,
    currentNote,
    title,
    content,
    category,
    searchQuery,
    filterOptions,
    filteredNotes,
    setTitle,
    setContent,
    setCategory,
    setSearchQuery,
    setFilterOptions,
    loadNote,
    createNote,
    updateNotes,
    clearAutosaveTimeout
  } = useNotesState()

  const { toastMessage, showToast, showToastNotification } = useToast()

  // Stable refs so the global keydown listener never needs to be re-registered
  const notesRef = useRef(notes)
  const currentNoteIdRef = useRef(currentNoteId)
  const titleRef = useRef(title)
  const contentRef = useRef(content)
  const categoryRef = useRef(category)
  const showToastRef = useRef(showToastNotification)
  const updateNotesRef = useRef(updateNotes)
  const clearAutosaveTimeoutRef = useRef(clearAutosaveTimeout)
  notesRef.current = notes
  currentNoteIdRef.current = currentNoteId
  titleRef.current = title
  contentRef.current = content
  categoryRef.current = category
  showToastRef.current = showToastNotification
  updateNotesRef.current = updateNotes
  clearAutosaveTimeoutRef.current = clearAutosaveTimeout

  // UI state
  const [preview, setPreview] = useState('')
  const [showNoteList, setShowNoteList] = useState(true)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)

  // Configure sanitization on mount
  useEffect(() => {
    configureSanitization(DOMPurify)
  }, [])

  // Global Ctrl/Cmd+S shortcut: export all notes as markdown (save all)
  // Registered once (empty deps); reads latest notes/toast via refs to avoid churn.
  useEffect(() => {
    let isMounted = true

    const handleGlobalKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey &&
        e.key.toLowerCase() === 's'
      ) {
        e.preventDefault()
        if (e.repeat) return
        const currentNotes = notesRef.current
        if (currentNotes.length > 0) {
          let notesForExport = currentNotes
          const activeNoteId = currentNoteIdRef.current
          const activeNoteIndex = currentNotes.findIndex((note) => note.id === activeNoteId)
          if (activeNoteIndex !== -1) {
            const activeNote = currentNotes[activeNoteIndex]
            const mergedActiveNote = {
              ...activeNote,
              title: titleRef.current,
              content: contentRef.current,
              category: categoryRef.current
            }
            const hasUnsavedActiveNoteChanges =
              mergedActiveNote.title !== activeNote.title ||
              mergedActiveNote.content !== activeNote.content ||
              mergedActiveNote.category !== activeNote.category

            if (hasUnsavedActiveNoteChanges) {
              clearAutosaveTimeoutRef.current()
              notesForExport = [...currentNotes]
              notesForExport[activeNoteIndex] = mergedActiveNote
              updateNotesRef.current(notesForExport)
              notesRef.current = notesForExport
            }
          }

          exportAllNotesToMarkdownZip(notesForExport)
            .then(() => {
              if (!isMounted) return
              showToastRef.current(
               notesForExport.length === 1
                 ? '✓ Note exported'
                 : '✓ All notes exported as ZIP'
              )
            })
            .catch((error) => {
              logger.error('Failed to export notes as markdown', error)
              if (!isMounted) return
              showToastRef.current('⚠️ Export failed.')
            })
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      isMounted = false
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  useEffect(() => {
    const enablePrintLayout = () => {
      document.body.classList.add('layout-notes-print')
    }
    const disablePrintLayout = () => {
      document.body.classList.remove('layout-notes-print')
    }

    window.addEventListener('beforeprint', enablePrintLayout)
    window.addEventListener('afterprint', disablePrintLayout)

    return () => {
      window.removeEventListener('beforeprint', enablePrintLayout)
      window.removeEventListener('afterprint', disablePrintLayout)
      disablePrintLayout()
    }
  }, [])

  // Render preview whenever content changes
  // Security: Content is sanitized with DOMPurify before rendering
  useEffect(() => {
    const renderPreview = () => {
      // Replace [TOC] markers with a rendered HTML table of contents
      const contentWithToc = injectTocHtml(content)
      // Preprocess LaTeX to handle newlines within math blocks
      const preprocessedContent = preprocessLatex(contentWithToc)
      // Use enhanced sanitization configuration to prevent XSS
      const sanitizeConfig = configureSanitization(DOMPurify)
      // Reset per-render to keep heading IDs deterministic for each note parse.
      headingSlugCounts = {}
      // Parse markdown and sanitize HTML to remove any malicious content
      const html = DOMPurify.sanitize(
        marked.parse(preprocessedContent),
        sanitizeConfig
      )
      setPreview(html)
    }
    renderPreview()
  }, [content])

  // Delete note (can be called from context menu or toolbar)
  const handleDelete = (noteId = currentNoteId) => {
    if (!noteId) return

    const note = notes.find((n) => n.id === noteId)

    // Check if note is locked - show toast instead of alert
    if (note?.locked) {
      showToastNotification(
        '🔒 This note is locked. Unlock it before deleting.'
      )
      return
    }

    // Show accessible confirmation modal
    setNoteToDelete(note)
    setShowDeleteConfirm(true)
  }

  // Confirmed delete action
  const handleConfirmDelete = () => {
    if (!noteToDelete) return

    // Clear any pending autosave to prevent it from restoring the deleted note
    clearAutosaveTimeout()

    // Execute delete
    const updatedNotes = deleteNoteUtil(notes, noteToDelete.id)

    // Update storage immediately to prevent autosave from restoring deleted note
    updateNotes(updatedNotes)

    // Load next note or create new empty note if the deleted note was current
    if (noteToDelete.id === currentNoteId) {
      if (updatedNotes.length > 0) {
        updateNotes(updatedNotes)
        loadNote(updatedNotes[0])
      } else {
        // Auto-create new empty note when deleting the last note
        const newNote = createNewNote()
        const notesWithNew = [newNote]

        // Use flushSync to ensure state updates complete synchronously
        // This prevents UI not updating issue when deleting the last note
        flushSync(() => {
          updateNotes(notesWithNew)
        })
        loadNote(newNote)
      }
    } else {
      // Just update notes if deleted note wasn't current
      updateNotes(updatedNotes)
    }

    // Close modal and reset state
    setShowDeleteConfirm(false)
    setNoteToDelete(null)

    // Close context menu if open
    setContextMenu(null)

    // Show success notification
    showToastNotification('✓ Note deleted successfully')
  }

  // Cancel delete action
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setNoteToDelete(null)

    // Close context menu if open
    setContextMenu(null)
  }

  // Toggle lock status of a note
  const handleToggleLock = (noteId = currentNoteId) => {
    const updatedNotes = toggleNoteLock(notes, noteId || currentNoteId)
    updateNotes(updatedNotes)
    setContextMenu(null)
  }

  // Export current note with new filename format
  const handleExport = (noteId) => {
    // If noteId is provided as a string (from context menu), use that note
    // Otherwise (button click passes event or nothing), use current note
    if (noteId && typeof noteId === 'string') {
      const note = notes.find((n) => n.id === noteId)
      if (note) {
        exportNoteToFile(note.title, note.content)
      } else {
        showToastNotification('⚠️ Note not found. Cannot export.')
      }
    } else {
      exportNoteToFile(title, content)
    }
  }

  const handlePrint = () => {
    if (!currentNoteId || !isPrintSupported) {
      return
    }
    document.body.classList.add('layout-notes-print')
    window.print()
  }

  const handleExportOdt = async () => {
    if (!currentNoteId) return
    try {
      await exportNoteToOdtFile(title, content, {
        createdAt: currentNote?.createdAt,
        updatedAt: currentNote?.updatedAt,
      })
      showToastNotification('✓ Note exported as ODT')
    } catch (error) {
      logger.error('Failed to export note as ODT', error)
      showToastNotification('⚠️ ODT export failed.')
    }
  }

  const handleExportAllOdt = async () => {
    if (notes.length === 0) return
    try {
      await exportAllNotesToCombinedOdt(notes)
      showToastNotification(
        notes.length === 1
          ? '✓ Note exported as ODT document'
          : '✓ All notes exported as a combined ODT document'
      )
    } catch (error) {
      logger.error('Failed to export all notes as combined ODT', error)
      showToastNotification('⚠️ ODT export failed.')
    }
  }

  const handleExportAllOdtZip = async () => {
    if (notes.length === 0) return
    try {
      await exportAllNotesToOdtZip(notes)
      showToastNotification('✓ All notes exported as ODT ZIP')
    } catch (error) {
      logger.error('Failed to export all notes as ODT ZIP', error)
      showToastNotification('⚠️ ODT ZIP export failed.')
    }
  }

  // Import note from markdown file
  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const fileContent = event.target?.result
      if (typeof fileContent !== 'string') return

      const importedNote = createNoteFromImport(file.name, fileContent)

      const updatedNotes = [...notes, importedNote]
      updateNotes(updatedNotes)
      loadNote(importedNote)
    }

    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  // Handle right-click on note
  const handleNoteContextMenu = (e, note) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      note
    })
  }

  // Open the new-note template chooser instead of immediately creating
  const handleNewNote = () => {
    setShowNewNoteModal(true)
  }

  // Called when user confirms template selection in the modal
  const handleNewNoteConfirm = (templateId, includeToc) => {
    setShowNewNoteModal(false)
    const template = getNoteTemplateById(templateId)
    let noteContent = template?.content ?? ''

    // Prepend [TOC] marker when requested (only meaningful for non-blank templates)
    if (includeToc && noteContent) {
      noteContent = `[TOC]\n\n${noteContent}`
    }

    const newNote = createNote(noteContent)
    // If the template provides a sensible title derived from a first heading, use it
    if (newNote && template && template.id !== 'blank') {
      setTitle(template.name)
    }
  }

  return (
    <div className='brain-dump-container'>
      {/* Note List Sidebar */}
      <NotesList
        notes={notes}
        filteredNotes={filteredNotes}
        currentNoteId={currentNoteId}
        searchQuery={searchQuery}
        showNoteList={showNoteList}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        onToggleNoteList={() => setShowNoteList(!showNoteList)}
        onFilterClick={() => setShowFilterModal(true)}
        onNoteClick={loadNote}
        onNoteContextMenu={handleNoteContextMenu}
        onNewNote={handleNewNote}
      />

      {/* Main Editor Area */}
      <div className='brain-dump-main'>
        <div className='card'>
          <NoteEditor
            currentNote={currentNote}
            currentNoteId={currentNoteId}
            title={title}
            category={category}
            content={content}
            preview={preview}
            notes={notes}
            showNoteList={showNoteList}
            onTitleChange={setTitle}
            onCategoryChange={setCategory}
            onContentChange={setContent}
            onToggleNoteList={() => setShowNoteList(!showNoteList)}
            onNewNote={handleNewNote}
            onImport={handleImport}
            onExport={handleExport}
            onExportOdt={handleExportOdt}
            onExportAllOdt={handleExportAllOdt}
            onExportAllOdtZip={handleExportAllOdtZip}
            onPrint={handlePrint}
            isPrintSupported={isPrintSupported}
            onDelete={handleDelete}
            onLockToggle={handleToggleLock}
            onShowDetails={() => setShowDetailsModal(true)}
          />
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onExport={handleExport}
        onLockToggle={() => handleToggleLock(contextMenu?.note?.id)}
        onDelete={() => handleDelete(contextMenu?.note?.id)}
        onClose={() => setContextMenu(null)}
      />

      {/* Details Modal */}
      {showDetailsModal && (
        <NoteDetailsModal
          note={currentNote}
          title={title}
          category={category}
          content={content}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          notes={notes}
          filterOptions={filterOptions}
          onFilterChange={setFilterOptions}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className='toast' style={{ display: 'block' }}>
          {toastMessage}
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}

      {/* New Note Template Modal */}
      <NewNoteModal
        isOpen={showNewNoteModal}
        onConfirm={handleNewNoteConfirm}
        onCancel={() => setShowNewNoteModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title='Delete Note'
        message={`Are you sure you want to delete "${noteToDelete?.title || 'this note'}"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive
      />
    </div>
  )
}

export default Notes
