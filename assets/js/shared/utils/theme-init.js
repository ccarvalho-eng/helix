// Synchronous theme initialization to prevent flash
// This script runs before React and applies the theme immediately

(function () {
  const THEME_STORAGE_KEY = 'helix-flow-builder-theme';

  function getInitialTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && (stored === 'light' || stored === 'dark')) {
        return stored;
      }

      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }

      return 'light';
    } catch {
      return 'dark'; // Default to dark if anything fails
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Apply theme immediately
  const theme = getInitialTheme();
  applyTheme(theme);

  localStorage.setItem(THEME_STORAGE_KEY, theme);
})();
