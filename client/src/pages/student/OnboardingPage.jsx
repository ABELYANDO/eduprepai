import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Check, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUBJECTS_WASSCE, SUBJECTS_BECE, getPickerTiles } from '../../constants/subjects'
import { settingsAPI } from '../../api/settings.api'

// ── OnboardingPage ────────────────────────────────────────────
// Shown right after a student signs up (and to any student who
// hasn't picked subjects yet — see PrivateRoute's gate in App.jsx).
// Reuses the same exam-type-toggle + subject-tile-picker pattern
// as RegisterPage's old step 2 and SettingsPage's Subjects tab.
export default function OnboardingPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [examType, setExamType] = useState('WASSCE')
  const [subjects, setSubjects] = useState([])
  const [openGroup, setOpenGroup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subjectList = examType === 'WASSCE' ? SUBJECTS_WASSCE : SUBJECTS_BECE
  const tiles = getPickerTiles(subjectList)

  const toggleSubject = (s) => {
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  // Group members (e.g. Ghanaian languages) are single-choice — picking
  // one replaces any other member of the same group already selected.
  const chooseGroupOption = (groupOptions, choice) => {
    setSubjects(prev => [...prev.filter(x => !groupOptions.includes(x)), choice])
    setOpenGroup(null)
  }

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
            {/* Exam type toggle */}
            <div>
              <label className="label">I am preparing for</label>
              <div className="flex gap-3">
                {['WASSCE', 'BECE'].map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => { setExamType(t); setSubjects([]); setOpenGroup(null) }}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      examType === t
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                        : 'bg-surface text-slate-600 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject picker */}
            <div>
              <label className="label">
                Select your subjects
                <span className="text-teal-600 font-normal ml-1">
                  ({subjects.length} selected)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {tiles.map(tile => {
                  if (tile.type === 'subject') {
                    const s = tile.label
                    return (
                      <button
                        key={s} type="button"
                        onClick={() => toggleSubject(s)}
                        className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all ${
                          subjects.includes(s)
                            ? 'bg-teal-50 text-teal-700 border-teal-400'
                            : 'bg-surface text-slate-600 border-slate-200 hover:border-teal-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            subjects.includes(s)
                              ? 'bg-teal-500 border-teal-500'
                              : 'border-slate-300'
                          }`}>
                            {subjects.includes(s) && <Check className="w-2 h-2 text-white" />}
                          </div>
                          {s}
                        </div>
                      </button>
                    )
                  }

                  // ── Group tile (e.g. 'Ghanaian Language') — expands
                  // into a single-choice list of its member subjects.
                  const selectedOption = tile.options.find(o => subjects.includes(o))
                  const isOpen = openGroup === tile.label
                  return (
                    <div key={tile.label} className="col-span-2">
                      <button
                        type="button"
                        onClick={() => setOpenGroup(isOpen ? null : tile.label)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium border-2 transition-all ${
                          selectedOption
                            ? 'bg-teal-50 text-teal-700 border-teal-400'
                            : 'bg-surface text-slate-600 border-slate-200 hover:border-teal-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              selectedOption
                                ? 'bg-teal-500 border-teal-500'
                                : 'border-slate-300'
                            }`}>
                              {selectedOption && <Check className="w-2 h-2 text-white" />}
                            </div>
                            {tile.label}
                          </div>
                          <span className="text-slate-400 font-normal">
                            {selectedOption || 'Choose one ›'}
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="mt-1.5 ml-2 pl-2.5 border-l-2 border-teal-200 space-y-1 animate-fade-in">
                          {tile.options.map(lang => (
                            <button
                              key={lang} type="button"
                              onClick={() => chooseGroupOption(tile.options, lang)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                selectedOption === lang
                                  ? 'bg-teal-100 text-teal-800 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

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
