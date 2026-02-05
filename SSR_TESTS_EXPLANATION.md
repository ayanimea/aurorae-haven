# SSR Tests Explanation

## What is SSR?

**SSR (Server-Side Rendering)** is a technique where JavaScript code runs on a server (like Node.js) instead of in a browser, generating HTML that is sent to the client.

## Why Test for SSR?

When code runs on the server during SSR, certain browser-specific globals don't exist:

- `window` is undefined
- `document` is undefined
- `localStorage` / `sessionStorage` don't exist
- Browser APIs like `navigator`, `location`, etc. are unavailable

## What Are SSR Tests?

**SSR tests** verify that your code handles these missing browser APIs gracefully, ensuring the application:

1. **Doesn't crash** when browser globals are undefined
2. **Provides fallback behavior** (e.g., returning default values)
3. **Can render** initial HTML on the server without errors

## Implementation in This Project

### Original Approach (Skipped Tests)

Initially, 15 SSR tests were skipped because jsdom v28 made `window` and `document` read-only properties that couldn't be mocked as undefined.

### Current Solution (Working SSR Tests)

We now use **Jest's Node.js test environment** for SSR-specific tests:

```javascript
/**
 * @jest-environment node
 */
```

This directive tells Jest to run these tests in a pure Node.js environment without jsdom, allowing us to test actual SSR behavior.

### SSR Test Files

Three dedicated SSR test files were created:

1. **`useIsMobile.ssr.test.js`** - Tests the mobile detection hook in SSR
2. **`autoSaveFS.ssr.test.js`** - Tests File System API support detection in SSR
3. **`errorHandler.ssr.test.js`** - Tests error handling without browser globals

### Test Coverage

**11 SSR tests** verify:

- ✅ Functions return safe defaults when `window` is undefined
- ✅ Code doesn't crash in SSR environment
- ✅ Custom callbacks work in SSR
- ✅ Error handling respects all options in SSR
- ✅ Toast notifications are safely ignored in SSR

## Example: useIsMobile Hook

### Code with SSR Safety

```javascript
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe: check if window exists before using it
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768
  })
  // ... rest of the hook
}
```

### SSR Test

```javascript
/**
 * @jest-environment node
 */

test('returns false when window is undefined (SSR environment)', () => {
  const { useIsMobile } = require('../hooks/useIsMobile')

  // Mock React hooks
  const React = require('react')
  jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
    const value =
      typeof initialValue === 'function' ? initialValue() : initialValue
    return [value, jest.fn()]
  })
  jest.spyOn(React, 'useEffect').mockImplementation(() => {})

  // Call the hook - should return false in SSR
  const result = useIsMobile()

  expect(result).toBe(false)
  expect(typeof window).toBe('undefined')
})
```

## Benefits of This Approach

1. **No Framework Dependency** - No need for Next.js, Remix, or other SSR frameworks
2. **True SSR Testing** - Tests run in actual Node.js environment
3. **Parallel Testing** - SSR tests run alongside browser tests
4. **Regression Prevention** - Catches SSR issues during development
5. **Minimal Changes** - No changes to production code required

## Test Suite Summary

- **Total Test Suites**: 67 (64 jsdom + 3 Node.js)
- **Total Tests**: 1513 passing
- **SSR Tests**: 11 tests across 3 files
- **Skipped Tests**: 15 (unrelated to SSR)

## Running SSR Tests

```bash
# Run only SSR tests
npm test -- src/__tests__/*.ssr.test.js

# Run all tests (includes SSR tests)
npm test
```

## Key Takeaways

- ✅ **SSR tests verify code works without browser globals**
- ✅ **Tests run in pure Node.js environment (no jsdom)**
- ✅ **All code remains SSR-safe** with defensive checks
- ✅ **11 SSR tests** prevent regressions
- ✅ **No production code changes** needed

## Related Concepts

- **Hydration**: Converting server-rendered HTML to interactive React app
- **Universal/Isomorphic Code**: Code that runs both server and client
- **Progressive Enhancement**: Start with server HTML, enhance with JS
