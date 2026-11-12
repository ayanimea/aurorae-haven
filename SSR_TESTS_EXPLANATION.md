# Browser-independent tests

Aurorae Haven is a client-side React app. A small set of tests checks that utility code can run when browser APIs are unavailable; this does not mean the app is server-side rendered.

## How the tests work

- The project uses **Vitest**. Its standard test environment is jsdom.
- Tests that need a Node-only environment use `@vitest-environment node`.
- Those tests mock browser-dependent modules when needed, then check safe behavior without `window`, `document`, or storage APIs.

## Test files

- `src/__tests__/useIsMobile.ssr.test.js`
- `src/__tests__/autoSaveFS.ssr.test.js`
- `src/__tests__/errorHandler.ssr.test.js`

## Run the tests

```bash
# Run the Node-environment tests
npm test -- src/__tests__/*.ssr.test.js

# Run the complete test suite
npm test
```

Test totals change as the project evolves. Use the test command output for the current count.
