import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../../components/layout/AppShell'
import {
  BookOpen, TrendingUp, FileText, Target,
  Flame, Award, ArrowRight, BarChart2,
} from 'lucide-react'

export default function DashboardPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const accuracy = user?.totalQuestionsAnswered > 0
    ? Math.round((user.totalCorrect / user.totalQuestionsAnswered) * 100)
    : 0

  const quickActions = [
    { label: 'Practice Questions', desc: 'Adaptive question sessions', icon: BookOpen,   colour: 'bg-teal-500',   to: '/practice'  },
    { label: 'Likely Exam Topics', desc: 'AI topic forecasts',         icon: TrendingUp, colour: 'bg-amber-500',  to: '/predict'   },
    { label: 'Take Mock Exam',     desc: 'Full WAEC-standard paper',   icon: FileText,   colour: 'bg-purple-500', to: '/mock-exam' },
    { label: 'View Analytics',     desc: 'Track your progress',        icon: BarChart2,  colour: 'bg-blue-500',   to: '/analytics' },
  ]

  return (
    <AppShell
      title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Student'} 👋`}
      subtitle={`${user?.examType || 'WASSCE'} preparation dashboard`}
      bgOpacity={0.75}
    >
      <div className="max-w-5xl mx-auto space-y-7">

        {/* ── Stat cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {[
            { label: 'Questions Done', value: user?.totalQuestionsAnswered || 0, icon: Target,   colour: 'bg-teal-50 text-teal-600'    },
            { label: 'Accuracy',       value: `${accuracy}%`,                   icon: BarChart2, colour: 'bg-blue-50 text-blue-600'    },
            { label: 'Day Streak',     value: user?.streak || 0,                icon: Flame,    colour: 'bg-amber-50 text-amber-600'  },
            { label: 'Badges Earned',  value: user?.badges?.length || 0,        icon: Award,    colour: 'bg-purple-50 text-purple-600' },
          ].map(({ label, value, icon: Icon, colour }) => (
            <div key={label} className="card flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colour}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className="text-2xl font-semibold text-slate-900"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {value}
                </p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ────────────────────────────────── */}
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {quickActions.map(({ label, desc, icon: Icon, colour, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="card-hover text-left group"
              >
                <div className={`w-10 h-10 rounded-xl ${colour} flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p
                  className="font-semibold text-slate-800 text-sm"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Get started <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty state nudge ─────────────────────────────── */}
        {(!user?.totalQuestionsAnswered || user.totalQuestionsAnswered === 0) && (
          <div className="card text-center py-10 border-dashed border-2 border-teal-200 bg-teal-50/50">
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-teal-600" />
            </div>
            <h3
              className="font-semibold text-slate-800 mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Ready to start preparing?
            </h3>
            <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
              Begin with practice questions to build your mastery profile and activate AI predictions.
            </p>
            <button onClick={() => navigate('/practice')} className="btn-primary">
              Start practising now
            </button>
          </div>
        )}

      </div>
    </AppShell>
  )
}