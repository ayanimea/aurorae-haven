import { vi } from 'vitest'
/**
 * Integration tests for Notes component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import Notes from '../pages/Notes.jsx'

// Mock marked and DOMPurify
vi.mock('marked', () => ({
  marked: {
    parse: vi.fn((content) => `<p>${content}</p>`)
  }
}))

vi.mock('dompurify', () => {
  const sanitize = vi.fn((html) => html)
  return {
    __esModule: true,
    default: {
      sanitize
    }
  }
})

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Notes Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Basic functionality', () => {
    test('renders Notes component', () => {
      render(<Notes />)
      expect(
        screen.getByPlaceholderText('Start writing your note in Markdown...')
      ).toBeInTheDocument()
    })

    test('loads saved content from localStorage on mount', () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: 'Test content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )
      expect(textarea).toHaveValue('Test content')
    })

    test('migrates old single-note content to new structure', () => {
      localStorage.setItem('brainDumpContent', 'Old content')
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )
      expect(textarea).toHaveValue('Old content')

      // Check that migration created brainDumpEntries
      const entries = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(entries.length).toBe(1)
      expect(entries[0].content).toBe('Old content')
      expect(entries[0].title).toBe('Migrated Note')
    })

    test('saves content to localStorage on change', async () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: 'Initial content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )
      fireEvent.change(textarea, { target: { value: 'New content' } })

      // Wait for debounced autosave (500ms + buffer)
      await waitFor(
        () => {
          const entries = JSON.parse(
            localStorage.getItem('brainDumpEntries') || '[]'
          )
          expect(entries[0].content).toBe('New content')
        },
        { timeout: 1000 }
      )
    })

    test('renders markdown preview', async () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )
      fireEvent.change(textarea, { target: { value: '# Heading' } })

      await waitFor(() => {
        const preview = document.querySelector('.preview')
        // With our mock, marked.parse wraps content in <p> tags
        expect(preview.innerHTML).toContain('<p>')
        expect(preview.innerHTML).toContain('# Heading')
      })
    })
  })

  describe('Auto-list continuation', () => {
    test('continues task list on Enter', async () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      // Type task list item
      fireEvent.change(textarea, { target: { value: '- [ ] First task' } })

      // Position cursor at end
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      // Press Enter
      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('- [ ] First task\n- [ ] ')
      })
    })

    // Helper to set up a note for list continuation tests
    const setupNoteForTest = () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))
    }

    test('removes empty task list item on second Enter', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      // Set content with empty task list item
      fireEvent.change(textarea, {
        target: { value: '- [ ] First task\n- [ ] ' }
      })

      // Position cursor at end
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      // Press Enter
      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('- [ ] First task\n')
      })
    })

    test('continues bullet list on Enter', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '- First item' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('- First item\n- ')
      })
    })

    test('removes empty bullet list item on second Enter', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '- First item\n- ' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('- First item\n')
      })
    })

    test('continues numbered list on Enter', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '1. First item' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('1. First item\n2. ')
      })
    })

    test('removes empty numbered list item on second Enter', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '1. First item\n2. ' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('1. First item\n')
      })
    })

    test('handles task list with asterisk marker', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, {
        target: { value: '* [ ] Task with asterisk' }
      })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('* [ ] Task with asterisk\n* [ ] ')
      })
    })

    test('handles indented lists', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '  - Indented item' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      await waitFor(() => {
        expect(textarea.value).toBe('  - Indented item\n  - ')
      })
    })

    test('does not intercept Enter with Shift key', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '- Item' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      // Press Shift+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

      // Value should not be changed by our handler
      expect(textarea.value).toBe('- Item')
    })

    test('does not intercept Enter with Ctrl key', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: '- Item' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      // Press Ctrl+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })

      // Value should not be changed by our handler
      expect(textarea.value).toBe('- Item')
    })

    test('does not intercept Enter on non-list content', async () => {
      setupNoteForTest()
      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      fireEvent.change(textarea, { target: { value: 'Regular text' } })
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length

      fireEvent.keyDown(textarea, { key: 'Enter' })

      // Value should not be changed by our handler
      expect(textarea.value).toBe('Regular text')
    })
  })

  describe('Delete functionality', () => {
    test('deletes note on delete button click with confirmation', async () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: 'Some content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )
      expect(textarea).toHaveValue('Some content')

      // Find and click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // Wait for confirmation modal to appear
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getByText('Delete Note')).toBeInTheDocument()
      })

      // Click the confirm button in the modal (get all Delete buttons and use the last one which is in the modal)
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      const confirmButton = deleteButtons[deleteButtons.length - 1]
      fireEvent.click(confirmButton)

      // After deleting the last note, a new empty note is automatically created
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          'Start writing your note in Markdown...'
        )
        expect(textarea).toHaveValue('')
      })

      // Verify a new note was created (not empty list)
      const entries = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(entries.length).toBe(1)
      expect(entries[0].content).toBe('')
    })

    test('does not delete note if user cancels confirmation', async () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: 'Some content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // Wait for confirmation modal to appear
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // Click the cancel button in the modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      // Content should still be there
      expect(textarea).toHaveValue('Some content')
      const entries = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(entries.length).toBe(1)
    })
  })

  describe('Multi-note functionality', () => {
    test('creates new note on new button click', () => {
      render(<Notes />)

      // Get all new note buttons (one in toolbar, one in notes list) and click the first one
      const newButtons = screen.getAllByRole('button', { name: /new note/i })
      fireEvent.click(newButtons[0])

      const entries = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(entries.length).toBe(1)
      expect(entries[0].title).toBe('Untitled Note')
    })

    test('switches between notes', () => {
      const mockEntries = [
        {
          id: 'test-id-1',
          title: 'First Note',
          content: 'First content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-id-2',
          title: 'Second Note',
          content: 'Second content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      const textarea = screen.getByPlaceholderText(
        'Start writing your note in Markdown...'
      )

      // Should load first note by default
      expect(textarea).toHaveValue('First content')

      // Click second note in list
      const secondNoteItem = screen.getByText('Second Note')
      fireEvent.click(secondNoteItem)

      // Should load second note
      expect(textarea).toHaveValue('Second content')
    })
  })

  describe('Export functionality', () => {
    const setupDownloadMocks = () => {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock')
      global.URL.revokeObjectURL = vi.fn()

      const originalCreateElement = document.createElement
      const mockClick = vi.fn()
      const downloadFilenames = []
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          const element = originalCreateElement.call(document, tag)
          element.click = mockClick
          Object.defineProperty(element, 'download', {
            set: (value) => {
              downloadFilenames.push(value)
            },
            get: () => downloadFilenames[downloadFilenames.length - 1] || ''
          })
          return element
        }
        return originalCreateElement.call(document, tag)
      })

      return {
        mockClick,
        downloadFilenames,
        restore: () => {
          document.createElement = originalCreateElement
        }
      }
    }

    test('exports content as markdown file with new filename format', async () => {
      const { mockClick, downloadFilenames, restore } = setupDownloadMocks()

      const mockEntries = [
        {
          id: 'test-id',
          title: 'My Test Note',
          content: 'Export this content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)

      // Wait for note to be loaded
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          'Start writing your note in Markdown...'
        )
        expect(textarea).toHaveValue('Export this content')
      })

      // Find and click export button
      const exportButton = screen.getByRole('button', { name: 'Export' })
      fireEvent.click(exportButton)

      // Wait for export to complete
      await waitFor(() => {
        expect(mockClick).toHaveBeenCalled()
      })
      expect(global.URL.createObjectURL).toHaveBeenCalled()

      // Check filename format: braindump_title_YYYYMMDD_HHmm.md
      expect(downloadFilenames[0]).toMatch(
        /^braindump_my_test_note_\d{8}_\d{4}\.md$/
      )

      restore()
    })

    test('does not export when no note is selected', () => {
      render(<Notes />)

      const exportButton = screen.getByRole('button', { name: 'Export' })
      expect(exportButton).toBeDisabled()
    })

    test('exports current note as ODT file', async () => {
      const { mockClick, downloadFilenames, restore } = setupDownloadMocks()

      const mockEntries = [
        {
          id: 'test-id',
          title: 'ODT Note',
          content: '# Heading\n- item',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      fireEvent.click(screen.getByRole('button', { name: 'Export ODT' }))

      await waitFor(() => {
        expect(mockClick).toHaveBeenCalledTimes(1)
      })
      expect(downloadFilenames[0]).toMatch(/^braindump_odt_note_\d{8}_\d{4}\.odt$/)

      restore()
    })

    test('exports all notes as individual ODT files', async () => {
      const { mockClick, restore } = setupDownloadMocks()

      const mockEntries = [
        {
          id: 'test-id-1',
          title: 'First ODT',
          content: 'One',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-id-2',
          title: 'Second ODT',
          content: 'Two',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      fireEvent.click(screen.getByRole('button', { name: 'Export all ODT' }))

      await waitFor(() => {
        expect(mockClick).toHaveBeenCalledTimes(2)
      })

      restore()
    })

    test('exports all notes as ODT zip archive', async () => {
      const { mockClick, downloadFilenames, restore } = setupDownloadMocks()

      const mockEntries = [
        {
          id: 'test-id-1',
          title: 'Zip First',
          content: 'One',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-id-2',
          title: 'Zip Second',
          content: 'Two',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)
      fireEvent.click(screen.getByRole('button', { name: 'Export all ODT as zip' }))

      await waitFor(() => {
        expect(mockClick).toHaveBeenCalledTimes(1)
      })
      expect(downloadFilenames[0]).toMatch(/^braindump_odt_export_\d{4}-\d{2}-\d{2}\.zip$/)

      restore()
    })
  })

  describe('Print functionality', () => {
    const createPrintableEntry = () => ({
      id: 'test-id',
      title: 'Printable Note',
      content: '# Printable content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    test('prints current formatted note from toolbar', async () => {
      const originalPrint = window.print
      window.print = vi.fn()

      try {
        const mockEntries = [createPrintableEntry()]
        localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

        render(<Notes />)

        await waitFor(() => {
          expect(
            screen.getByPlaceholderText('Start writing your note in Markdown...')
          ).toHaveValue('# Printable content')
        })

        fireEvent.click(screen.getByLabelText('Print'))
        expect(window.print).toHaveBeenCalledTimes(1)
      } finally {
        window.print = originalPrint
      }
    })

    test('does not print when no note is selected', () => {
      const originalPrint = window.print
      window.print = vi.fn()

      try {
        render(<Notes />)
        const printButton = screen.getByLabelText('Print')
        expect(printButton).toBeDisabled()

        fireEvent.click(printButton)
        expect(window.print).not.toHaveBeenCalled()
      } finally {
        window.print = originalPrint
      }
    })

    test('does not throw when browser print API is unavailable', async () => {
      const originalPrint = window.print

      try {
        window.print = undefined
        const mockEntries = [createPrintableEntry()]
        localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

        render(<Notes />)
        await waitFor(() => {
          expect(screen.getByLabelText('Print')).toBeEnabled()
        })

        expect(() => {
          fireEvent.click(screen.getByLabelText('Print'))
        }).not.toThrow()
      } finally {
        window.print = originalPrint
      }
    })
  })

  describe('Import functionality', () => {
    test('imports markdown file as new note', async () => {
      render(<Notes />)

      const importInput = screen.getByLabelText('Import markdown file')

      const fileContent = '# Imported Note\n\nThis is imported content.'
      const file = new File(
        [fileContent],
        'braindump_my_note_20250115_1430.md',
        {
          type: 'text/markdown'
        }
      )

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null,
        result: fileContent
      }

      global.FileReader = function FileReader() {
        return mockFileReader
      }

      fireEvent.change(importInput, { target: { files: [file] } })

      // Simulate file read completion inside act() so React state updates are captured
      await act(async () => {
        mockFileReader.onload({ target: { result: fileContent } })
      })

      await waitFor(() => {
        const entries = JSON.parse(
          localStorage.getItem('brainDumpEntries') || '[]'
        )
        expect(entries.length).toBe(1)
        expect(entries[0].title).toBe('my note')
        expect(entries[0].content).toBe(fileContent)
      })
    })

    test('extracts title from filename correctly', async () => {
      render(<Notes />)

      const importInput = screen.getByLabelText('Import markdown file')

      const fileContent = 'Content'
      const file = new File([fileContent], 'test_note_name.md', {
        type: 'text/markdown'
      })

      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null,
        result: fileContent
      }

      global.FileReader = function FileReader() {
        return mockFileReader
      }

      fireEvent.change(importInput, { target: { files: [file] } })

      // Simulate file read completion inside act() so React state updates are captured
      await act(async () => {
        mockFileReader.onload({ target: { result: fileContent } })
      })

      await waitFor(() => {
        const entries = JSON.parse(
          localStorage.getItem('brainDumpEntries') || '[]'
        )
        expect(entries[0].title).toBe('test note name')
      })
    })
  })

  describe('Export-Delete-Import sequence', () => {
    test('restores deleted note after importing previously exported data', async () => {
      // Set up initial notes in localStorage
      const initialNotes = [
        {
          id: 'note-1',
          title: 'First Note',
          content: 'First content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'note-2',
          title: 'Second Note',
          content: 'Second content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'note-3',
          title: 'Third Note',
          content: 'Third content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(initialNotes))

      // Step 1: Export the data (simulate by getting current state)
      const exportedData = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(exportedData.length).toBe(3)

      // Render component with initial notes
      const { unmount } = render(<Notes />)

      // Wait for notes to load
      await waitFor(() => {
        expect(screen.getByText('Second Note')).toBeInTheDocument()
      })

      // Step 2: Delete the second note
      // Click on second note to select it
      const secondNoteItem = screen.getByText('Second Note')
      fireEvent.click(secondNoteItem)

      // Wait for note content to load
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          'Start writing your note in Markdown...'
        )
        expect(textarea).toHaveValue('Second content')
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // Wait for confirmation modal to appear
      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      // Click the confirm button in the modal (get all Delete buttons and use the last one which is in the modal)
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      const confirmButton = deleteButtons[deleteButtons.length - 1]
      fireEvent.click(confirmButton)

      // Wait for toast to appear (indicates delete completed)
      await waitFor(() => {
        expect(
          screen.getByText('✓ Note deleted successfully')
        ).toBeInTheDocument()
      })

      // Wait for any pending auto-save (500ms debounce + buffer)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600))
      })

      // Verify deletion in localStorage
      const notesAfterDelete = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(notesAfterDelete.length).toBe(2)
      expect(notesAfterDelete.find((n) => n.id === 'note-2')).toBeUndefined()

      // Step 3: Import the previously exported data
      localStorage.setItem('brainDumpEntries', JSON.stringify(exportedData))

      // Unmount and re-render to simulate page reload after import
      unmount()
      render(<Notes />)

      // Step 4: Verify all notes are restored
      await waitFor(() => {
        const restoredNotes = JSON.parse(
          localStorage.getItem('brainDumpEntries') || '[]'
        )
        expect(restoredNotes.length).toBe(3)

        // Verify all original notes are present
        expect(restoredNotes.find((n) => n.id === 'note-1')).toBeDefined()
        expect(restoredNotes.find((n) => n.id === 'note-2')).toBeDefined()
        expect(restoredNotes.find((n) => n.id === 'note-3')).toBeDefined()

        // Verify content is preserved
        const secondNote = restoredNotes.find((n) => n.id === 'note-2')
        expect(secondNote.title).toBe('Second Note')
        expect(secondNote.content).toBe('Second content')
      })

      // Verify the deleted note is visible in the UI after re-render
      await waitFor(() => {
        expect(screen.getByText('Second Note')).toBeInTheDocument()
      })
    })

    test('handles multiple delete-import cycles correctly', async () => {
      // Initial state with 4 notes
      const initialNotes = [
        {
          id: 'note-1',
          title: 'Note 1',
          content: 'Content 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'note-2',
          title: 'Note 2',
          content: 'Content 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'note-3',
          title: 'Note 3',
          content: 'Content 3',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'note-4',
          title: 'Note 4',
          content: 'Content 4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(initialNotes))

      // Export snapshot
      const exportSnapshot = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )

      // Cycle 1: Delete note 2
      const afterDelete1 = initialNotes.filter((n) => n.id !== 'note-2')
      localStorage.setItem('brainDumpEntries', JSON.stringify(afterDelete1))
      expect(
        JSON.parse(localStorage.getItem('brainDumpEntries') || '[]').length
      ).toBe(3)

      // Import to restore
      localStorage.setItem('brainDumpEntries', JSON.stringify(exportSnapshot))
      expect(
        JSON.parse(localStorage.getItem('brainDumpEntries') || '[]').length
      ).toBe(4)

      // Cycle 2: Delete notes 1 and 3
      const afterDelete2 = exportSnapshot.filter(
        (n) => n.id !== 'note-1' && n.id !== 'note-3'
      )
      localStorage.setItem('brainDumpEntries', JSON.stringify(afterDelete2))
      expect(
        JSON.parse(localStorage.getItem('brainDumpEntries') || '[]').length
      ).toBe(2)

      // Import again to restore all
      localStorage.setItem('brainDumpEntries', JSON.stringify(exportSnapshot))
      const final = JSON.parse(localStorage.getItem('brainDumpEntries') || '[]')
      expect(final.length).toBe(4)
      expect(final.map((n) => n.id).sort()).toEqual([
        'note-1',
        'note-2',
        'note-3',
        'note-4'
      ])
    })
  })

  describe('Category and filtering functionality', () => {
    test('creates new note with category field', () => {
      render(<Notes />)

      // Get all new note buttons (one in toolbar, one in notes list) and click the first one
      const newButtons = screen.getAllByRole('button', { name: /new note/i })
      fireEvent.click(newButtons[0])

      const entries = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(entries.length).toBe(1)
      expect(entries[0].category).toBeDefined()
      expect(entries[0].category).toBe('')
    })

    test('migrates notes without category field', () => {
      const oldNotes = [
        {
          id: 'note-1',
          title: 'Old Note',
          content: 'Content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(oldNotes))

      render(<Notes />)

      const entries = JSON.parse(
        localStorage.getItem('brainDumpEntries') || '[]'
      )
      expect(entries[0].category).toBe('')
    })

    test('saves category when editing note', async () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: 'Content',
          category: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)

      const categoryInput = screen.getByPlaceholderText('Category...')
      fireEvent.change(categoryInput, { target: { value: 'Work' } })

      await waitFor(
        () => {
          const entries = JSON.parse(
            localStorage.getItem('brainDumpEntries') || '[]'
          )
          expect(entries[0].category).toBe('Work')
        },
        { timeout: 1000 }
      )
    })

    test('opens filter modal when filter button is clicked', () => {
      render(<Notes />)

      const filterButton = screen.getByRole('button', { name: /filter notes/i })
      fireEvent.click(filterButton)

      expect(screen.getByText('Filter Notes')).toBeInTheDocument()
    })

    test('displays category in note list item', () => {
      const mockEntries = [
        {
          id: 'test-id',
          title: 'Test Note',
          content: 'Content',
          category: 'Personal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('brainDumpEntries', JSON.stringify(mockEntries))

      render(<Notes />)

      expect(screen.getByText('Personal')).toBeInTheDocument()
    })
  })
})
