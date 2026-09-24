import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, Lock, ArrowRight, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../../api/auth.api'
import ThemeToggle from '../../components/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import examHallBg from '../../assets/exam-hall-bg.jpg'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  // Same wash colour/opacity used everywhere else the background photo
  // appears, so it reads consistently across every page in the app.
  const washRGB = theme === 'dark' ? '11,11,15' : '238,243,250'
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,           setShowPw]          = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match')
    }
    setLoading(true); setError('')
    try {
      await authAPI.resetPassword({ token, newPassword })
      toast.success('Password reset — you can now sign in')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(${washRGB},0.85), rgba(${washRGB},0.85)), url(${examHallBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle className="text-slate-500 hover:bg-slate-100 hover:text-slate-700" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Set a new password
          </h1>
        </div>

        <div className="card shadow-md">
          {!token ? (
            <div className="text-center py-4">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">This link isn't valid</p>
              <p className="text-sm text-slate-500 mt-1">
                Request a new reset link and open the one you get by email.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setError(''); setNewPassword(e.target.value) }}
                      required placeholder="At least 6 characters"
                      className="input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setError(''); setConfirmPassword(e.target.value) }}
                      required placeholder="Re-enter your new password"
                      className="input pl-10"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading
                    ? <><span className="spinner border-white/40 border-t-white" /> Saving…</>
                    : <>Reset password <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          <Link to="/login" className="text-teal-600 font-medium hover:text-teal-700 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
