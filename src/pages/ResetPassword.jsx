import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function ResetPassword() {
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const [validSession, setValidSession] = useState(false)
  const navigate = useNavigate()

  // Check if we have a valid reset session from the email link
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
    })
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      setSuccess('Password updated successfully!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div style={s.wrapper}>
        <div style={s.panel} className="card card-elevated">
          <div style={s.header}>
            <div style={s.iconBadge}>🔐</div>
            <h2 style={s.title}>Set New Password</h2>
            <p style={s.subtitle}>Choose a strong password for your account.</p>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success} Redirecting…</div>}

          {!validSession ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.9rem', marginBottom: 16 }}>
                This reset link is invalid or has expired.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/student-auth')}>
                Request a new link →
              </button>
            </div>
          ) : !success && (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={s.eyeBtn}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Type password again"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrapper:  { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  panel:    { width: '100%', maxWidth: 400, padding: '40px' },
  header:   { textAlign: 'center', marginBottom: 28 },
  iconBadge:{ fontSize: '2.4rem', marginBottom: 12 },
  title:    { fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--forest)', marginBottom: 6 },
  subtitle: { color: 'var(--charcoal-lt)', fontSize: '0.9rem' },
  eyeBtn:   { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1 },
}
