// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Shim global jest → vi so all existing test files work without modification
global.jest = vi

// Mock logger to avoid import issues in tests
vi.mock('./utils/logger')

// Polyfill for structuredClone (needed for fake-indexeddb in Node.js < 17)
/* global global:writable */
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
}
