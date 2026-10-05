import mongoose from 'mongoose'

// ── ExamSchedule ─────────────────────────────────────────────────
// Singleton document (there's only ever one, upserted in place) —
// this cycle's WASSCE/BECE start dates, set by an admin and read by
// every student's dashboard to show a "days until your exam"
// countdown. Kept as data rather than hardcoded in code, since WAEC
// sets a new date each year and this needs updating without a
// redeploy.
const examScheduleSchema = new mongoose.Schema(
  {
    wassceDate: { type: Date, default: null },
    beceDate:   { type: Date, default: null },
  },
  { timestamps: true }
)

const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema)
export default ExamSchedule
