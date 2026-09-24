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
// The background photo wash (colour + opacity) is fixed at the same
// value used everywhere else the photo appears — TeacherShell,
// AdminShell, and every pre-login page — so it reads as one
// consistent app-wide texture rather than varying per page.
export default function AppShell({ children, title, subtitle }) {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { theme } = useTheme()
  // Light mode washes the photo with the light navy --color-bg
  // (238,243,250 = #EEF3FA); dark mode washes it with the dark
  // --color-bg (11,11,15 = #0B0B0F) instead of literally the same
  // light wash, which would otherwise stay light regardless of theme.
  const washRGB = theme === 'dark' ? '11,11,15' : '238,243,250'

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
        // backgroundAttachment: 'fixed' is deliberately NOT used here —
        // iOS Safari renders fixed backgrounds incorrectly, making them
        // visibly jump/shift during scroll. Scrolling with the page is
        // the correct, glitch-free behavior on every browser.
        backgroundImage: `linear-gradient(rgba(${washRGB},0.85), rgba(${washRGB},0.85)), url(${examHallBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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