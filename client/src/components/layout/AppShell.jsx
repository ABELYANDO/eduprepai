import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import CommandPalette from '../CommandPalette'
import examHallBg from '../../assets/exam-hall-bg.jpg'
import { useTheme } from '../../context/ThemeContext'

// ── AppShell ───────────────────────────────────────────────────
// The authenticated layout wrapper.
// Every logged-in page wraps its content in this component.
//
// Usage:
//   <AppShell title="Dashboard" subtitle="Your study overview">
//     <YourPageContent />
//   </AppShell>
//
// `bgOpacity` (0-1) controls how much of the background photo shows
// through the page-colour wash — defaults to a subtle texture; pass a
// lower value (e.g. from DashboardPage) to make it more visible on a
// specific page without changing every other page under this shell.
export default function AppShell({ children, title, subtitle, bgOpacity = 0.93 }) {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { theme } = useTheme()
  // Light mode washes the photo with the light navy --color-bg
  // (238,243,250 = #EEF3FA); dark mode washes it with the dark
  // --color-bg (11,17,32 = #0B1120) instead of literally the same
  // light wash, which would otherwise stay light regardless of theme.
  const washRGB = theme === 'dark' ? '11,17,32' : '238,243,250'

  // Global ⌘K / Ctrl+K shortcut — works from any authenticated page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{
        // A faint wash of the page's own background colour over the photo
        // keeps every card/text element exactly as readable as before —
        // the image should read as texture, not compete with content.
        backgroundImage: `linear-gradient(rgba(${washRGB},${bgOpacity}), rgba(${washRGB},${bgOpacity})), url(${examHallBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content — pushed right by sidebar width on desktop only.
         The sidebar itself hides off-screen below `lg` (see Sidebar.jsx's
         `-translate-x-full`), so this padding must match that breakpoint
         exactly — otherwise mobile content stays squeezed into the space
         reserved for a sidebar that isn't actually visible. */}
      <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width)]">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onOpenSearch={() => setPaletteOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        {/* Actual page content */}
        <main
          className="flex-1 p-5 md:p-7 animate-fade-in"
          style={{ marginTop: 'var(--topbar-height)' }}
        >
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}