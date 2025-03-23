/**
 * Debounce function to limit how often a function fires.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Converts Firestore tag strings (e.g., "Social Commentary") to CSS-safe format ("Social-Commentary").
 * Used for matching tag names to CSS variables.
 * @param {string} tag - Raw tag name from Firestore
 * @returns {string} - Formatted tag for CSS use
 */
export function formatTagForCSS(tag) {
  return tag.replace(/\s+/g, '-');
}

/**
 * Capitalizes the first letter of a string.
 * Optional UI helper.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTagForCSS(tag) {
  return tag.replace(/\s+/g, '-').replace(/\//g, '-');
}
