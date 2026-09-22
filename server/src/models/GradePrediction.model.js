import mongoose from 'mongoose'

// ── GradePrediction ──────────────────────────────────────────────
// Per-student, per-subject cache of a projected final-exam grade,
// built from that student's own practice/mock/remedial-assignment
// history — unlike Prediction.model.js (topic predictions), which is
// a global cache shared by every student taking a subject, this is
// inherently personal, so it's keyed by studentId too.
const gradePredictionSchema = new mongoose.Schema(
  {
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    subject:  { type: String, required: true },
    examType: { type: String, enum: ['WASSCE', 'BECE'], required: true },

    predictedGrade:   { type: String, required: true }, // 'A1'..'F9' or '1'..'9'
    predictedPercent: { type: Number, required: true },  // weighted/recency-adjusted, 0-100
    confidence:       { type: Number, default: 0 },       // 0-100
    trend:            { type: String, enum: ['rising', 'falling', 'stable'], default: 'stable' },

    dataPoints: {
      practiceSessions:     { type: Number, default: 0 },
      mockExams:             { type: Number, default: 0 },
      remedialAssignments:   { type: Number, default: 0 },
      avgPracticeAccuracy:   { type: Number, default: 0 },
      avgMockPercent:        { type: Number, default: 0 },
      avgAssignmentPercent:  { type: Number, default: 0 },
    },

    // True when there's too little history for the number to mean much
    // — the UI must say so plainly rather than present it as reliable.
    isThinData: { type: Boolean, default: false },

    // AI-written explanation — same role as Prediction.model.js's
    // aiReasoning field sitting alongside its numeric prediction.
    aiReasoning: { type: String, default: '' },

    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

gradePredictionSchema.index({ studentId: 1, subject: 1, examType: 1 }, { unique: true })

const GradePrediction = mongoose.model('GradePrediction', gradePredictionSchema)
export default GradePrediction
