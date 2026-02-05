/**
 * Utility functions for positioning context menus within viewport bounds
 */

/**
 * Adjusts context menu position to stay within viewport boundaries
 * @param {number} x - Desired X position
 * @param {number} y - Desired Y position
 * @param {number} menuWidth - Width of the menu
 * @param {number} menuHeight - Height of the menu
 * @returns {{x: number, y: number}} Adjusted position
 */
export const adjustMenuPosition = (x, y, menuWidth, menuHeight) => {
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
