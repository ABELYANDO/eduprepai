import { useState } from 'react'
import { Check } from 'lucide-react'
import { getSubjectsForExamType, getPickerTiles } from '../../constants/subjects'

// ── SubjectPicker ────────────────────────────────────────────────
// Exam-type toggle (WASSCE/BECE) + subject tile picker for students —
// shared between OnboardingPage (first pick, right after sign-up) and
// the Dashboard's "Your Subjects" section (editing later). Mirrors
// the teacher-side SubjectLevelPicker.jsx one-for-one, just framed as
// "which exam are you preparing for" instead of "which level I teach."
export default function SubjectPicker({ examType, setExamType, subjects, setSubjects }) {
  const [openGroup, setOpenGroup] = useState(null)

  const tiles = getPickerTiles(getSubjectsForExamType(examType))

  const toggleSubject = (s) => {
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const chooseGroupOption = (groupOptions, choice) => {
    setSubjects(prev => [...prev.filter(x => !groupOptions.includes(x)), choice])
    setOpenGroup(null)
  }

  return (
    <div className="space-y-5">
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
          My subjects
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

            // ── Group tile (e.g. 'Ghanaian Language') — expands into a
            // single-choice list of its member subjects.
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
    </div>
  )
}
