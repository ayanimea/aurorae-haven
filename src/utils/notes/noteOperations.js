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
  const listStack = []

  const openList = (ordered) => {
    elements.push(
      `<text:list text:style-name="${ordered ? 'Numbering_20_1' : 'List_20_1'}">`
    )
    listStack.push({ ordered, itemOpen: false })
  }

  const closeOpenItem = () => {
    const current = listStack[listStack.length - 1]
    if (!current?.itemOpen) return
    elements.push('</text:list-item>')
    current.itemOpen = false
  }

  const closeList = () => {
    if (listStack.length === 0) return
    closeOpenItem()
    elements.push('</text:list>')
    listStack.pop()
  }

  const closeAllLists = () => {
    while (listStack.length > 0) {
      closeList()
    }
  }

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      closeAllLists()
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
      closeAllLists()
      elements.push('<text:p></text:p>')
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeAllLists()
      const level = headingMatch[1].length
      const headingText = escapeXml(headingMatch[2])
      elements.push(
        `<text:h text:outline-level="${level}">${headingText}</text:h>`
      )
      continue
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      const indentLevel = Math.floor(listMatch[1].length / 2) + 1
      const ordered = /\d+\./.test(listMatch[2])

      while (listStack.length > indentLevel) {
        closeList()
      }

      if (listStack.length === indentLevel) {
        const current = listStack[listStack.length - 1]
        if (current?.ordered !== ordered) {
          closeList()
        } else {
          closeOpenItem()
        }
      }

      while (listStack.length < indentLevel) {
        if (listStack.length > 0 && !listStack[listStack.length - 1].itemOpen) {
          elements.push('<text:list-item>')
          listStack[listStack.length - 1].itemOpen = true
        }
        openList(ordered)
      }

      elements.push(
        `<text:list-item><text:p>${escapeXml(listMatch[3])}</text:p>`
      )
      listStack[listStack.length - 1].itemOpen = true
      continue
    }

    closeAllLists()
    elements.push(`<text:p>${escapeXml(line)}</text:p>`)
  }

  closeAllLists()
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
  <manifest:file-entry manifest:media-type="" manifest:full-path="META-INF/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="META-INF/manifest.xml"/>
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
    <text:list-style style:name="List_20_1">
      <text:list-level-style-bullet text:level="1" text:bullet-char="•"/>
    </text:list-style>
    <text:list-style style:name="Numbering_20_1">
      <text:list-level-style-number text:level="1" style:num-format="1"/>
    </text:list-style>
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
  a.setAttribute('aria-hidden', 'true')
  a.tabIndex = -1
  a.hidden = true
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => {
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url)
    }
  }, 250)
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
  if (!Array.isArray(notes) || notes.length === 0) return

  if (notes.length === 1) {
    const [note] = notes
    await exportNoteToOdtFile(note.title, note.content)
    return
  }

  await exportAllNotesToOdtZip(notes)
}

/**
 * Export all notes as a ZIP archive containing ODT files
 * @param {Array} notes - Notes to export
 * @returns {Promise<void>}
 */
export async function exportAllNotesToOdtZip(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return

  const zip = new JSZip()
  const usedEntryNames = new Set()

  const getUniqueEntryName = (note, index) => {
    const baseName = sanitizeFilename(note?.title || 'untitled')
    const defaultEntryName = `${baseName}.odt`
    if (!usedEntryNames.has(defaultEntryName)) {
      usedEntryNames.add(defaultEntryName)
      return defaultEntryName
    }

    const suffixCandidates = [note?.id, note?.createdAt, index + 1]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
      .map((value) => sanitizeFilename(String(value)))
      .filter(Boolean)

    for (const suffix of suffixCandidates) {
      const entryName = `${baseName}-${suffix}.odt`
      if (!usedEntryNames.has(entryName)) {
        usedEntryNames.add(entryName)
        return entryName
      }
    }

    let duplicateIndex = 2
    let fallbackEntryName = `${baseName}-${duplicateIndex}.odt`
    while (usedEntryNames.has(fallbackEntryName)) {
      duplicateIndex += 1
      fallbackEntryName = `${baseName}-${duplicateIndex}.odt`
    }
    usedEntryNames.add(fallbackEntryName)
    return fallbackEntryName
  }

  for (const [index, note] of notes.entries()) {
    const entryName = getUniqueEntryName(note, index)
    const odtBlob = await createOdtBlob(note.title, note.content)
    zip.file(
      entryName,
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
