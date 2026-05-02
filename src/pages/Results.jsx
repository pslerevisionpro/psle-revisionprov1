import { useLocation, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function getGrade(pct) {
  if (pct >= 80) return { grade: 'A', label: 'Excellent!', color: '#27AE60', emoji: '🏆' }
  if (pct >= 65) return { grade: 'B', label: 'Good work!', color: '#2980B9', emoji: '🎯' }
  if (pct >= 50) return { grade: 'C', label: 'Keep going!', color: '#E67E22', emoji: '💪' }
  return { grade: 'D', label: 'More practice needed', color: '#C0392B', emoji: '📚' }
}

function getMessage(pct) {
  if (pct >= 80) return "Outstanding performance. You have a strong grasp of this topic. Keep this standard up and you're on track for excellent PSLE results."
  if (pct >= 65) return "Solid work! You understand most of the material. Review the questions you missed and you'll be ready to ace this subject."
  if (pct >= 50) return "A fair attempt. You're on the right track but there are some gaps to fill. Go through the explanations again and re-quiz yourself."
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
          <Link to="/subjects" className="btn btn-primary" style={{ marginTop: 20 }}>Go to Subjects</Link>
        </div>
      </div>
    )
  }

  const { score, total, pct, subject, answers } = state
  const gradeInfo = getGrade(pct)
  const message = getMessage(pct)

  return (
    <div className="page-container">
      <Navbar />

      {/* Hero result */}
      <div style={styles.hero}>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          <div style={styles.emoji}>{gradeInfo.emoji}</div>
          <h1 style={styles.gradeLabel}>{gradeInfo.label}</h1>
          <div style={styles.scoreDisplay}>
            <span style={{ ...styles.scoreBig, color: gradeInfo.color }}>{pct}%</span>
            <span style={styles.scoreDetail}>({score} / {total} correct)</span>
          </div>
          <div style={{ ...styles.gradeBadge, background: gradeInfo.color }}>
            Grade {gradeInfo.grade}
          </div>
          <p style={styles.message}>{message}</p>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760 }}>
        {/* Actions */}
        <div style={styles.actions}>
          <Link to="/quiz/science" className="btn btn-primary" style={{ padding: '13px 28px' }}>
            🔄 Retry Quiz
          </Link>
          <Link to="/subjects" className="btn btn-outline" style={{ padding: '13px 28px' }}>
            📚 Choose Subject
          </Link>
          <Link to="/dashboard" className="btn btn-ghost" style={{ padding: '13px 28px' }}>
            🏠 Dashboard
          </Link>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <StatBox label="Score" value={`${score}/${total}`} icon="✅" />
          <StatBox label="Accuracy" value={`${pct}%`} icon="🎯" />
          <StatBox label="Grade" value={gradeInfo.grade} icon="📋" />
          <StatBox label="Subject" value={subject} icon="🔬" />
        </div>

        {/* Question review */}
        <div style={{ marginTop: 40 }}>
          <h2 style={styles.reviewTitle}>Question Review</h2>
          <p style={styles.reviewSubtitle}>See how you did on each question. Use this to guide your next revision session.</p>
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

        {/* Recommendation */}
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
              <li>Focus on the topics linked to your incorrect answers.</li>
            </ul>
          ) : (
            <ul style={styles.recList}>
              <li>Go through each explanation carefully before retrying.</li>
              <li>Ask your teacher or tutor about topics you found difficult.</li>
              <li>Try the quiz again after reviewing your notes.</li>
            </ul>
          )}
        </div>
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
  actions: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 },
  reviewTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--forest)', marginBottom: 6 },
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
