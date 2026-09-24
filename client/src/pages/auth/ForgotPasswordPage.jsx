import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, ArrowRight, AlertTriangle, MailCheck } from 'lucide-react'
import { authAPI } from '../../api/auth.api'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await authAPI.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Reset your password
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="card shadow-md">
          {sent ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                <MailCheck className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-slate-700 font-medium">Check your inbox</p>
              <p className="text-sm text-slate-500 mt-1">
                If that email is registered, we've sent a reset link. It expires in 30 minutes.
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
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      required placeholder="you@example.com"
                      className="input pl-10"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading
                    ? <><span className="spinner border-white/40 border-t-white" /> Sending…</>
                    : <>Send reset link <ArrowRight className="w-4 h-4" /></>
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
