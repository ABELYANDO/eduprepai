import api from './client'

export const gradePredictionAPI = {
  // Predicted grade for each of the student's subjects + BECE aggregate
  getAll: () => api.get('/grade-predictions'),

  // Explicit, on-demand generation for one subject — never automatic
  refresh: (subject) => api.post(`/grade-predictions/${encodeURIComponent(subject)}/refresh`),
}
