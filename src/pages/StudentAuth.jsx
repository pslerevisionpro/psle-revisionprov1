import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function StudentAuth() {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', grade: 'std6', age: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function handleSignupStep1(e) {
    e.preventDefault()
    setError('')
    const age = parseInt(form.age)
    if (!form.age || isNaN(age) || age < 5 || age > 25) {
      setError('Please enter a valid age.')
      return
    }
    if (age < 13) {
      setStep('minor')
      return
    }
    setStep(2)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, role: 'student', grade: form.grade } }
      })
      if (signUpErr) throw signUpErr
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
      setStep(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (signInErr) throw signInErr
      navigate('/dashboard')
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
          {step === 'minor' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>👨‍👩‍👧</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--forest)', marginBottom: 12 }}>
                Ask a parent to sign you up
              </h2>
              <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 24 }}>
                Students under 13 need a parent or guardian to create their account.
                This keeps your information safe and follows Botswana data protection laws.
              </p>
              <div style={{ background: 'var(--ivory)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: 24, textAlign: 'left' }}>
                <p style={{ fontWeight: 700, color: 'var(--forest)', marginBottom: 8, fontSize: '0.95rem' }}>
                  📋 Show this to your parent:
                </p>
                <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  Your child wants to use <strong>PSLE RevisionPro</strong> to prepare for their Standard 6 or 7 exams.
                  You can create their account in 2 minutes and stay in full control of their learning data.
                </p>
              </div>
              <Link to="/parent-auth" className="btn btn-primary btn-full" style={{ marginBottom: 12 }}>
                Parent Sign Up →
              </Link>
              <button className="btn btn-ghost btn-full" onClick={() => { setStep(1); setForm(p => ({ ...p, age: '' })) }}>
                ← Go Back
              </button>
            </div>
          ) : (
            <>
              <div style={styles.header}>
                <div style={styles.iconBadge}>🎒</div>
                <h2 style={styles.title}>
                  {mode === 'login' ? 'Student Sign In' : step === 1 ? 'Create Student Account' : 'Almost there!'}
                </h2>
                <p style={styles.subtitle}>
                  {mode === 'login' ? 'Welcome back! Ready to revise?' : step === 1 ? 'Tell us a bit about yourself first.' : 'Create your login details.'}
                </p>
              </div>

              <div style={styles.tabs}>
                <button className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('login'); setStep(1); setError(''); setSuccess('') }}>Sign In</button>
                <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('signup'); setStep(1); setError(''); setSuccess('') }}>Sign Up</button>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {mode === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In →'}
                  </button>
                </form>
              )}

              {mode === 'signup' && step === 1 && (
                <form onSubmit={handleSignupStep1}>
                  <div className="form-group">
                    <label>Your Age</label>
                    <input type="number" placeholder="e.g. 12" min="5" max="25" value={form.age} onChange={e => set('age', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="e.g. Keabetswe Molefe" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Standard (Grade)</label>
                    <select value={form.grade} onChange={e => set('grade', e.target.value)}>
                      <option value="std6">Standard 6</option>
                      <option value="std7">Standard 7</option>
                    </select>
                  </div>
                  <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                    🔒 Students under 13 will be guided to their parent to create the account.
                  </div>
                  <button type="submit" className="btn btn-primary btn-full mt-2">Continue →</button>
                </form>
              )}

              {mode === 'signup' && step === 2 && (
                <form onSubmit={handleSignup}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" placeholder="At least 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? 'Creating account…' : 'Create Account →'}
                    </button>
                  </div>
                </form>
              )}

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

const styles = {
  wrapper: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  panel: { width: '100%', maxWidth: 440, padding: '40px' },
  header: { textAlign: 'center', marginBottom: 28 },
  iconBadge: { fontSize: '2.4rem', marginBottom: 12 },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--forest)', marginBottom: 6 },
  subtitle: { color: 'var(--charcoal-lt)', fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, background: 'var(--ivory)', borderRadius: 'var(--radius-sm)', padding: 4 },
}
