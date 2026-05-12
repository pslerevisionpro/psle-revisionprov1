import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function TutorAuth() {
  const [mode, setMode]                 = useState('login')  // 'login' | 'signup' | 'forgot'
  const [form, setForm]                 = useState({ email: '', password: '', fullName: '', school: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function switchMode(m) {
    setMode(m); setError(''); setSuccess(''); setShowPassword(false)
  }

  // ── Login ─────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (err) throw err
      navigate('/dashboard')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Signup ────────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName, role: 'tutor', school: form.school } }
      })
      if (signUpErr) throw signUpErr
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, full_name: form.fullName, role: 'tutor',
          email: form.email, school: form.school, phone: form.phone,
        })
      }
      setSuccess('Account created! Check your email to verify, then sign in.')
      switchMode('login')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Forgot password ───────────────────────────────────────────
  async function handleForgotPassword(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        form.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      )
      if (resetErr) throw resetErr
      setSuccess('Password reset email sent! Check your inbox and follow the link.')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Password field ────────────────────────────────────────────
  function PasswordField({ placeholder = 'Your password', minLength }) {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={form.password}
          onChange={e => set('password', e.target.value)}
          required
          minLength={minLength}
          style={{ paddingRight: 44 }}
        />
        <button type="button" onClick={() => setShowPassword(v => !v)} style={s.eyeBtn} tabIndex={-1}>
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Navbar />
      <div style={s.wrapper}>
        <div style={s.panel} className="card card-elevated">
          <div style={s.header}>
            <div style={s.iconBadge}>🎓</div>
            <h2 style={s.title}>
              {mode === 'forgot' ? 'Reset Password'
               : mode === 'login' ? 'Tutor Sign In'
               : 'Tutor Sign Up'}
            </h2>
            <p style={s.subtitle}>
              {mode === 'forgot' ? "We'll send a reset link to your email."
               : mode === 'login' ? 'Access your student roster and performance data.'
               : 'Create your tutor account to track student progress.'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <div style={s.tabs}>
              <button className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => switchMode('login')}>Sign In</button>
              <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => switchMode('signup')}>Sign Up</button>
            </div>
          )}

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* ── Login form ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="tutor@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <PasswordField />
              </div>
              <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 16 }}>
                <button type="button" style={s.forgotLink} onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          )}

          {/* ── Forgot password form ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label>Your Email Address</label>
                <input type="email" placeholder="tutor@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>
              <button type="button" className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => switchMode('login')}>
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* ── Signup form ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="e.g. Thabo Sechele" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>School or Organisation (optional)</label>
                <input type="text" placeholder="e.g. Gaborone Primary School" value={form.school} onChange={e => set('school', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone Number (optional)</label>
                <input type="tel" placeholder="e.g. +267 71 234 567" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="tutor@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <PasswordField placeholder="At least 8 characters" minLength={8} />
              </div>
              <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Tutor Account →'}
              </button>
            </form>
          )}

          {mode !== 'forgot' && (
            <>
              <div className="divider">or</div>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--charcoal-lt)' }}>
                Are you a parent?{' '}
                <Link to="/parent-auth" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>Parent Portal →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrapper:    { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  panel:      { width: '100%', maxWidth: 440, padding: '40px' },
  header:     { textAlign: 'center', marginBottom: 28 },
  iconBadge:  { fontSize: '2.4rem', marginBottom: 12 },
  title:      { fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--forest)', marginBottom: 6 },
  subtitle:   { color: 'var(--charcoal-lt)', fontSize: '0.9rem' },
  tabs:       { display: 'flex', gap: 8, marginBottom: 24, background: 'var(--ivory)', borderRadius: 'var(--radius-sm)', padding: 4 },
  eyeBtn:     { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px', lineHeight: 1 },
  forgotLink: { background: 'none', border: 'none', color: 'var(--forest-lt)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline' },
}
