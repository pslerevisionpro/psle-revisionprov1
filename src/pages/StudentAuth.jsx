import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function StudentAuth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', fullName: '', grade: 'std6' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName, role: 'student', grade: form.grade } }
        })
        if (signUpErr) throw signUpErr

        // Create profile row
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: form.fullName,
            role: 'student',
            grade: form.grade,
            email: form.email,
          })
        }
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (signInErr) throw signInErr
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.wrapper}>
        <div style={styles.panel} className="card card-elevated">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.iconBadge}>🎒</div>
            <h2 style={styles.title}>{mode === 'login' ? 'Student Sign In' : 'Create Student Account'}</h2>
            <p style={styles.subtitle}>
              {mode === 'login' ? 'Welcome back! Ready to revise?' : 'Join thousands of Botswana students preparing for PSLE.'}
            </p>
          </div>

          {/* Tab toggle */}
          <div style={styles.tabs}>
            <button className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Sign In</button>
            <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Sign Up</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="e.g. Keabetswe Molefe" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
              </div>
            )}
            {mode === 'signup' && (
              <div className="form-group">
                <label>Standard (Grade)</label>
                <select value={form.grade} onChange={e => set('grade', e.target.value)}>
                  <option value="std6">Standard 6</option>
                  <option value="std7">Standard 7</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>

            <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={styles.switch}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button style={styles.switchBtn} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <div className="divider">or</div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--charcoal-lt)' }}>
            Are you a parent? <Link to="/parent-auth" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>Parent Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  panel: { width: '100%', maxWidth: 440, padding: '40px' },
  header: { textAlign: 'center', marginBottom: 28 },
  iconBadge: { fontSize: '2.4rem', marginBottom: 12 },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--forest)', marginBottom: 6 },
  subtitle: { color: 'var(--charcoal-lt)', fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, background: 'var(--ivory)', borderRadius: 'var(--radius-sm)', padding: 4 },
  switch: { textAlign: 'center', marginTop: 18, fontSize: '0.9rem', color: 'var(--charcoal-lt)' },
  switchBtn: { background: 'none', border: 'none', color: 'var(--forest-lt)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' },
}
