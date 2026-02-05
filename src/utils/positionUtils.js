/**
 * Utility functions for positioning context menus within viewport bounds
 */

/**
 * Adjusts context menu position to stay within viewport boundaries
 * @param {number} x - Desired X position (must be a valid number)
 * @param {number} y - Desired Y position (must be a valid number)
 * @param {number} menuWidth - Width of the menu (must be a valid positive number)
 * @param {number} menuHeight - Height of the menu (must be a valid positive number)
 * @returns {{x: number, y: number}} Adjusted position
 * @throws {TypeError} If any parameter is not a valid number
 */
export const adjustMenuPosition = (x, y, menuWidth, menuHeight) => {
  // Validate input parameters
  if (typeof x !== 'number' || !Number.isFinite(x)) {
    throw new TypeError(
      `adjustMenuPosition: x must be a finite number, got ${typeof x} (${x})`
    )
  }
  if (typeof y !== 'number' || !Number.isFinite(y)) {
    throw new TypeError(
      `adjustMenuPosition: y must be a finite number, got ${typeof y} (${y})`
    )
  }
  if (
    typeof menuWidth !== 'number' ||
    !Number.isFinite(menuWidth) ||
    menuWidth < 0
  ) {
    throw new TypeError(
      `adjustMenuPosition: menuWidth must be a finite non-negative number, got ${typeof menuWidth} (${menuWidth})`
    )
  }
  if (
    typeof menuHeight !== 'number' ||
    !Number.isFinite(menuHeight) ||
    menuHeight < 0
  ) {
    throw new TypeError(
      `adjustMenuPosition: menuHeight must be a finite non-negative number, got ${typeof menuHeight} (${menuHeight})`
    )
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const padding = 10 // Padding from viewport edge

  // Handle oversized menus: if menu is larger than viewport, constrain to viewport dimensions
  const maxWidth = viewportWidth - 2 * padding
  const maxHeight = viewportHeight - 2 * padding
  const constrainedWidth = Math.min(menuWidth, maxWidth)
  const constrainedHeight = Math.min(menuHeight, maxHeight)

  let adjustedX = x
  let adjustedY = y

  // Adjust horizontal position if menu would overflow right edge
  if (x + constrainedWidth + padding > viewportWidth) {
    adjustedX = viewportWidth - constrainedWidth - padding
  }

  // Adjust vertical position if menu would overflow bottom edge
  if (y + constrainedHeight + padding > viewportHeight) {
    adjustedY = viewportHeight - constrainedHeight - padding
  }

  // Ensure menu doesn't go off left edge
  if (adjustedX < padding) {
    adjustedX = padding
  }

  // Ensure menu doesn't go off top edge
  if (adjustedY < padding) {
    adjustedY = padding
  }

  return { x: adjustedX, y: adjustedY }
}
