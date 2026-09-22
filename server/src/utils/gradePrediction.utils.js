// ── gradePrediction.utils.js ─────────────────────────────────────
// Pure functions only — no DB/AI calls here, same separation
// predictionEngine.js and marking.utils.js already follow. Turns raw
// practice/mock/assignment history into a projected percent, trend,
// and confidence; grade-letter mapping itself stays in marking.utils.js
// (calculateGrade) rather than being duplicated here.

// Exponential decay by days-since, not years-since like
// predictionEngine.js's topic-frequency decay — practice/mock cadence
// is weeks, not years, so recent attempts should dominate quickly.
// ~35-day half-life.
const DECAY_PER_DAY = 0.02

const recencyWeight = (date) => {
  const daysAgo = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  return Math.exp(-Math.max(0, daysAgo) * DECAY_PER_DAY)
}

const weightedAverage = (items, getValue, getDate) => {
  let weightedSum = 0
  let weightTotal = 0
  items.forEach(item => {
    const w = recencyWeight(getDate(item))
    weightedSum += getValue(item) * w
    weightTotal += w
  })
  return weightTotal > 0 ? weightedSum / weightTotal : null
}

// ── computeWeightedPercent ───────────────────────────────────────
// Mock exams are weighted highest (most exam-realistic conditions),
// remedial assignments medium (teacher-set, targeted at weak spots),
// practice lowest (adaptive difficulty tends to overstate readiness
// since it serves questions near the student's own current level).
export const computeWeightedPercent = (sessions, mockExams, assignments) => {
  const practicePercent   = weightedAverage(sessions,    s => s.accuracy,            s => s.createdAt)
  const mockPercent       = weightedAverage(mockExams,   m => m.results?.percent ?? 0, m => m.createdAt)
  const assignmentPercent = weightedAverage(assignments, a => a.percent,             a => a.submittedAt || a.createdAt)

  const sources = [
    { value: mockPercent,       weight: 3 },
    { value: assignmentPercent, weight: 2 },
    { value: practicePercent,   weight: 1 },
  ].filter(s => s.value !== null)

  if (sources.length === 0) return null

  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0)
  const percent = sources.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight
  return Math.round(percent)
}

// ── computeTrend ──────────────────────────────────────────────────
// Same split-window technique as predictionEngine.js's trendDirection
// (compare first half vs second half of a chronological window),
// adapted to score values instead of occurrence counts.
export const computeTrend = (sessions, mockExams, assignments) => {
  const points = [
    ...sessions.map(s => ({ percent: s.accuracy,              date: s.createdAt })),
    ...mockExams.map(m => ({ percent: m.results?.percent ?? 0, date: m.createdAt })),
    ...assignments.map(a => ({ percent: a.percent,             date: a.submittedAt || a.createdAt })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date))

  if (points.length < 4) return 'stable' // too few points to call a direction

  const mid = Math.floor(points.length / 2)
  const avg = arr => arr.reduce((sum, p) => sum + p.percent, 0) / arr.length
  const delta = avg(points.slice(mid)) - avg(points.slice(0, mid))

  if (delta >= 5)  return 'rising'
  if (delta <= -5) return 'falling'
  return 'stable'
}

// ── confidence + thin-data flag ──────────────────────────────────
// Mocks count for more than practice sessions since they're a much
// stronger signal of real exam performance per attempt.
const weightedDataPointCount = (sessions, mockExams, assignments) =>
  sessions.length + mockExams.length * 2 + assignments.length

export const computeConfidence = (sessions, mockExams, assignments) => {
  const weighted = weightedDataPointCount(sessions, mockExams, assignments)
  return Math.min(95, Math.round((weighted / 15) * 95))
}

// Below this many total attempts (across all three sources), the
// projection is more guess than signal — the UI must say so plainly.
export const MIN_DATA_POINTS_FOR_CONFIDENT_PREDICTION = 3

export const isThinData = (sessions, mockExams, assignments) =>
  (sessions.length + mockExams.length + assignments.length) < MIN_DATA_POINTS_FOR_CONFIDENT_PREDICTION

// ── BECE aggregate bands ──────────────────────────────────────────
// Standard commonly-cited reference table, not pulled from any
// official source in this codebase — flagged to the user as
// something to correct once seen live, not treated as authoritative.
export const AGGREGATE_BANDS = [
  { max: 9,        label: 'Excellent' },
  { max: 15,       label: 'Very Good' },
  { max: 20,       label: 'Credit' },
  { max: 30,       label: 'Pass' },
  { max: 36,       label: 'Weak' },
  { max: Infinity, label: 'Very Weak' },
]

export const getAggregateBand = (aggregate) =>
  AGGREGATE_BANDS.find(b => aggregate <= b.max)?.label || 'Very Weak'

// ── BECE core subjects for the aggregate ──────────────────────────
export const BECE_CORE_SUBJECTS = ['Mathematics', 'Science', 'Social Studies', 'English Language']
