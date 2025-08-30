// Flow Builder services for business logic

export const localStorageService = {
  save: <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
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
    localStorage.removeItem(key);
  },
};

export const templateService = {
  // Template business logic will be moved here
};
