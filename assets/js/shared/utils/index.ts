// Utility functions

/**
 * Generate UUID v4 with fallback for cross-environment support
 */
export const generateId = (): string => {
  // Try native crypto.randomUUID() first
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  // Try crypto.getRandomValues() fallback
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.getRandomValues === 'function'
  ) {
    return uuidV4Fallback();
  }

  // Final fallback for test environments or older browsers
  return pseudoUUID();
};

/**
 * UUID v4 implementation using crypto.getRandomValues()
 */
function uuidV4Fallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const array = new Uint8Array(1);
    window.crypto.getRandomValues(array);
    const r = array[0] % 16;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Pseudo-UUID for environments without crypto API
 */
function pseudoUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const debounce = <T extends (..._args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((..._args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (..._args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((..._args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};
