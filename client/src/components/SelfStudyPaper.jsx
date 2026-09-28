import { NotebookPen, ChevronRight } from 'lucide-react'
import MathText from './MathText'
import QuestionDiagram from './QuestionDiagram'

// A part's stored label is a dotted string like "a.i" for a leaf
// sub-part, or a bare "a" when it has no further sub-division —
// same convention PartAnswerEditor uses for graded multi-part answers.
const labelToMarker = (label) => label.split('.').map(s => `(${s})`).join('')

// ── SelfStudyPaper ────────────────────────────────────────────────
// No teacher for this subject, so nothing here can be AI-marked —
// instead of one question per page with an answer box, every question
// (and, for multi-part ones, every lettered sub-part) is laid out on
// a single page like a real exam paper, for the student to work
// through on paper and self-check against their notes/textbook/teacher.
export default function SelfStudyPaper({ questions, subject, onFinish }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card bg-slate-50 border-2 border-dashed border-slate-200 flex items-start gap-3">
        <NotebookPen className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600">
          You're not in a class for {subject}, so these can't be reliably AI-marked. Answer each
          question in your notebook, then check your answers against your textbook or notes, or
          ask a teacher to look them over.
        </p>
      </div>

      <div className="card divide-y divide-slate-100">
        {questions.map((q, idx) => (
          <div key={q._id} className={idx > 0 ? 'pt-5 mt-5' : ''}>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-teal-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="badge-gray text-xs">{q.topic}</span>
                  {q.marks > 1 && <span className="badge-amber text-xs">{q.marks} marks</span>}
                </div>
                <p className="text-slate-800 text-sm leading-relaxed">
                  <MathText text={q.questionText} />
                </p>
                <QuestionDiagram questionId={q._id} hasImage={q.hasImage} imageData={q.imageData} />
              </div>
            </div>

            {q.parts?.length > 0 && (
              <div className="ml-10 space-y-1.5 mt-2">
                {q.parts.map((part) => (
                  <div key={part.part} className="flex gap-2 text-sm text-slate-700">
                    <span className="font-semibold text-teal-600 flex-shrink-0">{labelToMarker(part.part)}</span>
                    <span className="flex-1"><MathText text={part.text} /></span>
                    {part.marks > 0 && <span className="text-xs text-slate-400 flex-shrink-0">{part.marks}m</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onFinish} className="btn-primary w-full py-3">
        I've answered these <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
