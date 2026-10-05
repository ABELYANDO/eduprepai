import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { assignmentAPI } from '../../api/assignment.api'
import {
  LayoutDashboard, BookOpen, TrendingUp, FileText,
  BarChart2, Trophy, Settings, LogOut, ClipboardList,
  ChevronRight, ChevronDown,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'

// This sidebar only ever renders for students — admins/teachers have
// their own shells with no student nav items, so there's nothing
// role-based to branch on here any more.
const STUDENT_NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/practice',    icon: BookOpen,         label: 'Practice'    },
  { to: '/mock-exam',   icon: FileText,         label: 'Mock Exam'   },
  { to: '/assignments', icon: ClipboardList,    label: 'Remedial Assignment' },
  { to: '/predict',     icon: TrendingUp,       label: 'Likely Exam Topics' },
  { to: '/analytics',   icon: BarChart2,        label: 'Analytics and Final Grades Predictions' },
  { to: '/leaderboard', icon: Trophy,           label: 'Star Board' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const navigate          = useNavigate()
  const [subjectsOpen, setSubjectsOpen] = useState(false)
  const isDark = theme === 'dark'

  // Light mode: a light, warm peach surface instead of a dark band —
  // colour lives in the accents (active states, badges, the streak
  // flame) rather than in a permanent dark panel, which is what made
  // the previous palettes feel heavy. Dark mode keeps its own
  // near-black charcoal, same as every other surface in dark mode.
  const sidebarBg = isDark
    ? 'linear-gradient(180deg, #17171C 0%, #0A0A0D 100%)'
    : '#FFF1E2'

  const goToSubject = (subject) => {
    navigate(`/practice?${new URLSearchParams({ subject }).toString()}`)
    onClose()
  }

  // Fetch once on mount — this app's existing notification-adjacent
  // features (e.g. badge toasts) are all fetch-on-load, not real-time,
  // so a pending-assignment count follows the same convention rather
  // than adding new polling infrastructure just for this.
  const [pendingAssignments, setPendingAssignments] = useState(0)
  useEffect(() => {
    assignmentAPI.getPendingCount()
      .then(data => setPendingAssignments(data.count || 0))
      .catch(() => {}) // silent — badge just stays at 0
  }, [])

  // Remedial Assignment only ever has anything in it once a student has
  // joined a teacher's class — hide the nav item entirely until then,
  // rather than linking to a page that's just an empty "join a class"
  // prompt for every brand-new student.
  const [inAnyClass, setInAnyClass] = useState(false)
  useEffect(() => {
    assignmentAPI.getClasses()
      .then(data => setInAnyClass((data.classes || []).length > 0))
      .catch(() => {}) // silent — nav item just stays hidden
  }, [])

  const visibleNav = STUDENT_NAV.filter(item => item.to !== '/assignments' || inAnyClass)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const accuracy = user?.totalQuestionsAnswered > 0
    ? Math.round((user.totalCorrect / user.totalQuestionsAnswered) * 100)
    : 0

  return (
    <>
      {/* Dimmed overlay on mobile when sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          sidebar-scroll overflow-y-auto
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: 'var(--sidebar-width)',
          background: sidebarBg,
          borderRight: isDark ? 'none' : '1px solid #FCE0BE',
        }}
        aria-label="Main navigation"
      >
        {/* ── Logo ────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b ${isDark ? 'border-white/10' : 'border-orange-100'}`}>
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
            <img src={logo} alt="YankelPrep" className="w-full h-full object-cover" />
          </div>
          <div>
            <p
              className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-orange-950'}`}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              YankelPrep
            </p>
            <p className={`text-xs ${isDark ? 'text-teal-300' : 'text-orange-600'}`}>WASSCE · BECE</p>
          </div>
        </div>

        {/* ── User card ────────────────────────────────────── */}
        <div className={`mx-4 mt-4 rounded-xl p-3.5 ${isDark ? 'bg-white/8 border border-white/10' : 'bg-white border border-orange-100 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            {/* Avatar initial */}
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-orange-950'}`}>{user?.fullName}</p>
              <p className={`text-xs truncate ${isDark ? 'text-teal-300' : 'text-orange-500'}`}>{user?.examType || 'Student'}</p>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-orange-100'}`}>
            <div className="text-center">
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-orange-950'}`}>{user?.streak || 0}</p>
              <p className={`text-xs ${isDark ? 'text-teal-400' : 'text-orange-500'}`}>Day streak</p>
            </div>
            <div className="text-center">
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-orange-950'}`}>{accuracy}%</p>
              <p className={`text-xs ${isDark ? 'text-teal-400' : 'text-orange-500'}`}>Accuracy</p>
            </div>
          </div>
        </div>

        {/* ── Navigation links ─────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Sidebar navigation">
          <p className={`text-xs font-medium uppercase tracking-wider px-3 mb-2 ${isDark ? 'text-teal-500' : 'text-orange-400'}`}>
            Study Tools
          </p>

          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 group relative
                ${isActive
                  ? isDark ? 'bg-teal-400/20 text-white font-medium' : 'bg-orange-100 text-orange-900 font-medium'
                  : isDark ? 'text-teal-100/80 hover:bg-white/8 hover:text-white' : 'text-orange-800/70 hover:bg-orange-50 hover:text-orange-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar on left edge */}
                  {isActive && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isDark ? 'bg-teal-400' : 'bg-orange-500'}`} />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? (isDark ? 'text-teal-400' : 'text-orange-600')
                      : (isDark ? 'text-teal-400/60 group-hover:text-teal-300' : 'text-orange-400 group-hover:text-orange-600')
                  }`} />
                  <span className="flex-1">{label}</span>
                  {to === '/assignments' && pendingAssignments > 0 && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {pendingAssignments}
                    </span>
                  )}
                  {isActive && <ChevronRight className={`w-3 h-3 ${isDark ? 'text-teal-400/60' : 'text-orange-400'}`} />}
                </>
              )}
            </NavLink>
          ))}

          {/* Subject dropdown — collapsed by default, click to reveal
             every subject the student is registered for (not capped
             to a handful like the old always-open list was). Picking
             one jumps into Practice pre-filtered to that subject, same
             query-param convention the command palette already uses. */}
          {user?.subjects?.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-orange-100'}`}>
              <button
                type="button"
                onClick={() => setSubjectsOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3 mb-2 text-xs font-medium uppercase tracking-wider transition-colors ${isDark ? 'text-teal-500 hover:text-teal-300' : 'text-orange-400 hover:text-orange-600'}`}
                aria-expanded={subjectsOpen}
              >
                My Subjects
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${subjectsOpen ? 'rotate-180' : ''}`} />
              </button>
              {subjectsOpen && (
                <div className="space-y-0.5 animate-fade-in">
                  {user.subjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => goToSubject(subject)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-left ${isDark ? 'text-teal-200/70 hover:bg-white/8 hover:text-teal-100' : 'text-orange-700/70 hover:bg-orange-50 hover:text-orange-900'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDark ? 'bg-teal-400/50' : 'bg-orange-400/60'}`} />
                      <span className="truncate">{subject}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── Bottom: settings + logout ─────────────────────── */}
        <div className={`px-3 pb-5 space-y-0.5 border-t pt-3 ${isDark ? 'border-white/10' : 'border-orange-100'}`}>
          <NavLink
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${isDark ? 'text-teal-100/70 hover:bg-white/8 hover:text-white' : 'text-orange-800/70 hover:bg-orange-50 hover:text-orange-900'}`}
          >
            <Settings className={`w-4 h-4 ${isDark ? 'text-teal-400/60' : 'text-orange-400'}`} />
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${isDark ? 'text-teal-100/70 hover:bg-red-500/15 hover:text-red-300' : 'text-orange-800/70 hover:bg-red-50 hover:text-red-600'}`}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
