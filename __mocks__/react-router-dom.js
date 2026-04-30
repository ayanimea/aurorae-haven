// Root-level manual mock for react-router-dom (used by vi.mock('react-router-dom')).
// Vitest resolves node_modules manual mocks from the directory adjacent to
// node_modules (the project root), so this file is necessary for the shared mock
// in src/__mocks__/ to be picked up automatically.
// NOTE: this file intentionally re-exports from src/__mocks__/ as the single
// source of truth. If the src directory is ever restructured, update this path.
export * from '../src/__mocks__/react-router-dom.js'
