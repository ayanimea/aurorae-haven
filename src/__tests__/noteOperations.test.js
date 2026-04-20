import { afterEach, describe, expect, test, vi } from 'vitest'
import JSZip from 'jszip'
import {
  exportAllNotesToOdtZip,
  exportNoteToOdtFile
} from '../utils/notes/noteOperations'

let originalCreateElement = null
let originalCreateObjectURL = null
let originalRevokeObjectURL = null
let shouldRestoreCreateElement = false
let shouldRestoreCreateObjectURL = false
let shouldRestoreRevokeObjectURL = false

function setupDownloadMocks() {
  const downloadedBlobs = []
  const mockClick = vi.fn()

  originalCreateObjectURL = global.URL.createObjectURL
  originalRevokeObjectURL = global.URL.revokeObjectURL
  shouldRestoreCreateObjectURL = true
  shouldRestoreRevokeObjectURL = true
  global.URL.createObjectURL = vi.fn((blob) => {
    downloadedBlobs.push(blob)
    return `blob:mock-${downloadedBlobs.length}`
  })
  global.URL.revokeObjectURL = vi.fn()

  originalCreateElement = document.createElement
  shouldRestoreCreateElement = true
  document.createElement = vi.fn((tag) => {
    if (tag === 'a') {
      const element = originalCreateElement.call(document, tag)
      element.click = mockClick
      return element
    }
    return originalCreateElement.call(document, tag)
  })

  return { downloadedBlobs, mockClick }
}

afterEach(() => {
  if (shouldRestoreCreateElement) {
    document.createElement = originalCreateElement
    shouldRestoreCreateElement = false
  }
  if (shouldRestoreCreateObjectURL) {
    global.URL.createObjectURL = originalCreateObjectURL
    shouldRestoreCreateObjectURL = false
  }
  if (shouldRestoreRevokeObjectURL) {
    global.URL.revokeObjectURL = originalRevokeObjectURL
    shouldRestoreRevokeObjectURL = false
  }
})

describe('noteOperations ODT export', () => {
  test('includes nested-list structure and complete manifest entries in exported ODT', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportNoteToOdtFile(
      'Nested List Note',
      '- Parent item\n  - Child item\n1. Ordered root\n  1. Ordered child'
    )

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    const manifestXml = await odtZip.file('META-INF/manifest.xml').async('string')

    expect(contentXml).toContain(
      '<text:list-item><text:p>Parent item</text:p><text:list'
    )
    expect(contentXml).toContain(
      '<text:list-item><text:p>Ordered root</text:p><text:list'
    )
    expect(manifestXml).toContain('manifest:full-path="META-INF/"')
    expect(manifestXml).toContain('manifest:full-path="META-INF/manifest.xml"')
  })

  test('returns early for invalid ZIP bulk export input', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportAllNotesToOdtZip()
    await exportAllNotesToOdtZip([])

    expect(mockClick).not.toHaveBeenCalled()
    expect(downloadedBlobs).toHaveLength(0)
  })

  test('removes XML 1.0-invalid control characters from exported ODT content', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportNoteToOdtFile(
      'Invalid\u0001Title',
      'Safe line\u0000\nAnother\u0002 line'
    )

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).not.toContain('\u0000')
    expect(contentXml).not.toContain('\u0001')
    expect(contentXml).not.toContain('\u0002')
    expect(contentXml).toContain('InvalidTitle')
    expect(contentXml).toContain('Safe line')
    expect(contentXml).toContain('Another line')
  })

  test('preserves all notes by generating unique ODT names in bulk ZIP', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportAllNotesToOdtZip([
      {
        id: 'duplicate-a',
        title: 'Shared Title',
        content: 'First',
        createdAt: '2026-04-19T00:00:00.000Z'
      },
      {
        id: 'duplicate-b',
        title: 'Shared Title',
        content: 'Second',
        createdAt: '2026-04-20T00:00:00.000Z'
      }
    ])

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const bulkZip = await JSZip.loadAsync(downloadedBlobs[0])
    const odtEntries = Object.keys(bulkZip.files).filter((name) =>
      name.endsWith('.odt')
    )

    expect(odtEntries).toHaveLength(2)
    expect(new Set(odtEntries).size).toBe(2)
    expect(odtEntries).toContain('shared_title.odt')
    expect(odtEntries.some((name) => name !== 'shared_title.odt')).toBe(true)
  })
})
