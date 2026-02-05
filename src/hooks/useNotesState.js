import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  createNewNote,
  migrateNotes,
  updateNote,
  saveNotesToStorage,
  loadNotesFromStorage
} from '../utils/notes/noteOperations'
import { filterNotes as filterNotesUtil } from '../utils/notes/noteFilters'

/**
 * Custom hook for managing Notes state
 * Handles loading, saving, filtering, and CRUD operations
 */
export function useNotesState() {
  // Initialize notes from storage with lazy initialization
  const [notes, setNotes] = useState(() => {
    let loadedNotes = loadNotesFromStorage()

    // Migration: if no entries exist, migrate old single-note content
    if (loadedNotes.length === 0) {
      const oldContent = localStorage.getItem('brainDumpContent')
      if (oldContent && oldContent.trim()) {
        const migratedNote = {
          ...createNewNote(),
          title: 'Migrated Note',
          content: oldContent
        }
        loadedNotes = [migratedNote]
        saveNotesToStorage(loadedNotes)
      }
    }

    // Migrate existing notes to add missing fields
    const { migratedNotes, needsMigration } = migrateNotes(loadedNotes)

    if (needsMigration && migratedNotes.length > 0) {
      saveNotesToStorage(migratedNotes)
    }

    return migratedNotes
  })

  const [currentNoteId, setCurrentNoteId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOptions, setFilterOptions] = useState({
    category: '',
    dateFilter: 'all',
    customStart: '',
    customEnd: ''
  })

  // Track the previous noteId to detect note switches
  // This helps prevent auto-save from triggering during programmatic note loads
  const prevNoteIdRef = useRef(null)
  const skipNextSaveRef = useRef(false)
  const autosaveTimeoutRef = useRef(null)

  // Load a note
  const loadNote = useCallback((note) => {
    skipNextSaveRef.current = true // Skip autosave on next render
    setCurrentNoteId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setCategory(note.category || '')
  }, [])

  // Load first note on mount if available
  useEffect(() => {
    if (notes.length > 0 && !currentNoteId) {
      loadNote(notes[0])
    }
    // We depend on the first note's ID (not the full notes array) to detect meaningful changes.
    // This avoids re-loading when only note content changes, but captures note reordering/replacement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes[0]?.id, currentNoteId])

  // Memoize current note to avoid redundant array searches
  const currentNote = useMemo(
    () => notes.find((n) => n.id === currentNoteId),
    [notes, currentNoteId]
  )

  // Filter notes based on search query and filter options
  const filteredNotes = useMemo(
    () => filterNotesUtil(notes, searchQuery, filterOptions),
    [notes, searchQuery, filterOptions]
  )

  // Autosave current note
  useEffect(() => {
    if (!currentNoteId) return

    // Don't save if note doesn't exist yet (e.g., during delete operations)
    if (!currentNote) return

    // Don't save if note is locked
    if (currentNote.locked) return

    // Skip autosave immediately after loadNote is called
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      prevNoteIdRef.current = currentNoteId
      return
    }

    // Also skip if noteId changed (double safety check)
    if (prevNoteIdRef.current !== currentNoteId) {
      prevNoteIdRef.current = currentNoteId
      return
    }

    const saveTimeout = setTimeout(() => {
      // Use functional update to get latest notes state
      setNotes((latestNotes) => {
        // Double-check that the note still exists before saving
        // (it might have been deleted while the timeout was pending)
        const noteStillExists = latestNotes.find((n) => n.id === currentNoteId)
        if (!noteStillExists) {
          return latestNotes // Don't update if note was deleted
        }

        const updatedNotes = updateNote(latestNotes, currentNoteId, {
          title,
          content,
          category
        })
        saveNotesToStorage(updatedNotes)
        return updatedNotes
      })
    }, 500) // Debounce autosave

    // Store timeout ID so it can be cleared externally (e.g., during delete)
    autosaveTimeoutRef.current = saveTimeout

    return () => {
      clearTimeout(saveTimeout)
      autosaveTimeoutRef.current = null
    }
  }, [currentNoteId, title, content, category, currentNote])

  // Create new note
  const createNote = () => {
    const newNote = createNewNote()
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    saveNotesToStorage(updatedNotes)
    loadNote(newNote)
    return newNote
  }

  // Update notes state and save to storage
  const updateNotes = (updatedNotes) => {
    setNotes(updatedNotes)
    saveNotesToStorage(updatedNotes)
  }

  // Clear pending autosave timeout (useful when deleting notes)
  const clearAutosaveTimeout = () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
      autosaveTimeoutRef.current = null
    }
  }

  return {
    // State
    notes,
    currentNoteId,
    currentNote,
    title,
    content,
    category,
    searchQuery,
    filterOptions,
    filteredNotes,
    // Setters
    setNotes,
    setTitle,
    setContent,
    setCategory,
    setSearchQuery,
    setFilterOptions,
    // Actions
    loadNote,
    createNote,
    updateNotes,
    clearAutosaveTimeout
  }
}
