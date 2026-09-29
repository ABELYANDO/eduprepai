import { Router } from 'express'
import {
  joinClass,
  getMyClasses,
  leaveClass,
  listMyAssignments,
  listMyAnnouncements,
  getPendingCount,
  getSubmission,
  saveAnswer,
  submitSubmission,
  submitFileAssignment,
  extractAnswerFromPhoto,
} from '../controllers/assignment.controller.js'
import { protect, restrictTo } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect)
router.use(restrictTo('student'))

router.post('/join',           joinClass)
router.get('/classes',         getMyClasses)
router.post('/classes/:classId/leave', leaveClass)
router.post('/extract-photo',  extractAnswerFromPhoto)

router.get('/',                listMyAssignments)
router.get('/announcements',   listMyAnnouncements)
router.get('/pending-count',   getPendingCount)
router.get('/:submissionId',   getSubmission)
router.patch('/:submissionId/answer', saveAnswer)
router.post('/:submissionId/submit',  submitSubmission)
router.post('/:submissionId/submit-file', submitFileAssignment)

export default router
