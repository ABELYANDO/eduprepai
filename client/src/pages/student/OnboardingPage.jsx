import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsAPI } from '../../api/settings.api'
import SubjectPicker from '../../components/student/SubjectPicker'

// ── OnboardingPage ────────────────────────────────────────────
// Shown right after a student signs up (and to any student who
// hasn't picked subjects yet — see PrivateRoute's gate in App.jsx).
export default function OnboardingPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [examType, setExamType] = useState('WASSCE')
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (subjects.length === 0) return setError('Select at least one subject')
    setLoading(true); setError('')
    try {
      await settingsAPI.updateProfile({ examType, subjects })
      updateUser({ examType, subjects })
      toast.success('You\'re all set!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {user?.fullName ? `Welcome, ${user.fullName.split(' ')[0]}!` : 'One last step'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tell us what you're preparing for to unlock your dashboard
          </p>
        </div>

        <div className="card shadow-md">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <SubjectPicker
              examType={examType} setExamType={setExamType}
              subjects={subjects} setSubjects={setSubjects}
            />

            <button
              type="submit"
              disabled={loading || subjects.length === 0}
              className="btn-primary w-full py-3"
            >
              {loading
                ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
                : <>Continue to dashboard <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
