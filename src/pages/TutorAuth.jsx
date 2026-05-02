import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function TutorAuth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', fullName: '', school: '', phone: '' })
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
        const { data, error: err } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.fullName, role: 'tutor', school: form.school } }
        })
        if (err) throw err
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, full_name: form.fullName, role: 'tutor',
            email: form.email, school: form.school, phone: form.phone,
          })
        }
        setSuccess('Tutor account created! Verify your email then sign in.')
        setMode('login')
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (err) throw err
        navigate('/dashboard')
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.wrapper}>
        <div style={styles.panel} className="card card-elevated">
          <div style={styles.header}>
            <div style={styles.iconBadge}>🎓</div>
            <h2 style={styles.title}>{mode === 'login' ? 'Tutor Sign In' : 'Tutor Registration'}</h2>
            <p style={styles.subtitle}>
              {mode === 'login' ? 'Access your student management dashboard.' : 'Register to track and support your PSLE students.'}
            </p>
          </div>

          <div style={styles.tabs}>
            <button className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('login'); setError('') }}>Sign In</button>
            <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('signup'); setError('') }}>Register</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g. Mr. Tlotlo Kgosidintsi" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>School / Organisation (optional)</label>
                  <input type="text" placeholder="e.g. Gaborone Independent School" value={form.school} onChange={e => set('school', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone Number (optional)</label>
                  <input type="tel" placeholder="+267 7X XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="tutor@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>

            {mode === 'signup' && (
              <div className="alert alert-info" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                🔒 Your account will be reviewed by an admin before full access is granted.
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Submit Registration →'}
            </button>
          </form>

          <div className="divider">or</div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--charcoal-lt)' }}>
            Are you a student? <Link to="/student-auth" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>Student Portal →</Link>
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
}
