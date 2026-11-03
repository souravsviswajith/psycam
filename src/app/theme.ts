export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'career107.theme';

/**
 * Retrieves initial theme preference:
 * 1. Checks localStorage for an explicit user preference ('light' | 'dark').
 * 2. Falls back to system prefers-color-scheme if available.
 * 3. Defaults to 'light'.
 */
export function getStoredTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
  } catch {
    // localStorage access denied or unavailable
  }
  return 'light';
}

/**
 * Persists user theme preference to localStorage and updates DOM attributes.
 */
export function persistTheme(theme: Theme): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // localStorage unavailable
  }

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('is-dark');
    } else {
      document.documentElement.classList.remove('is-dark');
    }
  }
}
