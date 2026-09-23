import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppShell from '../../components/layout/AppShell'
import SubjectPicker from '../../components/student/SubjectPicker'
import { settingsAPI } from '../../api/settings.api'
import { assignmentAPI } from '../../api/assignment.api'
import toast from 'react-hot-toast'
import {
  BookOpen, TrendingUp, FileText, Target,
  Flame, Award, ArrowRight, BarChart2,
  Save, LogIn, LogOut, Users,
} from 'lucide-react'

export default function DashboardPage() {
  const { user, updateUser } = useAuth()
  const navigate   = useNavigate()

  const accuracy = user?.totalQuestionsAnswered > 0
    ? Math.round((user.totalCorrect / user.totalQuestionsAnswered) * 100)
    : 0

  // ── Your Subjects ────────────────────────────────────────────
  const [examType, setExamType] = useState(user?.examType || 'WASSCE')
  const [subjects, setSubjects] = useState(user?.subjects || [])
  const [savingSubjects, setSavingSubjects] = useState(false)

  const handleSaveSubjects = async () => {
    if (subjects.length === 0) return toast.error('Select at least one subject')
    setSavingSubjects(true)
    try {
      await settingsAPI.updateProfile({ examType, subjects })
      updateUser({ examType, subjects })
      toast.success('Subjects updated!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingSubjects(false)
    }
  }

  // ── Your Classes ─────────────────────────────────────────────
  const [joinedClasses,  setJoinedClasses]  = useState([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [joinCodeInput,  setJoinCodeInput]  = useState('')
  const [joining,        setJoining]        = useState(false)

  useEffect(() => { loadClasses() }, [])

  const loadClasses = async () => {
    setClassesLoading(true)
    try {
      const data = await assignmentAPI.getClasses()
      setJoinedClasses(data.classes || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setClassesLoading(false)
    }
  }

  const handleJoinClass = async (e) => {
    e.preventDefault()
    if (!joinCodeInput.trim()) return
    setJoining(true)
    try {
      const data = await assignmentAPI.joinClass(joinCodeInput.trim())
      toast.success(data.message)
      setJoinCodeInput('')
      loadClasses()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveClass = async (cls) => {
    if (!window.confirm(`Leave ${cls.name}? You'll keep access to work already assigned, but won't receive anything new from this class.`)) return
    try {
      await assignmentAPI.leaveClass(cls._id)
      toast.success(`Left ${cls.name}`)
      loadClasses()
    } catch (err) {
      toast.error(err.message)
    }
  }

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

        {/* ── Your Subjects ──────────────────────────────────── */}
        <div className="card space-y-5" id="subjects">
          <h2 className="section-title flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            Your Subjects
          </h2>
          <SubjectPicker
            examType={examType} setExamType={setExamType}
            subjects={subjects} setSubjects={setSubjects}
          />
          <button
            onClick={handleSaveSubjects}
            disabled={savingSubjects || subjects.length === 0}
            className="btn-primary w-full py-3"
          >
            {savingSubjects
              ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save subjects</>
            }
          </button>
        </div>

        {/* ── Your Classes ───────────────────────────────────── */}
        <div className="space-y-5" id="classes">
          <div className="card">
            <h2 className="section-title flex items-center gap-2">
              <LogIn className="w-4 h-4 text-teal-600" />
              Join a class
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter the join code your teacher shared to receive their assignments.
            </p>
            <form onSubmit={handleJoinClass} className="flex gap-3">
              <input
                type="text"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. MATH-7K2Q"
                className="input flex-1"
              />
              <button type="submit" disabled={joining} className="btn-primary px-5">
                {joining ? <span className="spinner border-white/40 border-t-white" /> : 'Join'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="section-title flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              Your classes
            </h2>
            {classesLoading && <p className="text-sm text-slate-400 text-center py-6">Loading…</p>}
            {!classesLoading && joinedClasses.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">You haven't joined any classes yet.</p>
            )}
            <div className="space-y-2">
              {joinedClasses.map(c => (
                <div key={c._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.subject} · {c.examType} · Taught by {c.teacherId?.fullName || 'a teacher'}</p>
                  </div>
                  <button
                    onClick={() => handleLeaveClass(c)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Leave
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}