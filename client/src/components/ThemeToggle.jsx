import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// ── ThemeToggle ────────────────────────────────────────────────
// Small icon button, dropped into any shell's header. `className`
// lets each shell (student teal, teacher navy, admin indigo headers)
// pass its own hover/text colours to match its surrounding chrome.
export default function ThemeToggle({ className = 'text-slate-500 hover:bg-slate-50 hover:text-slate-700' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
