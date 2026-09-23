import mongoose             from 'mongoose'
import Class               from '../models/Class.model.js'
import Assignment          from '../models/Assignment.model.js'
import AssignmentSubmission from '../models/AssignmentSubmission.model.js'
import User                from '../models/User.model.js'
import MasteryProfile      from '../models/MasteryProfile.model.js'
import MockExam            from '../models/MockExam.model.js'
import Session             from '../models/Session.model.js'
import { UNLOCK_THRESHOLD, calculateGrade } from '../utils/marking.utils.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'

// ── Join code generation ────────────────────────────────────────
// Short, shareable, human-typeable — e.g. "MATH-7K2Q". Retries on the
// rare collision rather than trusting randomness alone, since the
// schema also enforces uniqueness at the DB level as a backstop.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I — avoids ambiguity when read aloud/copied
const randomCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

const generateJoinCode = async (subject) => {
  const prefix = subject.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'CLSS'
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `${prefix}-${randomCode()}`
    if (!(await Class.exists({ joinCode: code }))) return code
  }
  throw new AppError('Could not generate a unique join code — please try again.', 500)
}

// ── POST /api/teacher/classes ──────────────────────────────────
export const createClass = asyncHandler(async (req, res) => {
  const { name, subject, examType = 'WASSCE' } = req.body
  if (!name || !subject) throw new AppError('Class name and subject are required', 400)

  // A teacher may only run classes in a subject they declared at
  // registration — this is what keeps a teacher's reach (and, via
  // getStudentMastery below, their visibility into a student's data)
  // limited to the subject(s) they actually teach.
  if (!req.user.subjects.includes(subject)) {
    throw new AppError('You can only create classes for a subject you teach.', 403)
  }

  const joinCode = await generateJoinCode(subject)

  const cls = await Class.create({
    teacherId: req.user._id,
    name,
    subject,
    examType,
    joinCode,
  })

  res.status(201).json({ success: true, message: 'Class created', class: cls })
})

// ── GET /api/teacher/classes ────────────────────────────────────
export const listClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ teacherId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('studentIds', 'fullName email')
    .lean()

  const withCounts = classes.map(c => ({
    ...c,
    studentCount: c.studentIds?.length || 0,
    students: c.studentIds || [], // [{ _id, fullName, email }] — the class roster
  }))

  res.json({ success: true, classes: withCounts })
})

// ── DELETE /api/teacher/classes/:classId/students/:studentId ────
// A student's already-created assignment submissions are untouched —
// they authorize purely off studentId, never live class membership —
// so removal only affects future assignments and this teacher's
// visibility into the student's mastery data from here on.
export const removeStudent = asyncHandler(async (req, res) => {
  const { classId, studentId } = req.params

  const cls = await Class.findOne({ _id: classId, teacherId: req.user._id })
  if (!cls) throw new AppError('Class not found', 404)

  if (!cls.studentIds.some(id => id.equals(studentId))) {
    throw new AppError('Student not in this class', 404)
  }

  cls.studentIds = cls.studentIds.filter(id => !id.equals(studentId))
  await cls.save()

  res.json({ success: true, message: 'Student removed from class' })
})

// ── POST /api/teacher/assignments ──────────────────────────────
// Creates the assignment, then eagerly creates one AssignmentSubmission
// per student currently in the class — so progress ("0/25 submitted")
// is visible immediately and a student's pending-count query never
// needs to join against Assignment/Class at read time.
export const createAssignment = asyncHandler(async (req, res) => {
  const { classId, title, dueDate, questions, studentIds } = req.body

  if (!classId || !title) throw new AppError('Class and title are required', 400)
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('At least one question is required', 400)
  }

  const cls = await Class.findOne({ _id: classId, teacherId: req.user._id })
  if (!cls) throw new AppError('Class not found', 404)

  // Remedial assignments target one (or a few) specific students rather
  // than the whole class — `studentIds`, when given, must be a subset
  // of the class roster. Omitted entirely, behaviour is unchanged: every
  // current class member gets it.
  let targetStudentIds = cls.studentIds
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    const rosterIds = new Set(cls.studentIds.map(id => id.toString()))
    const invalid = studentIds.filter(id => !rosterIds.has(id.toString()))
    if (invalid.length > 0) throw new AppError('One or more selected students are not in this class.', 400)
    targetStudentIds = studentIds
  }

  const assignment = await Assignment.create({
    classId:  cls._id,
    teacherId: req.user._id,
    title,
    subject:  cls.subject,
    examType: cls.examType,
    dueDate:  dueDate || null,
    questions: questions.map(q => ({
      type:          q.type,
      questionText:  q.questionText,
      options:       q.options || [],
      correctOption: q.correctOption || '',
      modelAnswer:   q.modelAnswer || '',
      marks:         q.marks,
      topic:         q.topic || '',
      hasImage:      !!q.hasImage,
      imageData:     q.imageData || '',
      parts:         q.parts || [],
    })),
  })

  const availableMarks = assignment.questions.reduce((sum, q) => sum + (q.marks || 0), 0)

  if (targetStudentIds.length > 0) {
    await AssignmentSubmission.insertMany(
      targetStudentIds.map(studentId => ({
        assignmentId: assignment._id,
        studentId,
        answers: assignment.questions.map(() => ({})),
        availableMarks,
      })),
      { ordered: false }
    )
  }

  res.status(201).json({
    success: true,
    message: `Assignment created and sent to ${targetStudentIds.length} student${targetStudentIds.length !== 1 ? 's' : ''}`,
    assignment,
  })
})

// ── GET /api/teacher/assignments?classId= ──────────────────────
export const listAssignments = asyncHandler(async (req, res) => {
  const { classId } = req.query

  const classFilter = classId
    ? { _id: classId, teacherId: req.user._id }
    : { teacherId: req.user._id }
  const classIds = (await Class.find(classFilter).select('_id')).map(c => c._id)

  const assignments = await Assignment.find({ classId: { $in: classIds } })
    .sort({ createdAt: -1 })
    .lean()

  const counts = await AssignmentSubmission.aggregate([
    { $match: { assignmentId: { $in: assignments.map(a => a._id) } } },
    { $group: {
        _id: '$assignmentId',
        total:     { $sum: 1 },
        submitted: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'pending_review', 'marked']] }, 1, 0] } },
      } },
  ])
  const countMap = new Map(counts.map(c => [c._id.toString(), c]))

  const withCounts = assignments.map(a => ({
    ...a,
    questionCount: a.questions?.length || 0,
    submittedCount: countMap.get(a._id.toString())?.submitted || 0,
    totalStudents:  countMap.get(a._id.toString())?.total || 0,
  }))

  res.json({ success: true, assignments: withCounts })
})

// ── GET /api/teacher/students/:studentId/mastery?subject= ───────
// Struggling-topics view for one student, scoped to a single subject.
// Combines practice-derived MasteryProfile scores with a fresh
// aggregation over marked MockExam questions by topic — mock exams
// never write to MasteryProfile (that pipeline is practice-only), so
// this is the only place mock performance is read back by topic.
export const getStudentMastery = asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { subject } = req.query
  if (!subject) throw new AppError('Subject is required', 400)

  // Ownership + subject scope: a teacher may only view a student's data
  // for a subject they actually teach that student in — the same
  // relationship (Class.studentIds) that gates submission review above.
  const owns = await Class.exists({ teacherId: req.user._id, subject, studentIds: studentId })
  if (!owns) throw new AppError('Student not found in a class you teach for this subject.', 404)

  const [masteryProfiles, mockTopics] = await Promise.all([
    MasteryProfile.find({ studentId, subject }).sort({ score: 1 }).lean(),
    MockExam.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId), subject, status: 'marked' } },
      { $project: { all: { $concatArrays: ['$sectionA', '$sectionB', '$sectionC'] } } },
      { $unwind: '$all' },
      { $match: { 'all.topic': { $nin: [null, ''] } } },
      { $group: {
          _id: '$all.topic',
          marksAwarded:   { $sum: '$all.marksAwarded' },
          marksAvailable: { $sum: '$all.marks' },
          attempts:       { $sum: 1 },
        } },
    ]),
  ])

  const masteryHeatmap = masteryProfiles.map(m => ({
    subject: m.subject, topic: m.topic, score: m.score, difficulty: m.difficulty,
    attempts: m.totalAttempts, lastPracticed: m.lastPracticed,
  }))

  const mockTopicAccuracy = mockTopics.map(t => ({
    topic: t._id,
    accuracy: t.marksAvailable > 0 ? Math.round((t.marksAwarded / t.marksAvailable) * 100) : 0,
    attempts: t.attempts,
  }))

  // "Struggling" = weak by either signal — a low practice mastery score
  // (below the same UNLOCK_THRESHOLD the adaptive engine itself uses)
  // or low raw accuracy on marked mock questions for that topic.
  const struggling = [
    ...masteryHeatmap.filter(m => m.score < UNLOCK_THRESHOLD)
      .map(m => ({ topic: m.topic, source: 'practice', score: m.score })),
    ...mockTopicAccuracy.filter(t => t.accuracy < 50)
      .map(t => ({ topic: t.topic, source: 'mock', score: t.accuracy })),
  ].sort((a, b) => a.score - b.score)

  // Scanned practice answers, read-only — see the plan's scope note on
  // why practice-mode scans don't get a full override/publish flow like
  // Assignments/Mock Exams do (they've already fed the live adaptive
  // MasteryProfile by the time a teacher could review them).
  const scannedSessions = await Session.find({
    studentId, subject, sessionType: 'practice', 'questions.wasScanned': true,
  }).select('questions createdAt').sort({ createdAt: -1 }).limit(20).lean()

  const scannedPracticeAnswers = scannedSessions.flatMap(s =>
    s.questions
      .filter(q => q.wasScanned)
      .map(q => ({
        topic:         q.topic,
        studentAnswer: q.studentAnswer,
        photoData:     q.photoData,
        photoMimeType: q.photoMimeType,
        marksAwarded:  q.marksAwarded,
        marksAvailable: q.marksAvailable,
        isCorrect:     q.isCorrect,
        date:          s.createdAt,
      }))
  )

  res.json({
    success: true, masteryHeatmap, mockTopicAccuracy,
    strugglingTopics: struggling, scannedPracticeAnswers,
  })
})

// ── Ownership helper ─────────────────────────────────────────────
// Shared by all three review endpoints below — a teacher may only see
// or act on submissions for assignments whose class they own.
const findOwnedSubmission = async (submissionId, teacherId) => {
  const submission = await AssignmentSubmission.findById(submissionId).populate('assignmentId')
  if (!submission || !submission.assignmentId) return null
  const owns = await Class.exists({ _id: submission.assignmentId.classId, teacherId })
  return owns ? submission : null
}

// ── GET /api/teacher/submissions?status=pending_review ──────────
// The review queue — submissions containing at least one photo-scanned
// answer, waiting for the teacher to check the AI's transcription/marks
// before they're released to the student.
export const listPendingReviews = asyncHandler(async (req, res) => {
  const classIds = (await Class.find({ teacherId: req.user._id }).select('_id')).map(c => c._id)
  const assignmentIds = (await Assignment.find({ classId: { $in: classIds } }).select('_id')).map(a => a._id)

  const submissions = await AssignmentSubmission.find({
    assignmentId: { $in: assignmentIds },
    status: 'pending_review',
  })
    .sort({ submittedAt: 1 }) // oldest first — first submitted, first reviewed
    .populate('studentId', 'fullName')
    .populate('assignmentId', 'title subject')
    .lean()

  res.json({
    success: true,
    submissions: submissions.map(s => ({
      submissionId: s._id,
      studentName:  s.studentId?.fullName || 'Unknown student',
      title:        s.assignmentId?.title || '',
      subject:      s.assignmentId?.subject || '',
      submittedAt:  s.submittedAt,
    })),
  })
})

// ── GET /api/teacher/submissions/:id ─────────────────────────────
// Full detail for one submission under review — unlike the student's
// own view, this includes correct answers/model answers and the AI's
// suggested marks, since the teacher needs them to judge quality.
export const getSubmissionForReview = asyncHandler(async (req, res) => {
  const submission = await findOwnedSubmission(req.params.id, req.user._id)
  if (!submission) throw new AppError('Submission not found', 404)

  const assignment = submission.assignmentId
  const student = await User.findById(submission.studentId).select('fullName')

  res.json({
    success: true,
    submission: {
      id: submission._id,
      status: submission.status,
      studentName: student?.fullName || 'Unknown student',
      answers: submission.answers,
    },
    assignment: {
      title: assignment.title,
      subject: assignment.subject,
      questions: assignment.questions,
    },
  })
})

// ── POST /api/teacher/submissions/:id/publish ────────────────────
// Releases the results to the student. `answers` is an optional array
// of {marksAwarded, aiFeedback} overrides, same order as the
// assignment's questions — a teacher happy with the AI's read can call
// this with no body at all; one correcting a misread scan only needs
// to send the entries they changed marks/feedback for other questions
// are left as the AI originally computed them.
export const publishSubmission = asyncHandler(async (req, res) => {
  const { answers: overrides } = req.body
  const submission = await findOwnedSubmission(req.params.id, req.user._id)
  if (!submission) throw new AppError('Submission not found', 404)
  if (submission.status !== 'pending_review') {
    throw new AppError('This submission is not awaiting review', 400)
  }

  if (Array.isArray(overrides)) {
    overrides.forEach((override, i) => {
      if (!override || !submission.answers[i]) return
      if (override.marksAwarded !== undefined) submission.answers[i].marksAwarded = Number(override.marksAwarded)
      if (override.aiFeedback   !== undefined) submission.answers[i].aiFeedback   = override.aiFeedback
    })
    submission.markModified('answers')
  }

  const totalMarks = submission.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0)
  submission.totalMarks = totalMarks
  submission.percent    = submission.availableMarks > 0 ? Math.round((totalMarks / submission.availableMarks) * 100) : 0
  submission.status     = 'marked'
  submission.markedAt   = new Date()
  await submission.save()

  res.json({
    success: true,
    message: 'Results published to student',
    results: {
      totalMarks: submission.totalMarks,
      availableMarks: submission.availableMarks,
      percent: submission.percent,
    },
  })
})

// ── Mock exam review — same idea as the Assignment trio above, but
// MockExam has no classId, so ownership is resolved via subject+roster
// instead of `findOwnedSubmission`'s classId lookup. ──────────────────
const ownsMockExam = async (exam, teacherId) =>
  !!(await Class.exists({ teacherId, subject: exam.subject, studentIds: exam.studentId }))

// ── GET /api/teacher/mock-exams?status=pending_review ────────────
export const listPendingMockExams = asyncHandler(async (req, res) => {
  const classes = await Class.find({ teacherId: req.user._id }).select('subject studentIds').lean()
  if (classes.length === 0) return res.json({ success: true, mockExams: [] })

  const exams = await MockExam.find({
    status: 'pending_review',
    $or: classes.map(c => ({ subject: c.subject, studentId: { $in: c.studentIds } })),
  })
    .populate('studentId', 'fullName')
    .select('subject examType studentId submittedAt')
    .sort({ submittedAt: 1 })
    .lean()

  res.json({
    success: true,
    mockExams: exams.map(e => ({
      examId:      e._id,
      studentName: e.studentId?.fullName || 'Unknown student',
      subject:     e.subject,
      examType:    e.examType,
      submittedAt: e.submittedAt,
    })),
  })
})

// ── GET /api/teacher/mock-exams/:id ───────────────────────────────
export const getMockExamForReview = asyncHandler(async (req, res) => {
  const exam = await MockExam.findById(req.params.id)
  if (!exam || exam.status !== 'pending_review' || !(await ownsMockExam(exam, req.user._id))) {
    throw new AppError('Mock exam not found', 404)
  }
  const student = await User.findById(exam.studentId).select('fullName')

  res.json({
    success: true,
    exam: {
      id: exam._id,
      subject: exam.subject,
      examType: exam.examType,
      studentName: student?.fullName || 'Unknown student',
      sectionB: exam.sectionB,
      sectionC: exam.sectionC,
    },
  })
})

// ── POST /api/teacher/mock-exams/:id/publish ──────────────────────
// `overrides` is optional: { sectionB: [{marksAwarded, aiFeedback}, ...], sectionC: [...] },
// index-aligned with the exam's own sections — same "only send what
// you're correcting" convention as the Assignment publish endpoint.
export const publishMockExamReview = asyncHandler(async (req, res) => {
  const { overrides } = req.body
  const exam = await MockExam.findById(req.params.id)
  if (!exam || exam.status !== 'pending_review' || !(await ownsMockExam(exam, req.user._id))) {
    throw new AppError('Mock exam not found', 404)
  }

  for (const sectionKey of ['sectionB', 'sectionC']) {
    const sectionOverrides = overrides?.[sectionKey]
    if (!Array.isArray(sectionOverrides)) continue
    sectionOverrides.forEach((override, i) => {
      if (!override || !exam[sectionKey][i]) return
      if (override.marksAwarded !== undefined) exam[sectionKey][i].marksAwarded = Number(override.marksAwarded)
      if (override.aiFeedback   !== undefined) exam[sectionKey][i].aiFeedback   = override.aiFeedback
    })
    exam.markModified(sectionKey)
  }

  const sectionBMarks = exam.sectionB.reduce((sum, q) => sum + (q.marksAwarded || 0), 0)
  const sectionCMarks = exam.sectionC.reduce((sum, q) => sum + (q.marksAwarded || 0), 0)
  const totalMarks = exam.results.sectionAMarks + sectionBMarks + sectionCMarks
  const gradeInfo = calculateGrade(totalMarks, exam.results.availableMarks, exam.examType)

  exam.results.sectionBMarks = sectionBMarks
  exam.results.sectionCMarks = sectionCMarks
  exam.results.totalMarks    = totalMarks
  exam.results.percent       = totalMarks
  exam.results.waecGrade     = gradeInfo.grade
  exam.results.gradeLabel    = gradeInfo.label
  exam.status = 'marked'
  await exam.save()

  res.json({ success: true, message: 'Results published to student', results: exam.results })
})
