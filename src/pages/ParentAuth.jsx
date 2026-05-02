import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function ParentAuth() {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1) // step 2 = consent
  const [form, setForm] = useState({ email: '', password: '', fullName: '', childName: '' })
  const [consent, setConsent] = useState({ privacy: false, terms: false, dataConsent: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setC = (k) => setConsent(p => ({ ...p, [k]: !p[k] }))
  const allConsented = consent.privacy && consent.terms && consent.dataConsent

  async function handleStep1(e) {
    e.preventDefault()
    setError('')
    if (mode === 'signup') { setStep(2); return }
    // login
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (err) throw err
      navigate('/dashboard')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!allConsented) { setError('Please accept all required agreements to continue.'); return }
    setLoading(true)
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName, role: 'parent', child_name: form.childName } }
      })
      if (signUpErr) throw signUpErr
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, full_name: form.fullName, role: 'parent',
          email: form.email, child_name: form.childName,
          consent_privacy: true, consent_terms: true, consent_data: true,
          consent_date: new Date().toISOString(),
        })
      }
      setSuccess('Account created! Please check your email to verify, then sign in.')
      setStep(1); setMode('login')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.wrapper}>
        <div style={styles.panel} className="card card-elevated">
          <div style={styles.header}>
            <div style={styles.iconBadge}>👨‍👩‍👧</div>
            <h2 style={styles.title}>{mode === 'login' ? 'Parent Sign In' : step === 1 ? 'Parent Sign Up' : 'Agreements & Consent'}</h2>
            <p style={styles.subtitle}>
              {mode === 'login' ? 'Monitor your child\'s PSLE preparation.' : step === 1 ? 'Create your parent account.' : 'Please read and accept the following before creating your account.'}
            </p>
          </div>

          <div style={styles.tabs}>
            <button className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('login'); setStep(1); setError('') }}>Sign In</button>
            <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('signup'); setStep(1); setError('') }}>Sign Up</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Step 1: Account details */}
          {step === 1 && (
            <form onSubmit={handleStep1}>
              {mode === 'signup' && (
                <>
                  <div className="form-group">
                    <label>Your Full Name</label>
                    <input type="text" placeholder="e.g. Mosadi Moyo" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Child's First Name</label>
                    <input type="text" placeholder="e.g. Lorato" value={form.childName} onChange={e => set('childName', e.target.value)} required />
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="parent@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
              </div>
              <button type="submit" className="btn btn-primary btn-full mt-2" disabled={loading}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Next: Review Agreements →'}
              </button>
            </form>
          )}

          {/* Step 2: Consent */}
          {step === 2 && mode === 'signup' && (
            <form onSubmit={handleSignup}>
              <div className="alert alert-gold" style={{ marginBottom: 20 }}>
                <strong>⚠️ Required under Botswana Data Protection Act 2018</strong><br />
                <span style={{ fontSize: '0.85rem' }}>As a parent/guardian registering a minor, you must explicitly consent to the following.</span>
              </div>

              <div className="checkbox-group">
                <input type="checkbox" id="privacy" checked={consent.privacy} onChange={() => setC('privacy')} />
                <label htmlFor="privacy">
                  I have read and agree to the{' '}
                  <a href="#privacy-policy" onClick={e => e.preventDefault()}>Privacy Policy</a>.
                  I understand how my child's data is collected and used.
                </label>
              </div>

              <div className="checkbox-group">
                <input type="checkbox" id="terms" checked={consent.terms} onChange={() => setC('terms')} />
                <label htmlFor="terms">
                  I agree to the{' '}
                  <a href="#terms" onClick={e => e.preventDefault()}>Terms of Use</a>.
                  I confirm I am the parent or legal guardian of the student.
                </label>
              </div>

              <div className="checkbox-group">
                <input type="checkbox" id="dataConsent" checked={consent.dataConsent} onChange={() => setC('dataConsent')} />
                <label htmlFor="dataConsent">
                  I give consent for my child's learning data (quiz scores, progress, session history) 
                  to be stored securely and used to personalise their revision experience. 
                  I may withdraw this consent at any time by contacting support.
                </label>
              </div>

              <div style={{ background: 'var(--ivory)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 20, fontSize: '0.83rem', color: 'var(--charcoal-lt)', lineHeight: 1.6 }}>
                <strong>Summary of your rights:</strong> You may access, correct, or request deletion of your child's data at any time. 
                Data is stored on servers in South Africa (Cape Town region). 
                We do not sell personal data to third parties. Contact: privacy@pslerevisionpro.co.bw
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading || !allConsented}>
                  {loading ? 'Creating account…' : 'Create Account →'}
                </button>
              </div>
            </form>
          )}

          <div className="divider">or</div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--charcoal-lt)' }}>
            Student? <Link to="/student-auth" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>Student Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  panel: { width: '100%', maxWidth: 480, padding: '40px' },
  header: { textAlign: 'center', marginBottom: 28 },
  iconBadge: { fontSize: '2.4rem', marginBottom: 12 },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--forest)', marginBottom: 6 },
  subtitle: { color: 'var(--charcoal-lt)', fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, background: 'var(--ivory)', borderRadius: 'var(--radius-sm)', padding: 4 },
}
