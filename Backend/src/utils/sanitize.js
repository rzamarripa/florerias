/**
 * Utility functions for input sanitization to prevent NoSQL injection and ReDoS attacks
 */

/**
 * Escapes special regex characters from user input to prevent ReDoS attacks
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string safe for use in MongoDB $regex
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  // Escape special regex characters: . * + ? ^ $ { } [ ] \ | ( )
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Creates a safe regex filter for MongoDB queries
 * @param {string} value - The value to search for
 * @param {boolean} caseInsensitive - Whether to make the search case insensitive (default: true)
 * @returns {object|null} - MongoDB regex filter object or null if value is empty
 */
export const createSafeRegexFilter = (value, caseInsensitive = true) => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const escapedValue = escapeRegex(value.trim());

  return {
    $regex: escapedValue,
    $options: caseInsensitive ? 'i' : ''
  };
};

/**
 * Sanitizes an object by removing potentially dangerous MongoDB operators
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeMongoQuery = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const dangerousOperators = ['$where', '$function', '$accumulator', '$expr'];
  const sanitized = {};

  for (const key in obj) {
    if (dangerousOperators.includes(key)) {
      continue; // Skip dangerous operators
    }

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeMongoQuery(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
};

/**
 * Validates and sanitizes pagination parameters
 * @param {object} params - Object containing page and limit
 * @returns {object} - Sanitized pagination object
 */
export const sanitizePagination = (params) => {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
