import { CheckCircle2, XCircle } from 'lucide-react'
import QuestionDiagram from '../QuestionDiagram'
import PartAnswerEditor from '../PartAnswerEditor'
import PhotoAnswerInput from '../PhotoAnswerInput'

// ── ExamSectionB ───────────────────────────────────────────────
// Renders all 4 structured questions for Section B.
// Students type their answers in text areas — or, when `requiresPhoto`
// is set (student is in a teacher's class for this subject), upload a
// photo of their written answer instead.
export default function ExamSectionB({
  questions, answers, onAnswer, isReview = false, markedQuestions, onExplain, explaining = false,
  requiresPhoto = false, extractPhoto, photos = {},
}) {
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0)

  return (
    <div className="space-y-6">

      {/* Section header */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-blue-900 text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Section B — Structured Question{questions.length > 1 ? 's' : ''}
            </h2>
            <p className="text-blue-700 text-sm mt-1">
              {questions.length > 1 ? `Answer ALL ${questions.length} questions` : 'Answer this question'} · {totalMarks} marks total
            </p>
          </div>
          <span className="badge-blue text-sm px-3 py-1.5 flex-shrink-0">
            {Object.values(answers).filter(a => a?.trim()).length}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Individual questions */}
      {questions.map((q, idx) => {
        const answer = answers[idx] || ''
        const marked = markedQuestions?.[idx]
        const showResult = isReview && marked?.marksAwarded !== null

        return (
          <div key={idx} className={`card shadow-sm border-2 ${showResult
            ? marked.isCorrect ? 'border-green-200' : 'border-orange-200'
            : answer.trim() ? 'border-blue-200' : 'border-slate-100'
          }`}>

            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-blue">Structured</span>
                  <span className="badge-gray">{q.marks} marks</span>
                  <span className="text-xs text-slate-400">{q.topic}</span>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed font-medium">
                  {q.questionText}
                </p>
                <QuestionDiagram hasImage={q.hasImage} imageData={q.imageData} />
              </div>
            </div>

            {/* Answer area — one box per sub-part, a single textarea, or
               a photo upload/preview when this was (or requires) a scan */}
            <div className="ml-11">
              {isReview && marked?.wasScanned ? (
                <img
                  src={`data:${marked.photoMimeType || 'image/jpeg'};base64,${marked.photoData}`}
                  alt="Student's uploaded answer"
                  className="max-h-64 rounded-xl border border-slate-200"
                />
              ) : requiresPhoto && !isReview ? (
                <PhotoAnswerInput
                  extractPhoto={extractPhoto}
                  questionText={q.questionText}
                  disabled={isReview}
                  hasAnswer={!!answer}
                  photoPreview={photos[idx]}
                  onCaptured={({ transcribedText, photoBase64, mimeType }) =>
                    onAnswer(idx, transcribedText, { photoData: photoBase64, photoMimeType: mimeType })
                  }
                />
              ) : (
                <>
                  <PartAnswerEditor
                    parts={q.parts}
                    value={answer}
                    onChange={text => onAnswer(idx, text)}
                    disabled={isReview}
                    isReview={isReview}
                    partResults={marked?.partResults || []}
                    placeholder="Write your answer here. Label each part clearly: (a) ..., (b) ..., (c) ..."
                  />
                  {!isReview && (
                    <p className="text-xs text-slate-400 mt-1.5 text-right">
                      {answer.trim().split(/\s+/).filter(Boolean).length} words
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Review result */}
            {showResult && (
              <div className={`mt-4 ml-11 rounded-xl px-4 py-3 border ${
                (marked.marksAwarded / (q.marks || 1)) >= 0.5
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {(marked.marksAwarded / (q.marks || 1)) >= 0.5
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-orange-500" />
                  }
                  <span className="font-semibold text-sm">
                    {marked.marksAwarded} / {q.marks} marks
                  </span>
                </div>
                {marked.aiFeedback && (
                  <p className="text-xs text-slate-600 mb-2">{marked.aiFeedback}</p>
                )}
                {onExplain && (
                  <button
                    onClick={() => onExplain(idx)}
                    disabled={explaining}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-3 pt-2 border-t border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Explain this question
                  </button>
                )}
              </div>
            )}

            {/* Marking scheme — the guide used to mark this answer */}
            {isReview && q.modelAnswer && (
              <div className="mt-4 ml-11 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Marking scheme
                </p>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {q.modelAnswer}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}