import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

// ── Defined OUTSIDE component to prevent re-render focus loss ──
function PasswordField({ placeholder, minLength, showPassword, onToggle, value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={showPassword ? 'text' : 'password'} autoComplete="current-password"
        placeholder={placeholder || 'Your password'}
        value={value}
        onChange={onChange}
        required
        minLength={minLength}
        style={{ paddingRight: 44 }}
      />
      <button type="button" onClick={onToggle} style={eyeBtn} tabIndex={-1}>
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
  )
}
const eyeBtn = { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'1rem', padding:'4px', lineHeight:1 }

export default function StudentAuth() {
  const [mode, setMode]                 = useState('login')
  const [step, setStep]                 = useState(1)
  const [form, setForm]                 = useState({ email:'', password:'', fullName:'', grade:'std6', age:'' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function switchMode(m) { setMode(m); setStep(1); setError(''); setSuccess(''); setShowPassword(false) }

  function handleSignupStep1(e) {
    e.preventDefault(); setError('')
    const age = parseInt(form.age)
    if (!form.age || isNaN(age) || age < 5 || age > 25) { setError('Please enter a valid age.'); return }
    if (age < 13) { setStep('minor'); return }
    setStep(2)
  }

  async function handleSignup(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName, role: 'student', grade: form.grade } }
      })
      if (signUpErr) throw signUpErr
      if (data.user) await supabase.from('profiles').upsert({ id:data.user.id, full_name:form.fullName, role:'student', grade:form.grade, email:form.email })
      setSuccess('Account created! Check your email to confirm, then sign in.')
      switchMode('login')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (signInErr) throw signInErr
      navigate('/dashboard')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function handleForgotPassword(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` })
      if (resetErr) throw resetErr
      setSuccess('Password reset email sent! Check your inbox and follow the link.')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const pwProps = { showPassword, onToggle: () => setShowPassword(v => !v), value: form.password, onChange: e => set('password', e.target.value) }

  return (
    <div className="page-container">
      <Navbar />
      <div style={s.wrapper}>
        <div style={s.panel} className="card card-elevated">

          {step === 'minor' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:16 }}>👨‍👩‍👧</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', color:'var(--forest)', marginBottom:12 }}>Ask a parent to sign you up</h2>
              <p style={{ color:'var(--charcoal-lt)', fontSize:'0.95rem', lineHeight:1.7, marginBottom:24 }}>
                Students under 13 need a parent or guardian to create their account. This keeps your information safe and follows Botswana data protection laws.
              </p>
              <div style={{ background:'var(--ivory)', borderRadius:'var(--radius-md)', padding:'20px', marginBottom:24, textAlign:'left' }}>
                <p style={{ fontWeight:700, color:'var(--forest)', marginBottom:8, fontSize:'0.95rem' }}>📋 Show this to your parent:</p>
                <p style={{ color:'var(--charcoal-lt)', fontSize:'0.88rem', lineHeight:1.65 }}>Your child wants to use <strong>PSLE RevisionPro</strong> to prepare for their Standard 6 or 7 exams. You can create their account in 2 minutes.</p>
              </div>
              <Link to="/parent-auth" className="btn btn-primary btn-full" style={{ marginBottom:12 }}>Parent Sign Up →</Link>
              <button className="btn btn-ghost btn-full" onClick={() => { setStep(1); set('age','') }}>← Go Back</button>
            </div>
          ) : (
            <>
              <div style={s.header}>
                <div style={s.iconBadge}>🎒</div>
                <h2 style={s.title}>{mode==='login'?'Student Sign In':mode==='forgot'?'Reset Password':step===1?'Create Student Account':'Almost there!'}</h2>
                <p style={s.subtitle}>{mode==='login'?'Welcome back! Ready to revise?':mode==='forgot'?"We'll send a reset link to your email.":step===1?'Tell us a bit about yourself first.':'Create your login details.'}</p>
              </div>

              {mode !== 'forgot' && (
                <div style={s.tabs}>
                  <button className={`btn btn-sm ${mode==='login'?'btn-primary':'btn-ghost'}`} onClick={() => switchMode('login')}>Sign In</button>
                  <button className={`btn btn-sm ${mode==='signup'?'btn-primary':'btn-ghost'}`} onClick={() => switchMode('signup')}>Sign Up</button>
                </div>
              )}

              {error   && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {mode === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="form-group"><label>Email Address</label><input type="email" placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                  <div className="form-group"><label>Password</label><PasswordField {...pwProps} /></div>
                  <div style={{ textAlign:'right', marginTop:-12, marginBottom:16 }}>
                    <button type="button" style={s.forgotLink} onClick={() => switchMode('forgot')}>Forgot password?</button>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'Signing in…':'Sign In →'}</button>
                </form>
              )}

              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword}>
                  <div className="form-group"><label>Your Email Address</label><input type="email" placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                  <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>{loading?'Sending…':'Send Reset Link →'}</button>
                  <button type="button" className="btn btn-ghost btn-full" style={{ marginTop:10 }} onClick={() => switchMode('login')}>← Back to Sign In</button>
                </form>
              )}

              {mode === 'signup' && step === 1 && (
                <form onSubmit={handleSignupStep1}>
                  <div className="form-group"><label>Your Age</label><input type="number" placeholder="e.g. 12" min="5" max="25" value={form.age} onChange={e => set('age', e.target.value)} required /></div>
                  <div className="form-group"><label>Full Name</label><input type="text" placeholder="e.g. Keabetswe Molefe" value={form.fullName} onChange={e => set('fullName', e.target.value)} required /></div>
                  <div className="form-group">
                    <label>Standard (Grade)</label>
                    <select value={form.grade} onChange={e => set('grade', e.target.value)}>
                      <option value="std6">Standard 6</option>
                      <option value="std7">Standard 7</option>
                    </select>
                  </div>
                  <div className="alert alert-info" style={{ fontSize:'0.85rem' }}>🔒 Students under 13 will be guided to their parent to create the account.</div>
                  <button type="submit" className="btn btn-primary btn-full mt-2">Continue →</button>
                </form>
              )}

              {mode === 'signup' && step === 2 && (
                <form onSubmit={handleSignup}>
                  <div className="form-group"><label>Email Address</label><input type="email" placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                  <div className="form-group"><label>Password</label><PasswordField {...pwProps} placeholder="At least 8 characters" minLength={8} /></div>
                  <div style={{ display:'flex', gap:10, marginTop:8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'Creating account…':'Create Account →'}</button>
                  </div>
                </form>
              )}

              {mode !== 'forgot' && (
                <>
                  <div className="divider">or</div>
                  <p style={{ textAlign:'center', fontSize:'0.85rem', color:'var(--charcoal-lt)' }}>
                    Are you a parent?{' '}<Link to="/parent-auth" style={{ color:'var(--forest-lt)', fontWeight:600 }}>Parent Portal →</Link>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrapper:    { minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 16px' },
  panel:      { width:'100%', maxWidth:440, padding:'40px' },
  header:     { textAlign:'center', marginBottom:28 },
  iconBadge:  { fontSize:'2.4rem', marginBottom:12 },
  title:      { fontFamily:'var(--font-display)', fontSize:'1.9rem', color:'var(--forest)', marginBottom:6 },
  subtitle:   { color:'var(--charcoal-lt)', fontSize:'0.9rem' },
  tabs:       { display:'flex', gap:8, marginBottom:24, background:'var(--ivory)', borderRadius:'var(--radius-sm)', padding:4 },
  forgotLink: { background:'none', border:'none', color:'var(--forest-lt)', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)', textDecoration:'underline' },
}
