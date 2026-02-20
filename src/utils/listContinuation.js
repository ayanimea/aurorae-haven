/**
 * List continuation utilities for Brain Dump
 * Handles automatic list item creation similar to GitHub markdown
 */

/**
 * Parse the current line and determine if it's a list item
 * @param {string} line - The current line text
 * @returns {object|null} - Parsed list info or null if not a list
 */
export function parseListItem(line) {
  // Task list: - [ ] or - [x] or * [ ] or * [x]
  const taskListMatch = line.match(/^(\s*)([-*])\s+\[([ x])\]\s*(.*)$/)
  if (taskListMatch) {
    const [, indent, marker, checked, content] = taskListMatch
    return {
      type: 'task',
      indent,
      marker,
      checked,
      content,
      isEmpty: content.trim() === ''
    }
  }

  // Bullet list: - or *
  const bulletListMatch = line.match(/^(\s*)([-*])\s+(.*)$/)
  if (bulletListMatch) {
    const [, indent, marker, content] = bulletListMatch
    return {
      type: 'bullet',
      indent,
      marker,
      content,
      isEmpty: content.trim() === ''
    }
  }

  // Numbered list: 1. 2. 3. etc
  const numberedListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
  if (numberedListMatch) {
    const [, indent, number, content] = numberedListMatch
    return {
      type: 'numbered',
      indent,
      number: parseInt(number, 10),
      content,
      isEmpty: content.trim() === ''
    }
  }

  return null
}

/**
 * Generate the next list item based on the parsed list info
 * @param {object} listInfo - Parsed list information
 * @returns {string} - The new list item text to insert
 */
export function generateNextListItem(listInfo) {
  if (!listInfo) return ''

  switch (listInfo.type) {
    case 'task':
      return `\n${listInfo.indent}${listInfo.marker} [ ] `
    case 'bullet':
      return `\n${listInfo.indent}${listInfo.marker} `
    case 'numbered':
      return `\n${listInfo.indent}${listInfo.number + 1}. `
    default:
      return ''
  }
}

/**
 * Handle Enter key press in the editor
 * @param {string} value - Current editor value
 * @param {number} cursorPos - Current cursor position
 * @returns {object|null} - Action to take: {type: 'continue'|'remove', newValue, newCursorPos}
 */
export function handleEnterKey(value, cursorPos) {
  const textBeforeCursor = value.substring(0, cursorPos)
  const lines = textBeforeCursor.split('\n')
  const currentLine = lines[lines.length - 1]

  const listInfo = parseListItem(currentLine)

  if (!listInfo) {
    return null // Not a list, use default behavior
  }

  if (listInfo.isEmpty) {
    // Empty list item - remove it
    const lineStart = textBeforeCursor.lastIndexOf('\n', cursorPos - 1) + 1
    const newValue = value.substring(0, lineStart) + value.substring(cursorPos)
    return {
      type: 'remove',
      newValue,
      newCursorPos: lineStart
    }
  } else {
    // Continue the list
    const newItem = generateNextListItem(listInfo)
    const newValue =
      value.substring(0, cursorPos) + newItem + value.substring(cursorPos)
    return {
      type: 'continue',
      newValue,
      newCursorPos: cursorPos + newItem.length
    }
  }
}
