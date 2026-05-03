import { useLocation, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function getGrade(pct) {
  if (pct >= 80) return { grade: 'A', label: 'Excellent!', color: '#27AE60', emoji: '🏆' }
  if (pct >= 65) return { grade: 'B', label: 'Good work!', color: '#2980B9', emoji: '🎯' }
  if (pct >= 50) return { grade: 'C', label: 'Keep going!', color: '#E67E22', emoji: '💪' }
  return { grade: 'D', label: 'More practice needed', color: '#C0392B', emoji: '📚' }
}

function getMessage(pct, isGuest) {
  if (isGuest) {
    if (pct >= 70) return "Great start! You clearly have good knowledge — imagine what you could do with all 10 questions and full progress tracking."
    return "Good effort on the trial! With a full account you can practice more questions, see where you need to improve, and track your progress over time."
  }
  if (pct >= 80) return "Outstanding performance. You have a strong grasp of this topic. Keep this standard up and you're on track for excellent PSLE results."
  if (pct >= 65) return "Solid work! You understand most of the material. Review the questions you missed and you'll be ready to ace this subject."
  if (pct >= 50) return "A fair attempt. You're on the right track but there are some gaps to fill. Go through the explanations and re-quiz yourself."
  return "Don't be discouraged. Every attempt builds knowledge. Read through the explanations carefully, then try again — you'll improve."
}

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state

  if (!state) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--forest)', fontSize: '1.8rem' }}>No results to display.</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Go Home</Link>
        </div>
      </div>
    )
  }

  const { score, total, pct, subject, answers, isGuest } = state
  const gradeInfo = getGrade(pct)
  const message = getMessage(pct, isGuest)

  if (isGuest) {
    sessionStorage.removeItem('rp_guest_mode')
    sessionStorage.removeItem('rp_guest_start')
  }

  return (
    <div className="page-container">
      <Navbar />

      <div style={styles.hero}>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          <div style={styles.emoji}>{gradeInfo.emoji}</div>
          <h1 style={styles.gradeLabel}>{gradeInfo.label}</h1>
          <div style={styles.scoreDisplay}>
            <span style={{ ...styles.scoreBig, color: gradeInfo.color }}>{pct}%</span>
            <span style={styles.scoreDetail}>({score} / {total} correct)</span>
          </div>
          <div style={{ ...styles.gradeBadge, background: gradeInfo.color }}>Grade {gradeInfo.grade}</div>
          <p style={styles.message}>{message}</p>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760 }}>

        {isGuest ? (
          <div style={styles.conversionBlock}>
            <div style={styles.conversionTop}>
              <span style={styles.conversionBadge}>👇 Show this to your parent or guardian</span>
            </div>

            <div style={styles.conversionCard}>
              <div style={styles.conversionLeft}>
                <h2 style={styles.conversionTitle}>
                  Your child just scored {pct}% on a PSLE Science trial.
                </h2>
                <p style={styles.conversionDesc}>
                  This was just 3 free questions — no account, no data collected.
                  With a full account you can unlock:
                </p>
                <ul style={styles.conversionList}>
                  <li>✅ All 10 questions per subject</li>
                  <li>✅ 6 PSLE subjects covered</li>
                  <li>✅ Progress tracking over time</li>
                  <li>✅ Your own parent dashboard</li>
                  <li>✅ Mock exam simulator</li>
                  <li>✅ You stay in full control of their data</li>
                </ul>
                <p style={styles.conversionNote}>
                  <strong>Free plan available.</strong> No credit card required to start.
                  As a parent or guardian, you create the account and give consent —
                  keeping you fully in control under the Botswana Data Protection Act 2018.
                </p>
                <div style={styles.conversionButtons}>
                  <Link to="/parent-auth" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }}>
                    Create Account as Parent →
                  </Link>
                  <Link to="/tutor-auth" className="btn btn-outline btn-sm">I'm a Tutor</Link>
                </div>
              </div>

              <div style={styles.conversionRight}>
                <div style={styles.conversionScore}>
                  <span style={styles.conversionScoreBig}>{pct}%</span>
                  <span style={styles.conversionScoreLabel}>Trial Score</span>
                  <div style={styles.conversionScoreSubject}>🔬 Science</div>
                </div>
                <p style={styles.conversionScoreNote}>
                  {pct >= 70
                    ? 'Strong start! Full practice will push this even higher.'
                    : 'Room to grow. Regular practice makes a big difference.'}
                </p>
              </div>
            </div>

            <div style={styles.conversionFooter}>
              <button
                onClick={() => {
                  sessionStorage.setItem('rp_guest_mode', 'true')
                  navigate('/quiz/science?guest=true')
                }}
                className="btn btn-ghost btn-sm"
              >
                ← Try the quiz again
              </button>
              <Link to="/" className="btn btn-ghost btn-sm">Go to Home</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.actions}>
              <Link to="/quiz/science" className="btn btn-primary" style={{ padding: '13px 28px' }}>🔄 Retry Quiz</Link>
              <Link to="/subjects" className="btn btn-outline" style={{ padding: '13px 28px' }}>📚 Choose Subject</Link>
              <Link to="/dashboard" className="btn btn-ghost" style={{ padding: '13px 28px' }}>🏠 Dashboard</Link>
            </div>

            <div style={styles.statsRow}>
              <StatBox label="Score" value={`${score}/${total}`} icon="✅" />
              <StatBox label="Accuracy" value={`${pct}%`} icon="🎯" />
              <StatBox label="Grade" value={gradeInfo.grade} icon="📋" />
              <StatBox label="Subject" value={subject} icon="🔬" />
            </div>

            <div style={{ marginTop: 40 }}>
              <h2 style={styles.reviewTitle}>Question Review</h2>
              <p style={styles.reviewSubtitle}>Use this to guide your next revision session.</p>
              <div style={styles.reviewList}>
                {answers.map((a, i) => (
                  <div key={i} style={{ ...styles.reviewItem, borderLeftColor: a.correct ? 'var(--success)' : 'var(--error)' }}>
                    <div style={styles.reviewTop}>
                      <span style={styles.reviewNum}>Q{i + 1}</span>
                      <span style={{ ...styles.reviewResult, color: a.correct ? 'var(--success)' : 'var(--error)' }}>
                        {a.correct ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.recommendation}>
              <h3 style={styles.recTitle}>📌 What to do next</h3>
              {pct >= 80 ? (
                <ul style={styles.recList}>
                  <li>Try another subject to keep building momentum.</li>
                  <li>Challenge yourself with the timed mock exam when available.</li>
                </ul>
              ) : pct >= 50 ? (
                <ul style={styles.recList}>
                  <li>Re-read the explanations for the questions you missed.</li>
                  <li>Re-attempt this quiz in 24 hours to test your retention.</li>
                </ul>
              ) : (
                <ul style={styles.recList}>
                  <li>Go through each explanation carefully before retrying.</li>
                  <li>Ask your teacher or tutor about topics you found difficult.</li>
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, icon }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--forest)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-lt)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

const styles = {
  hero: { background: 'var(--forest)', padding: '60px 0 56px' },
  emoji: { fontSize: '3rem', marginBottom: 12 },
  gradeLabel: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--sage-lt)', marginBottom: 16, fontWeight: 400 },
  scoreDisplay: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, marginBottom: 16 },
  scoreBig: { fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 700 },
  scoreDetail: { color: 'rgba(245,240,232,0.6)', fontSize: '1.1rem' },
  gradeBadge: { display: 'inline-block', color: 'white', fontWeight: 700, padding: '6px 18px', borderRadius: 100, fontSize: '0.9rem', letterSpacing: '0.04em', marginBottom: 20 },
  message: { maxWidth: 500, margin: '0 auto', color: 'rgba(245,240,232,0.7)', fontSize: '0.97rem', lineHeight: 1.7 },
  conversionBlock: { marginBottom: 40 },
  conversionTop: { textAlign: 'center', marginBottom: 20 },
  conversionBadge: { display: 'inline-block', background: 'var(--gold)', color: 'var(--forest)', fontWeight: 700, padding: '8px 20px', borderRadius: 100, fontSize: '0.9rem' },
  conversionCard: { background: 'var(--white)', border: '2px solid var(--forest)', borderRadius: 'var(--radius-lg)', padding: '36px', display: 'flex', gap: 32, flexWrap: 'wrap', boxShadow: 'var(--shadow-lg)' },
  conversionLeft: { flex: 2, minWidth: 260 },
  conversionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--forest)', marginBottom: 12, lineHeight: 1.3 },
  conversionDesc: { color: 'var(--charcoal-lt)', fontSize: '0.93rem', marginBottom: 16, lineHeight: 1.6 },
  conversionList: { paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, fontSize: '0.92rem', color: 'var(--charcoal)', lineHeight: 1.5 },
  conversionNote: { fontSize: '0.85rem', color: 'var(--charcoal-lt)', lineHeight: 1.65, marginBottom: 24, background: 'var(--ivory)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--sage)' },
  conversionButtons: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  conversionRight: { flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)', borderRadius: 'var(--radius-md)', padding: '28px 20px', textAlign: 'center' },
  conversionScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 },
  conversionScoreBig: { fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, color: 'var(--forest)', lineHeight: 1 },
  conversionScoreLabel: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal-lt)', marginTop: 4 },
  conversionScoreSubject: { marginTop: 10, background: 'var(--forest)', color: 'var(--gold-lt)', padding: '4px 12px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600 },
  conversionScoreNote: { fontSize: '0.82rem', color: 'var(--charcoal-lt)', lineHeight: 1.55 },
  conversionFooter: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 },
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 },
  reviewTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--forest)', marginBottom: 6, marginTop: 40 },
  reviewSubtitle: { color: 'var(--charcoal-lt)', fontSize: '0.88rem', marginBottom: 20 },
  reviewList: { display: 'flex', flexDirection: 'column', gap: 8 },
  reviewItem: { background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderLeft: '4px solid', borderRadius: 'var(--radius-sm)', padding: '12px 16px' },
  reviewTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reviewNum: { fontWeight: 700, color: 'var(--charcoal)', fontSize: '0.9rem' },
  reviewResult: { fontWeight: 700, fontSize: '0.85rem' },
  recommendation: { background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderRadius: 'var(--radius-md)', padding: '24px 28px', marginTop: 28 },
  recTitle: { fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--forest)', marginBottom: 14 },
  recList: { paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--charcoal-lt)', fontSize: '0.93rem', lineHeight: 1.65 },
}
