import { v4 as generateSecureUUID } from 'uuid'
import JSZip from 'jszip'
import {
  generateBrainDumpFilename,
  extractTitleFromFilename,
  sanitizeFilename
} from '../fileHelpers'
import { createLogger } from '../logger'

const logger = createLogger('NoteOperations')
const ODT_MIME_TYPE = 'application/vnd.oasis.opendocument.text'

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function markdownToOdtElements(markdown) {
  if (!markdown) return '<text:p></text:p>'

  const lines = markdown.split('\n')
  const elements = []
  let inCodeBlock = false
  let inList = false

  const closeListIfOpen = () => {
    if (inList) {
      elements.push('</text:list>')
      inList = false
    }
  }

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      closeListIfOpen()
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      elements.push(
        `<text:p text:style-name="Preformatted_Text">${escapeXml(line)}</text:p>`
      )
      continue
    }

    if (!line.trim()) {
      closeListIfOpen()
      elements.push('<text:p></text:p>')
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeListIfOpen()
      const level = headingMatch[1].length
      const headingText = escapeXml(headingMatch[2])
      elements.push(
        `<text:h text:outline-level="${level}">${headingText}</text:h>`
      )
      continue
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      if (!inList) {
        elements.push('<text:list>')
        inList = true
      }
      elements.push(
        `<text:list-item><text:p>${escapeXml(listMatch[3])}</text:p></text:list-item>`
      )
      continue
    }

    closeListIfOpen()
    elements.push(`<text:p>${escapeXml(line)}</text:p>`)
  }

  closeListIfOpen()
  return elements.join('')
}

async function createOdtBlob(title, content) {
  const zip = new JSZip()

  zip.file('mimetype', ODT_MIME_TYPE, { compression: 'STORE' })
  zip.file(
    'META-INF/manifest.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:media-type="${ODT_MIME_TYPE}" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>
</manifest:manifest>`
  )
  zip.file(
    'styles.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.2">
  <office:styles>
    <style:style style:name="Preformatted_Text" style:family="paragraph">
      <style:text-properties style:font-name="Courier New"/>
    </style:style>
  </office:styles>
</office:document-styles>`
  )
  zip.file(
    'content.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.2">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${escapeXml(title || 'Untitled Note')}</text:h>
      ${markdownToOdtElements(content)}
    </office:text>
  </office:body>
</office:document-content>`
  )

  return zip.generateAsync({ type: 'blob', mimeType: ODT_MIME_TYPE })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function generateOdtFilename(title) {
  return generateBrainDumpFilename(title).replace(/\.md$/i, '.odt')
}

/**
 * Create a new note object
 * @returns {Object} - New note object with default properties
 */
export function createNewNote() {
  return {
    id: generateSecureUUID(),
    title: 'Untitled Note',
    content: '',
    category: '',
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Create a note from imported markdown content
 * @param {string} filename - Original filename
 * @param {string} content - File content
 * @returns {Object} - New note object
 */
export function createNoteFromImport(filename, content) {
  const noteTitle = extractTitleFromFilename(filename)
  return {
    id: generateSecureUUID(),
    title: noteTitle,
    content,
    category: '',
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Toggle lock status of a note
 * @param {Array} notes - Array of notes
 * @param {string} noteId - ID of note to toggle
 * @returns {Array} - Updated notes array
 */
export function toggleNoteLock(notes, noteId) {
  return notes.map((note) =>
    note.id === noteId ? { ...note, locked: !note.locked } : note
  )
}

/**
 * Update note content
 * @param {Array} notes - Array of notes
 * @param {string} noteId - ID of note to update
 * @param {Object} updates - Object with title, content, category
 * @returns {Array} - Updated notes array
 */
export function updateNote(notes, noteId, updates) {
  return notes.map((note) =>
    note.id === noteId
      ? { ...note, ...updates, updatedAt: new Date().toISOString() }
      : note
  )
}

/**
 * Delete a note from array
 * @param {Array} notes - Array of notes
 * @param {string} noteId - ID of note to delete
 * @returns {Array} - Updated notes array
 */
export function deleteNote(notes, noteId) {
  return notes.filter((n) => n.id !== noteId)
}

/**
 * Migrate notes to add missing fields
 * @param {Array} notes - Array of notes
 * @returns {Object} - { migratedNotes, needsMigration }
 */
export function migrateNotes(notes) {
  const needsMigration = notes.some(
    (note) => note.category === undefined || note.locked === undefined
  )
  const migratedNotes = notes.map((note) => ({
    ...note,
    category: note.category ?? '',
    locked: note.locked ?? false
  }))
  return { migratedNotes, needsMigration }
}

/**
 * Export note to markdown file
 * Security: Uses Blob API and programmatic download to export user content safely
 * @param {string} title - Note title
 * @param {string} content - Note content
 */
export function exportNoteToFile(title, content) {
  if (!content) return

  // Create blob from user content (plain text markdown)
  const blob = new Blob([content], { type: 'text/markdown' })
  downloadBlob(blob, generateBrainDumpFilename(title))
}

/**
 * Export a single note to ODT format
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @returns {Promise<void>}
 */
export async function exportNoteToOdtFile(title, content) {
  const blob = await createOdtBlob(title, content)
  downloadBlob(blob, generateOdtFilename(title))
}

/**
 * Export all notes as individual ODT files
 * @param {Array} notes - Notes to export
 * @returns {Promise<void>}
 */
export async function exportAllNotesToOdtFiles(notes) {
  for (const note of notes) {
    const blob = await createOdtBlob(note.title, note.content)
    downloadBlob(blob, generateOdtFilename(note.title))
  }
}

/**
 * Export all notes as a ZIP archive containing ODT files
 * @param {Array} notes - Notes to export
 * @returns {Promise<void>}
 */
export async function exportAllNotesToOdtZip(notes) {
  const zip = new JSZip()

  for (const note of notes) {
    const odtBlob = await createOdtBlob(note.title, note.content)
    zip.file(
      `${sanitizeFilename(note.title || 'untitled')}.odt`,
      odtBlob,
      { binary: true }
    )
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, `braindump_odt_export_${new Date().toISOString().slice(0, 10)}.zip`)
}

/**
 * Save notes to localStorage
 * @param {Array} notes - Array of notes to save
 */
export function saveNotesToStorage(notes) {
  localStorage.setItem('brainDumpEntries', JSON.stringify(notes))
}

/**
 * Load notes from localStorage
 * Security: Uses try-catch to handle JSON.parse safely, returns empty array on error
 * @returns {Array} - Array of notes
 */
export function loadNotesFromStorage() {
  try {
    const entriesData = localStorage.getItem('brainDumpEntries')
    // JSON.parse with error handling to prevent injection attacks
    return entriesData ? JSON.parse(entriesData) : []
  } catch (e) {
    logger.warn('Failed to parse brainDumpEntries:', e)
    return []
  }
}
