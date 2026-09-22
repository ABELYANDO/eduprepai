import { useState, useEffect } from 'react'
import { teacherAPI } from '../../api/teacher.api'
import MathText from '../MathText'
import { Camera, ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'

// ── MockExamReviewPanel ───────────────────────────────────────────
// Mock-exam equivalent of SubmissionReviewPanel — a teacher reviews a
// pending_review exam's Section B/C answers. Unlike Assignments, a
// mock exam's photo-scanned questions are shown as the actual photo
// (not just AI's transcription) — this is the one place a teacher
// sees the real handwritten work.
const questionsList = (questions, overrides, setOverrides, sectionLetter) =>
  questions.map((q, idx) => (
    <div key={idx} className="card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-800 flex-1">
          <span className="text-slate-400 mr-1.5">Section {sectionLetter}.{idx + 1}</span>
          <MathText text={q.questionText} />
        </p>
        <span className="badge-gray text-xs flex-shrink-0">{q.marks} marks</span>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student's answer</p>
          {q.wasScanned && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <Camera className="w-3 h-3" /> scanned
            </span>
          )}
        </div>
        {q.wasScanned && q.photoData ? (
          <img
            src={`data:${q.photoMimeType || 'image/jpeg'};base64,${q.photoData}`}
            alt="Student's uploaded answer"
            className="max-h-72 rounded-xl border border-slate-200"
          />
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-line">{q.studentAnswer || 'Not answered.'}</p>
        )}
      </div>

      {q.modelAnswer && (
        <div className="bg-teal-50 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">Marking scheme</p>
          <p className="text-sm text-teal-800 whitespace-pre-line">{q.modelAnswer}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3">
        <div>
          <label className="label">Marks</label>
          <input
            type="number" min={0} max={q.marks}
            value={overrides[idx]?.marksAwarded ?? 0}
            onChange={e => setOverrides(prev => prev.map((o, i) => i === idx ? { ...o, marksAwarded: e.target.value } : o))}
            className="input"
          />
        </div>
        <div>
          <label className="label">Feedback</label>
          <textarea
            value={overrides[idx]?.aiFeedback ?? ''}
            onChange={e => setOverrides(prev => prev.map((o, i) => i === idx ? { ...o, aiFeedback: e.target.value } : o))}
            rows={2}
            className="input resize-none"
          />
        </div>
      </div>
    </div>
  ))

export default function MockExamReviewPanel({ examId, onBack, onPublished }) {
  const [loading,    setLoading]    = useState(true)
  const [exam,       setExam]       = useState(null)
  const [overridesB, setOverridesB] = useState([])
  const [overridesC, setOverridesC] = useState([])
  const [publishing, setPublishing] = useState(false)

  useEffect(() => { load() }, [examId])

  const load = async () => {
    setLoading(true)
    try {
      const result = await teacherAPI.getMockExamForReview(examId)
      setExam(result.exam)
      setOverridesB(result.exam.sectionB.map(q => ({ marksAwarded: q.marksAwarded ?? 0, aiFeedback: q.aiFeedback || '' })))
      setOverridesC(result.exam.sectionC.map(q => ({ marksAwarded: q.marksAwarded ?? 0, aiFeedback: q.aiFeedback || '' })))
    } catch (err) {
      toast.error(err.message)
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const payload = {
        sectionB: overridesB.map(o => ({ marksAwarded: Number(o.marksAwarded) || 0, aiFeedback: o.aiFeedback })),
        sectionC: overridesC.map(o => ({ marksAwarded: Number(o.marksAwarded) || 0, aiFeedback: o.aiFeedback })),
      }
      const result = await teacherAPI.publishMockExamReview(examId, payload)
      toast.success(`Published — ${result.results.totalMarks}/${result.results.availableMarks} (${result.results.waecGrade})`)
      onPublished()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
  if (!exam) return null

  const totalMarks = [...overridesB, ...overridesC].reduce((sum, o) => sum + (Number(o.marksAwarded) || 0), 0)
  const availableMarks = [...exam.sectionB, ...exam.sectionC].reduce((sum, q) => sum + (q.marks || 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to review queue
      </button>

      <div className="card bg-amber-50 border-amber-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-amber-900">{exam.subject} Mock Exam</p>
          <p className="text-sm text-amber-700">{exam.studentName} · {exam.examType}</p>
        </div>
        <span className="badge-amber text-sm">{totalMarks}/{availableMarks} marks so far (AI-suggested, editable below)</span>
      </div>

      {questionsList(exam.sectionB, overridesB, setOverridesB, 'B')}
      {questionsList(exam.sectionC, overridesC, setOverridesC, 'C')}

      <button
        onClick={handlePublish}
        disabled={publishing}
        className="btn-primary w-full py-3.5 text-base"
      >
        {publishing
          ? <><span className="spinner border-white/40 border-t-white" /> Publishing…</>
          : <>Publish results to student <Send className="w-4 h-4" /></>
        }
      </button>
    </div>
  )
}
