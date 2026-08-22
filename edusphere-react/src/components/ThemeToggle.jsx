import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = false, compact = false, style = {} }) {
  const { isDark, toggleTheme, T } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '6px 10px' : '8px 14px',
        borderRadius: '100px',
        border: `1.5px solid ${isDark ? '#334155' : '#e8e4dc'}`,
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#fbbf24' : '#64748b',
        cursor: 'pointer',
        fontFamily: T.fontSans,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = isDark ? '#fbbf24' : '#2563eb';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isDark ? '#334155' : '#e8e4dc';
      }}
    >
      {isDark ? (
        <Sun size={compact ? 15 : 17} color="#fbbf24" style={{ animation: 'spin 10s linear infinite' }} />
      ) : (
        <Moon size={compact ? 15 : 17} color="#6366f1" />
      )}
      {showLabel && (
        <span style={{ color: isDark ? '#f8fafc' : '#1e293b', fontSize: 12, fontWeight: 600 }}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
