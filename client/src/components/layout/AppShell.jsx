import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import CommandPalette from '../CommandPalette'

// ── AppShell ───────────────────────────────────────────────────
// The authenticated layout wrapper.
// Every logged-in page wraps its content in this component.
//
// Usage:
//   <AppShell title="Dashboard" subtitle="Your study overview">
//     <YourPageContent />
//   </AppShell>
//
// The background photo only appears on the Login page — every other
// page (this one included) uses the plain theme background colour.
export default function AppShell({ children, title, subtitle }) {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

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
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
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