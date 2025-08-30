// Flow Builder services for business logic

export const localStorageService = {
  save: <T>(key: string, data: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Failed to save to localStorage - storage might be full or disabled
    }
  },

  load: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      // Failed to load from localStorage
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Failed to remove from localStorage
    }
  },
};

export const templateService = {
  // Template business logic will be moved here
};
