import Session          from '../models/Session.model.js'
import MockExam         from '../models/MockExam.model.js'
import AssignmentSubmission from '../models/AssignmentSubmission.model.js'
import GradePrediction  from '../models/GradePrediction.model.js'
import { calculateGrade } from '../utils/marking.utils.js'
import {
  computeWeightedPercent, computeTrend, computeConfidence, isThinData,
  getAggregateBand, BECE_CORE_SUBJECTS,
} from '../utils/gradePrediction.utils.js'
import { generateAIJSON } from '../utils/aiService.js'
import { asyncHandler, AppError } from '../middleware/error.middleware.js'
import { resolveExamType } from '../utils/examType.utils.js'

const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0

// ── Combine per-subject predictions into the BECE aggregate ───────
// Never guesses a missing subject — an incomplete aggregate reports
// exactly what's missing instead of a number.
const computeAggregate = (subjectResults) => {
  const generated = subjectResults.filter(r => !r.notGenerated)
  const byName = new Map(generated.map(r => [r.subject, r]))

  const missingCore = BECE_CORE_SUBJECTS.filter(s => !byName.has(s))
  const coreResults = BECE_CORE_SUBJECTS.map(s => byName.get(s)).filter(Boolean)

  const electiveResults = generated
    .filter(r => !BECE_CORE_SUBJECTS.includes(r.subject))
    .sort((a, b) => parseInt(a.predictedGrade, 10) - parseInt(b.predictedGrade, 10)) // lowest number = best
  const bestElectives = electiveResults.slice(0, 2)
  const missingElectiveCount = Math.max(0, 2 - electiveResults.length)

  if (missingCore.length > 0 || missingElectiveCount > 0) {
    return {
      isComplete: false,
      missingCore,
      missingElectiveCount,
      subjectsCounted: [...coreResults, ...bestElectives].map(r => r.subject),
    }
  }

  const counted = [...coreResults, ...bestElectives]
  const aggregate = counted.reduce((sum, r) => sum + parseInt(r.predictedGrade, 10), 0)
  return {
    isComplete: true,
    aggregate,
    band: getAggregateBand(aggregate),
    subjectsCounted: counted.map(r => ({ subject: r.subject, grade: r.predictedGrade })),
  }
}

// ── GET /api/grade-predictions ────────────────────────────────────
// Never generates anything — just reports what's cached for each of
// the student's registered subjects, same "explicit refresh only"
// rule as topic predictions (prediction.controller.js).
export const getGradePredictions = asyncHandler(async (req, res) => {
  const examType = resolveExamType(req)
  const subjects = req.user.subjects || []

  const cached = await GradePrediction.find({ studentId: req.user._id, examType }).lean()
  const cacheMap = new Map(cached.map(c => [c.subject, c]))

  const results = subjects.map(subject => {
    const c = cacheMap.get(subject)
    if (!c) return { subject, notGenerated: true }
    return {
      subject,
      notGenerated:      false,
      predictedGrade:    c.predictedGrade,
      predictedPercent:  c.predictedPercent,
      confidence:        c.confidence,
      trend:             c.trend,
      dataPoints:        c.dataPoints,
      isThinData:        c.isThinData,
      aiReasoning:        c.aiReasoning,
      generatedAt:        c.generatedAt,
    }
  })

  res.json({
    success: true,
    examType,
    subjects: results,
    aggregate: examType === 'BECE' ? computeAggregate(results) : null,
  })
})

// ── POST /api/grade-predictions/:subject/refresh ──────────────────
// Explicit, on-demand generation — the only place an AI call happens.
export const refreshGradePrediction = asyncHandler(async (req, res) => {
  const { subject } = req.params
  const examType = resolveExamType(req)

  if (!req.user.subjects?.includes(subject)) {
    throw new AppError('This is not one of your registered subjects.', 400)
  }

  const [sessions, mockExams, allAssignmentSubmissions] = await Promise.all([
    Session.find({ studentId: req.user._id, subject, sessionType: 'practice' })
      .select('accuracy createdAt').sort({ createdAt: -1 }).limit(50).lean(),
    MockExam.find({ studentId: req.user._id, subject, status: 'marked' })
      .select('results createdAt').sort({ createdAt: -1 }).limit(20).lean(),
    AssignmentSubmission.find({ studentId: req.user._id, status: 'marked' })
      .populate({ path: 'assignmentId', select: 'subject', match: { subject } })
      .select('percent submittedAt assignmentId').lean(),
  ])
  // populate's `match` nulls out assignmentId for submissions whose
  // parent Assignment isn't this subject — filter those out.
  const assignments = allAssignmentSubmissions.filter(s => s.assignmentId)

  const percent = computeWeightedPercent(sessions, mockExams, assignments)
  if (percent === null) {
    throw new AppError('No practice, mock exam, or remedial assignment history yet for this subject.', 400)
  }

  const trend      = computeTrend(sessions, mockExams, assignments)
  const confidence = computeConfidence(sessions, mockExams, assignments)
  const thinData    = isThinData(sessions, mockExams, assignments)
  const gradeInfo   = calculateGrade(percent, 100, examType)

  const dataPoints = {
    practiceSessions:    sessions.length,
    mockExams:            mockExams.length,
    remedialAssignments:  assignments.length,
    avgPracticeAccuracy:  avg(sessions.map(s => s.accuracy)),
    avgMockPercent:        avg(mockExams.map(m => m.results?.percent ?? 0)),
    avgAssignmentPercent:  avg(assignments.map(a => a.percent)),
  }

  const systemPrompt = `You are an exam coach writing a short, honest, encouraging explanation of a
student's projected exam grade, based on their own practice history.
Respond with valid JSON only: {"reasoning": "..."}. Keep it to 2-3
plain-language sentences. No markdown.`

  const prompt = `Subject: ${subject} (${examType})
Projected grade: ${gradeInfo.grade} (${gradeInfo.label}), from a weighted score of ${percent}%.
Trend: ${trend}.
Data used: ${dataPoints.practiceSessions} practice sessions (avg accuracy ${dataPoints.avgPracticeAccuracy}%), ${dataPoints.mockExams} mock exams (avg ${dataPoints.avgMockPercent}%), ${dataPoints.remedialAssignments} remedial assignments (avg ${dataPoints.avgAssignmentPercent}%).
${thinData ? 'Note: this is based on very little data so far — mention that the prediction will get more reliable with more practice.' : ''}
Write a short explanation of why this grade is projected, and one specific, actionable suggestion to improve it.`

  let aiReasoning = ''
  try {
    const result = await generateAIJSON(prompt, systemPrompt)
    aiReasoning = result.reasoning || ''
  } catch {
    aiReasoning = '' // non-fatal — the numeric prediction still stands without commentary
  }

  const doc = await GradePrediction.findOneAndUpdate(
    { studentId: req.user._id, subject, examType },
    {
      predictedGrade:   gradeInfo.grade,
      predictedPercent: percent,
      confidence,
      trend,
      dataPoints,
      isThinData: thinData,
      aiReasoning,
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  ).lean()

  res.json({ success: true, subject, notGenerated: false, ...doc })
})
