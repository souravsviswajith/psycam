import type { ReactNode } from 'react';
import type { Theme } from './theme.ts';

interface ThemeToggleProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  compact?: boolean;
}

export function ThemeToggle({ theme, onThemeChange, compact = false }: ThemeToggleProps): ReactNode {
  return (
    <div className={`c-theme-toggle-container ${compact ? 'is-compact' : ''}`}>
      <div className="c-theme-toggle-header">
        <span className="c-caption c-theme-header-label">
          {theme === 'dark' ? (
            <MoonIcon size={14} className="c-theme-icon-active" />
          ) : (
            <SunIcon size={14} className="c-theme-icon-active" />
          )}
          <span>Appearance</span>
        </span>
        <span className="c-caption c-theme-current-tag">
          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>

      <div className="c-theme-segmented" role="radiogroup" aria-label="Theme preference">
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'light'}
          className={`c-theme-option ${theme === 'light' ? 'is-selected' : ''}`}
          onClick={() => onThemeChange('light')}
          title="Switch to Academic Parchment (Light Mode)"
        >
          <SunIcon size={14} />
          <span>Light</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={theme === 'dark'}
          className={`c-theme-option ${theme === 'dark' ? 'is-selected' : ''}`}
          onClick={() => onThemeChange('dark')}
          title="Switch to Midnight Prestige (Dark Mode)"
        >
          <MoonIcon size={14} />
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
}

function SunIcon({ size = 16, className = '' }: { size?: number; className?: string }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ms ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size = 16, className = '' }: { size?: number; className?: string }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ms ${className}`}
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
