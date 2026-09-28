import { FileText } from 'lucide-react'

// ── ScannedFilesViewer ──────────────────────────────────────────
// Read-only display of a student's scanned answer — either one or
// more photo pages, or a single PDF (mimeType 'application/pdf').
// Used everywhere a teacher (or the student themselves, once locked)
// reviews what was actually uploaded, as opposed to the AI's
// transcription of it.
export default function ScannedFilesViewer({ files = [], className = '' }) {
  if (!files?.length) return null

  const isPdf = files.length === 1 && files[0].mimeType === 'application/pdf'

  if (isPdf) {
    return (
      <a
        href={`data:application/pdf;base64,${files[0].data}`}
        download="answer.pdf"
        className={`inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-slate-100 transition-colors ${className}`}
      >
        <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
        View submitted PDF
      </a>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {files.map((f, i) => (
        <img
          key={i}
          src={`data:${f.mimeType || 'image/jpeg'};base64,${f.data}`}
          alt={`Page ${i + 1}`}
          className="max-h-56 rounded-xl border border-slate-200"
        />
      ))}
    </div>
  )
}
