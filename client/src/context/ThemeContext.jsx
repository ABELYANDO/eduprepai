import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'eduprepai_theme' // 'light' | 'dark' — device preference, not per-account

const getSystemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

// Mirrors the inline script in index.html that sets this before React
// mounts (avoids a flash of the wrong theme) — kept in sync with it.
const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* localStorage unavailable — fall through to system preference */ }
  return getSystemTheme()
}

// ── ThemeProvider ─────────────────────────────────────────────────
// Same shape as AuthContext/NotificationContext. Applies the theme as
// a `data-theme` attribute on <html> — index.css's `[data-theme="dark"]`
// block (sibling to the existing `.admin-theme` retint trick) reads it.
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch { /* theme still applies for this session, just won't persist */ }
  }, [theme])

  // Follow the OS preference live if the student never explicitly chose —
  // once they pick a theme themselves it's set in localStorage above and
  // this stops overriding it (matches() firing again doesn't matter since
  // we only read the OS value here, on the media query's own change event).
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mql) return
    const handleChange = (e) => {
      let hasExplicitChoice = false
      try { hasExplicitChoice = !!localStorage.getItem(STORAGE_KEY + '_explicit') } catch { /* ignore */ }
      if (!hasExplicitChoice) setTheme(e.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const chooseTheme = useCallback((next) => {
    setTheme(next)
    try { localStorage.setItem(STORAGE_KEY + '_explicit', '1') } catch { /* ignore */ }
  }, [])

  const toggleTheme = useCallback(() => {
    chooseTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, chooseTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: chooseTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
