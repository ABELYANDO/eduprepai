import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { assignmentAPI } from '../api/assignment.api'

const NotificationContext = createContext(null)

const MAX_NOTIFICATIONS = 20
const storageKey = (userId) => `eduprepai_notifications_${userId}`
const seenAssignmentsKey = (userId) => `eduprepai_seen_assignments_${userId}`

// ── NotificationProvider ─────────────────────────────────────────
// Lightweight, client-only notification feed — no backend model.
// Fed entirely by events that already happen (new badges earned at
// the end of a practice session, mock exam, or manual badge check),
// via getBadgeDetails() results the server already returns. Persisted
// per-user in localStorage so it survives a refresh but stays scoped
// to whoever is signed in.
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  // ── Load this user's notifications on login/refresh ──────────
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      return
    }
    try {
      const stored = localStorage.getItem(storageKey(user.id))
      setNotifications(stored ? JSON.parse(stored) : [])
    } catch {
      setNotifications([])
    }
  }, [user?.id])

  // ── Persist on every change ───────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    try {
      localStorage.setItem(storageKey(user.id), JSON.stringify(notifications))
    } catch {
      // localStorage unavailable (private browsing, quota) — notifications
      // still work for the current tab, they just won't survive a refresh.
    }
  }, [notifications, user?.id])

  // ── Notify about assignments posted since we last checked ──────
  // Same fetch-on-load convention as Sidebar's pending-assignments
  // badge (see its own comment) — no new polling infrastructure, this
  // just also happens to feed the bell. Runs once per login/refresh:
  // fetches the student's current assignment list, diffs it against
  // the submission IDs already recorded in localStorage, and turns any
  // unseen ones into a notification before recording them as seen —
  // so a student never gets notified for the same assignment twice,
  // even across different tabs/devices' localStorage.
  useEffect(() => {
    if (!user?.id || user.role !== 'student') return

    assignmentAPI.getMyAssignments()
      .then(({ assignments = [] }) => {
        let seen = []
        try {
          seen = JSON.parse(localStorage.getItem(seenAssignmentsKey(user.id)) || '[]')
        } catch { /* corrupt/missing — treat as first run */ }
        const seenSet = new Set(seen)

        const unseen = assignments.filter(a => !seenSet.has(String(a.submissionId)))
        if (unseen.length > 0) {
          const newOnes = unseen.map(a => ({
            id:        `assignment_${a.submissionId}`,
            icon:      '📚',
            title:     'New assignment posted',
            message:   `${a.title}${a.className ? ` — ${a.className}` : ''}`,
            createdAt: new Date().toISOString(),
            read:      false,
          }))
          setNotifications(prev => [...newOnes, ...prev].slice(0, MAX_NOTIFICATIONS))
        }

        try {
          localStorage.setItem(
            seenAssignmentsKey(user.id),
            JSON.stringify(assignments.map(a => String(a.submissionId)))
          )
        } catch { /* localStorage unavailable — next load will just re-check */ }
      })
      .catch(() => {}) // silent — same as Sidebar's pending-count fetch
  }, [user?.id, user?.role])

  // ── Add one notification per newly-earned badge ───────────────
  const addBadgeNotifications = useCallback((badges = []) => {
    if (badges.length === 0) return
    const newOnes = badges.map(badge => ({
      id:        `badge_${badge.id}_${Date.now()}`,
      icon:      badge.icon || '🏅',
      title:     'New badge earned!',
      message:   badge.name,
      createdAt: new Date().toISOString(),
      read:      false,
    }))
    setNotifications(prev => [...newOnes, ...prev].slice(0, MAX_NOTIFICATIONS))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addBadgeNotifications, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// ── Custom hook ───────────────────────────────────────────────
export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider')
  return ctx
}
