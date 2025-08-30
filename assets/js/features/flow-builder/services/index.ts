// Flow Builder services for business logic

export const localStorageService = {
  save: <T>(key: string, data: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  load: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};

export const templateService = {
  // Template business logic will be moved here
};
