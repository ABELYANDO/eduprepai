import { Router } from 'express'
import { getGradePredictions, refreshGradePrediction } from '../controllers/gradePrediction.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// Student-scoped, same as practice.routes.js — no role restriction
// beyond being logged in, since it always reads/writes req.user._id.
router.use(protect)

router.get('/',                  getGradePredictions)
router.post('/:subject/refresh', refreshGradePrediction)

export default router
