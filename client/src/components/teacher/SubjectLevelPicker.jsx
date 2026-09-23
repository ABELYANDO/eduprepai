import { useState } from 'react'
import { Check } from 'lucide-react'
import { getSubjectsForExamType, getPickerTiles } from '../../constants/subjects'

// ── SubjectLevelPicker ───────────────────────────────────────────
// School-level toggle (BECE/basic vs WASSCE/secondary) + subject tile
// picker for teachers, shared between TeacherOnboardingPage (first
// pick, right after sign-up) and TeacherPage's "My Subjects" tab
// (editing later). Same group-expansion pattern as the student
// subject pickers in OnboardingPage/SettingsPage, just scoped to
// whichever exam-type list matches the teacher's declared level.
export default function SubjectLevelPicker({ level, setLevel, subjects, setSubjects }) {
  const [openGroup, setOpenGroup] = useState(null)

  const tiles = getPickerTiles(getSubjectsForExamType(level))

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
      {/* Level toggle */}
      <div>
        <label className="label">I teach at</label>
        <div className="flex gap-3">
          {[
            { key: 'BECE',   label: 'Basic School (BECE)' },
            { key: 'WASSCE', label: 'Secondary School (WASSCE)' },
          ].map(({ key, label }) => (
            <button
              key={key} type="button"
              onClick={() => { setLevel(key); setSubjects([]); setOpenGroup(null) }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                level === key
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                  : 'bg-surface text-slate-600 border-slate-200 hover:border-teal-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject picker */}
      <div>
        <label className="label">
          Which subject(s) do you teach?
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
