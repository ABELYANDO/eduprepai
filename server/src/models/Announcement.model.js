import mongoose from 'mongoose'

// ── Announcement ─────────────────────────────────────────────────
// A short broadcast a teacher posts to one class — shows up on every
// current member's dashboard. Deliberately class-scoped rather than
// per-student: a teacher speaks to the whole class at once, the same
// way an assignment targets a class rather than individual students.
const announcementSchema = new mongoose.Schema(
  {
    teacherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    classId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Class',
      required: true,
      index:    true,
    },
    message: {
      type:      String,
      required:  [true, 'Announcement text is required'],
      trim:      true,
      maxlength: [1000, 'Keep it under 1000 characters'],
    },
  },
  { timestamps: true }
)

announcementSchema.index({ classId: 1, createdAt: -1 })

const Announcement = mongoose.model('Announcement', announcementSchema)
export default Announcement
