import { useState } from 'react'
import { Camera, CheckCircle2 } from 'lucide-react'

// ── PhotoAnswerInput ─────────────────────────────────────────────
// Replaces PartAnswerEditor for a student in a teacher's class — the
// photo is the record, not a typed/editable transcription (unlike the
// Assignment flow, which offers photo as an option alongside a
// still-editable textarea). `extractPhoto` is the transcribe-only API
// call to use (practiceAPI/mockExamAPI each mount the same server
// handler under their own route — see practice.routes.js/mockExam.routes.js).
export default function PhotoAnswerInput({
  onCaptured,        // ({ transcribedText, photoBase64, mimeType }) => void
  extractPhoto,       // (base64, mimeType, questionText) => Promise<{ transcribedAnswer }>
  questionText,
  disabled = false,
  hasAnswer = false,
  photoPreview = null, // { photoData, photoMimeType } — shown once captured
}) {
  const [scanning, setScanning] = useState(false)
  const [error,    setError]    = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setScanning(true)
    setError('')
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result.split(',')[1])
        reader.onerror = () => reject(new Error('Failed to read photo'))
        reader.readAsDataURL(file)
      })
      const data = await extractPhoto(base64, file.type, questionText)
      onCaptured({ transcribedText: data.transcribedAnswer || '', photoBase64: base64, mimeType: file.type })
    } catch (err) {
      setError(err.message || 'Could not read that photo')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div>
      {!disabled && (
        <label className={`inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 mb-2 cursor-pointer transition-colors ${scanning ? 'opacity-50 pointer-events-none' : ''}`}>
          <Camera className="w-4 h-4" />
          {scanning ? 'Reading photo…' : hasAnswer ? 'Retake / upload a different photo' : 'Upload a photo of your answer'}
          <input
            type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files[0])}
            disabled={scanning}
          />
        </label>
      )}

      {photoPreview?.photoData && (
        <div className="mt-1">
          <img
            src={`data:${photoPreview.photoMimeType || 'image/jpeg'};base64,${photoPreview.photoData}`}
            alt="Your uploaded answer"
            className="max-h-64 rounded-xl border border-slate-200"
          />
          {!disabled && (
            <p className="text-xs text-teal-600 flex items-center gap-1 mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Photo uploaded and read
            </p>
          )}
        </div>
      )}

      {!photoPreview?.photoData && !disabled && (
        <p className="text-xs text-slate-400">Your teacher will review your actual written answer from the photo.</p>
      )}

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}
