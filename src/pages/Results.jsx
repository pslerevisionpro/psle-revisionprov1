import { useLocation, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function getGrade(pct) {
  if (pct >= 80) return { grade: 'A', label: 'Excellent!',            color: '#27AE60', emoji: '🏆' }
  if (pct >= 65) return { grade: 'B', label: 'Good work!',            color: '#2980B9', emoji: '🎯' }
  if (pct >= 50) return { grade: 'C', label: 'Keep going!',           color: '#E67E22', emoji: '💪' }
  return           { grade: 'D', label: 'More practice needed',  color: '#C0392B', emoji: '📚' }
}

function getMessage(pct, isGuest) {
  if (isGuest) {
    if (pct >= 70) return "Great start! Imagine what you could do with full access and progress tracking."
    return "Good effort on the trial! A full account unlocks all questions and shows you exactly where to improve."
  }
  if (pct >= 80) return "Outstanding performance. Keep this standard and you're on track for excellent PSLE results."
  if (pct >= 65) return "Solid work! Review the questions you missed — that's where your next improvement comes from."
  if (pct >= 50) return "A fair attempt. Go through the explanations below carefully, then try again."
  return "Don't be discouraged. Every attempt builds knowledge. Read each explanation, then retry."
}

// ── Skipped Question Review ──────────────────────────────────
function SkippedReview({ answers, questions }) {
  const skipped = answers.filter(a => a.selected === null || a.selected === undefined)
  if (skipped.length === 0) return null

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#E67E22', marginBottom: 6 }}>
        🚩 Skipped Questions ({skipped.length})
      </h2>
      <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.88rem', marginBottom: 20 }}>
        These questions were left unanswered. Review them so you know what to focus on next time.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {skipped.map((a, i) => {
          const q = questions?.find(q => q.id === a.questionId)
          if (!q) return null
          const correctOptionText = q.options?.[q.correct] ?? '—'
          return (
            <div key={i} style={{ ...r.wrongCard, borderColor: '#FFB74D', boxShadow: '0 2px 8px rgba(230,126,34,0.08)' }}>
              <div style={r.wrongCardHeader}>
                <div style={r.wrongCardLeft}>
                  <span style={r.wrongNum}>Q{i + 1}</span>
                  {q.subject_area && <span style={r.wrongTopic}>{q.subject_area}</span>}
                </div>
                <span style={{ ...r.wrongBadge, color: '#E67E22', background: '#FFF3E0' }}>🚩 Skipped</span>
              </div>
              {q.context_text && (
                <div style={r.contextBox}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--forest)', marginBottom: 6 }}>📖 Passage</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--charcoal)', lineHeight: 1.7, whiteSpace: 'pre-line', maxHeight: 200, overflowY: 'auto' }}>{q.context_text}</div>
                </div>
              )}
              <p style={r.questionText}>{q.question}</p>
              <div style={{ background: '#eafaf1', border: '1.5px solid var(--success)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Correct answer</p>
                <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--success)' }}>✓ {correctOptionText}</p>
              </div>
              {q.explanation && (
                <div style={r.explanationBox}>
                  <p style={r.explanationTitle}>💡 Explanation</p>
                  <p style={r.explanationText}>{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Wrong Answer Review ───────────────────────────────────────
function WrongAnswerReview({ answers, questions }) {
  const wrongAnswers = answers.filter(a => !a.correct)

  if (wrongAnswers.length === 0) {
    return (
      <div style={r.perfectBox}>
        <p style={{ fontSize:'2rem', marginBottom:8 }}>🎉</p>
        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--forest)', marginBottom:4 }}>
          Perfect score!
        </p>
        <p style={{ color:'var(--charcoal-lt)', fontSize:'0.88rem' }}>
          You got every question right. Try another subject to keep building.
        </p>
      </div>
    )
  }

  // Group wrong answers by topic
  const byTopic = {}
  wrongAnswers.forEach(a => {
    const q = questions?.find(q => q.id === a.questionId)
    const topic = q?.subject_area || 'General Science'
    if (!byTopic[topic]) byTopic[topic] = []
    byTopic[topic].push({ ...a, question: q })
  })

  return (
    <div>
      {/* Topic summary */}
      <div style={r.topicSummary}>
        <p style={r.topicSummaryTitle}>📌 Topics to revise</p>
        <div style={r.topicChips}>
          {Object.keys(byTopic).map(topic => (
            <span key={topic} style={r.topicChip}>
              {topic} · {byTopic[topic].length} missed
            </span>
          ))}
        </div>
      </div>

      {/* Wrong answer cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {wrongAnswers.map((a, i) => {
          const q = questions?.find(q => q.id === a.questionId)
          if (!q) return null

          const correctOptionText = q.options?.[q.correct] ?? '—'
          const selectedOptionText = a.selected !== null ? (q.options?.[a.selected] ?? '—') : '—'

          return (
            <div key={i} style={r.wrongCard}>
              {/* Header */}
              <div style={r.wrongCardHeader}>
                <div style={r.wrongCardLeft}>
                  <span style={r.wrongNum}>Q{i + 1}</span>
                  {q.subject_area && <span style={r.wrongTopic}>{q.subject_area}</span>}
                  {q.blooms_level && <span style={r.wrongBloom}>{q.blooms_level}</span>}
                </div>
                <span style={r.wrongBadge}>✗ Incorrect</span>
              </div>

              {/* Question text */}
              {q.context_text && (
                <div style={r.contextBox}>📖 {q.context_text}</div>
              )}
              <p style={r.questionText}>{q.question}</p>

              {/* Answer comparison */}
              <div style={r.answerComparison}>
                <div style={r.answerBox}>
                  <p style={r.answerLabel}>Your answer</p>
                  <p style={r.answerWrong}>✗ {selectedOptionText}</p>
                </div>
                <div style={{ ...r.answerBox, borderColor:'var(--success)', background:'#eafaf1' }}>
                  <p style={r.answerLabel}>Correct answer</p>
                  <p style={r.answerCorrect}>✓ {correctOptionText}</p>
                </div>
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div style={r.explanationBox}>
                  <p style={r.explanationTitle}>💡 Explanation</p>
                  <p style={r.explanationText}>{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Results() {
  const location = useLocation()
  const navigate  = useNavigate()
  const state     = location.state

  if (!state) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ textAlign:'center', padding:'80px 24px' }}>
          <h2 style={{ fontFamily:'var(--font-display)', color:'var(--forest)', fontSize:'1.8rem' }}>
            No results to display.
          </h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop:20 }}>Go Home</Link>
        </div>
      </div>
    )
  }

  const { score, total, pct, subject, answers, questions, isGuest } = state
  const gradeInfo = getGrade(pct)
  const message   = getMessage(pct, isGuest)
  const skippedCount = answers?.filter(a => a.selected === null || a.selected === undefined).length ?? 0
  const wrongCount   = answers?.filter(a => !a.correct && a.selected !== null && a.selected !== undefined).length ?? 0

  if (isGuest) {
    sessionStorage.removeItem('rp_guest_mode')
    sessionStorage.removeItem('rp_guest_start')
  }

  return (
    <div className="page-container">
      <Navbar />

      {/* Hero */}
      <div style={styles.hero}>
        <div className="content-wrapper" style={{ textAlign:'center' }}>
          <div style={styles.emoji}>{gradeInfo.emoji}</div>
          <h1 style={styles.gradeLabel}>{gradeInfo.label}</h1>
          <div style={styles.scoreDisplay}>
            <span style={{ ...styles.scoreBig, color:gradeInfo.color }}>{pct}%</span>
            <span style={styles.scoreDetail}>({score} / {total} correct)</span>
          </div>
          <div style={{ ...styles.gradeBadge, background:gradeInfo.color }}>Grade {gradeInfo.grade}</div>
          <p style={styles.message}>{message}</p>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop:40, paddingBottom:60, maxWidth:760 }}>

        {isGuest ? (
          /* ── Guest conversion block ── */
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
                  <li>✅ All questions per subject</li>
                  <li>✅ 6 PSLE subjects covered</li>
                  <li>✅ Progress tracking over time</li>
                  <li>✅ Wrong answer review with explanations</li>
                  <li>✅ Your own parent dashboard</li>
                  <li>✅ You stay in full control of their data</li>
                </ul>
                <p style={styles.conversionNote}>
                  <strong>Free plan available.</strong> No credit card required to start.
                  As a parent or guardian, you create the account and give consent —
                  keeping you fully in control under the Botswana Data Protection Act 2018.
                </p>
                <div style={styles.conversionButtons}>
                  <Link to="/parent-auth" className="btn btn-primary" style={{ fontSize:'1rem', padding:'14px 28px' }}>
                    Create Account as Parent →
                  </Link>
                  <Link to="/tutor-auth" className="btn btn-outline btn-sm">I'm a Tutor</Link>
                </div>
              </div>
              <div style={styles.conversionRight}>
                <div style={styles.conversionScore}>
                  <span style={styles.conversionScoreBig}>{pct}%</span>
                  <span style={styles.conversionScoreLabel}>Trial Score</span>
                  <div style={styles.conversionScoreSubject}>🔬 {subject}</div>
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
                onClick={() => { sessionStorage.setItem('rp_guest_mode','true'); navigate('/quiz/science?guest=true') }}
                className="btn btn-ghost btn-sm"
              >← Try the quiz again</button>
              <Link to="/" className="btn btn-ghost btn-sm">Go to Home</Link>
            </div>
          </div>

        ) : (
          /* ── Logged-in results ── */
          <>
            {/* Action buttons */}
            <div style={styles.actions}>
            <Link to="/subjects" className="btn btn-primary" style={{ padding:'13px 28px' }}>
  📚 Choose Next Subject →
</Link>
              <Link to="/dashboard" className="btn btn-ghost" style={{ padding:'13px 28px' }}>
                🏠 Dashboard
              </Link>
            </div>

            {/* Stats row */}
            <div style={styles.statsRow}>
              <StatBox label="Score"    value={`${score}/${total}`}  icon="✅" />
              <StatBox label="Accuracy" value={`${pct}%`}            icon="🎯" />
              <StatBox label="Grade"    value={gradeInfo.grade}       icon="📋" />
              <StatBox label="Missed"   value={wrongCount}            icon="📝" />
              <StatBox label="Skipped"  value={skippedCount}          icon="🚩" />
            </div>

            {/* Wrong answer review */}
            <div style={{ marginTop:40 }}>
              <div style={styles.reviewHeader}>
                <div>
                  <h2 style={styles.reviewTitle}>
                    {wrongCount === 0 && skippedCount === 0 ? '✅ All Correct!' : `📖 Wrong Answers (${wrongCount})`}
                  </h2>
                  <p style={styles.reviewSubtitle}>
                    {wrongCount === 0 && skippedCount === 0
                      ? 'Perfect score — nothing to review.'
                      : 'Read each explanation carefully. Understanding why you were wrong is how you improve.'}
                  </p>
                </div>
              </div>
              <WrongAnswerReview answers={answers ?? []} questions={questions ?? []} />
              <SkippedReview answers={answers ?? []} questions={questions ?? []} />
            </div>

            {/* What to do next */}
            <div style={styles.recommendation}>
              <h3 style={styles.recTitle}>📌 What to do next</h3>
              {pct >= 80 ? (
                <ul style={styles.recList}>
                  <li>Try another subject to keep building momentum.</li>
                  <li>Challenge yourself with the timed mock exam when available.</li>
                </ul>
              ) : pct >= 50 ? (
                <ul style={styles.recList}>
                  <li>Re-read the explanations for the questions you missed above.</li>
                  <li>Re-attempt this quiz in 24 hours to test your retention.</li>
                  <li>Check your dashboard for your weakest topics to focus on.</li>
                </ul>
              ) : (
                <ul style={styles.recList}>
                  <li>Go through each explanation above carefully before retrying.</li>
                  <li>Ask your teacher or tutor about topics you found difficult.</li>
                  <li>Check your dashboard — the weak areas panel shows what to focus on.</li>
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
    <div className="card" style={{ textAlign:'center', padding:'20px 16px' }}>
      <div style={{ fontSize:'1.4rem', marginBottom:6 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, color:'var(--forest)', marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:'0.75rem', color:'var(--charcoal-lt)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  hero:                  { background:'var(--forest)', padding:'60px 0 56px' },
  emoji:                 { fontSize:'3rem', marginBottom:12 },
  gradeLabel:            { fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'var(--sage-lt)', marginBottom:16, fontWeight:400 },
  scoreDisplay:          { display:'flex', alignItems:'baseline', justifyContent:'center', gap:12, marginBottom:16 },
  scoreBig:              { fontFamily:'var(--font-display)', fontSize:'4rem', fontWeight:700 },
  scoreDetail:           { color:'rgba(245,240,232,0.6)', fontSize:'1.1rem' },
  gradeBadge:            { display:'inline-block', color:'white', fontWeight:700, padding:'6px 18px', borderRadius:100, fontSize:'0.9rem', letterSpacing:'0.04em', marginBottom:20 },
  message:               { maxWidth:500, margin:'0 auto', color:'rgba(245,240,232,0.7)', fontSize:'0.97rem', lineHeight:1.7 },
  conversionBlock:       { marginBottom:40 },
  conversionTop:         { textAlign:'center', marginBottom:20 },
  conversionBadge:       { display:'inline-block', background:'var(--gold)', color:'var(--forest)', fontWeight:700, padding:'8px 20px', borderRadius:100, fontSize:'0.9rem' },
  conversionCard:        { background:'var(--white)', border:'2px solid var(--forest)', borderRadius:'var(--radius-lg)', padding:'36px', display:'flex', gap:32, flexWrap:'wrap', boxShadow:'var(--shadow-lg)' },
  conversionLeft:        { flex:2, minWidth:260 },
  conversionTitle:       { fontFamily:'var(--font-display)', fontSize:'1.6rem', color:'var(--forest)', marginBottom:12, lineHeight:1.3 },
  conversionDesc:        { color:'var(--charcoal-lt)', fontSize:'0.93rem', marginBottom:16, lineHeight:1.6 },
  conversionList:        { paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8, marginBottom:20, fontSize:'0.92rem', color:'var(--charcoal)', lineHeight:1.5 },
  conversionNote:        { fontSize:'0.85rem', color:'var(--charcoal-lt)', lineHeight:1.65, marginBottom:24, background:'var(--ivory)', padding:'12px 16px', borderRadius:'var(--radius-sm)', borderLeft:'3px solid var(--sage)' },
  conversionButtons:     { display:'flex', gap:12, flexWrap:'wrap' },
  conversionRight:       { flex:1, minWidth:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--ivory)', borderRadius:'var(--radius-md)', padding:'28px 20px', textAlign:'center' },
  conversionScore:       { display:'flex', flexDirection:'column', alignItems:'center', marginBottom:12 },
  conversionScoreBig:    { fontFamily:'var(--font-display)', fontSize:'3.5rem', fontWeight:700, color:'var(--forest)', lineHeight:1 },
  conversionScoreLabel:  { fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--charcoal-lt)', marginTop:4 },
  conversionScoreSubject:{ marginTop:10, background:'var(--forest)', color:'var(--gold-lt)', padding:'4px 12px', borderRadius:100, fontSize:'0.8rem', fontWeight:600 },
  conversionScoreNote:   { fontSize:'0.82rem', color:'var(--charcoal-lt)', lineHeight:1.55 },
  conversionFooter:      { display:'flex', gap:12, justifyContent:'center', marginTop:20 },
  actions:               { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:28 },
  statsRow:              { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14 },
  reviewHeader:          { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  reviewTitle:           { fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'var(--forest)', marginBottom:6 },
  reviewSubtitle:        { color:'var(--charcoal-lt)', fontSize:'0.88rem' },
  recommendation:        { background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:'var(--radius-md)', padding:'24px 28px', marginTop:28 },
  recTitle:              { fontFamily:'var(--font-display)', fontSize:'1.25rem', color:'var(--forest)', marginBottom:14 },
  recList:               { paddingLeft:20, display:'flex', flexDirection:'column', gap:8, color:'var(--charcoal-lt)', fontSize:'0.93rem', lineHeight:1.65 },
}

// Wrong answer review styles
const r = {
  perfectBox:       { textAlign:'center', padding:'40px 24px', background:'var(--white)', border:'1px solid var(--ivory-dk)', borderRadius:16 },
  topicSummary:     { background:'#FFF8F0', border:'1px solid #F5D5A8', borderRadius:12, padding:'14px 18px', marginBottom:20 },
  topicSummaryTitle:{ fontSize:'0.82rem', fontWeight:700, color:'#E67E22', marginBottom:10 },
  topicChips:       { display:'flex', flexWrap:'wrap', gap:8 },
  topicChip:        { background:'#E67E22', color:'white', padding:'4px 12px', borderRadius:100, fontSize:'0.75rem', fontWeight:600 },
  wrongCard:        { background:'var(--white)', border:'1.5px solid #FFD9D9', borderRadius:14, padding:'20px 24px', boxShadow:'0 2px 8px rgba(192,57,43,0.06)' },
  wrongCardHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  wrongCardLeft:    { display:'flex', alignItems:'center', gap:8 },
  wrongNum:         { fontWeight:700, fontSize:'0.85rem', color:'var(--charcoal)', background:'var(--ivory)', padding:'3px 10px', borderRadius:20 },
  wrongTopic:       { fontSize:'0.72rem', fontWeight:700, color:'var(--forest)', background:'#eef7f4', padding:'3px 10px', borderRadius:20 },
  wrongBloom:       { fontSize:'0.7rem', color:'#AAA', background:'#F5F5F5', padding:'3px 8px', borderRadius:20 },
  wrongBadge:       { fontSize:'0.78rem', fontWeight:700, color:'var(--error)', background:'#fdecea', padding:'4px 12px', borderRadius:100 },
  contextBox:       { background:'#F0F7FF', border:'1px solid #C7D9F5', borderLeft:'4px solid var(--forest)', borderRadius:'0 8px 8px 0', padding:'14px 16px', marginBottom:14 },
  questionText:     { fontSize:'1rem', fontWeight:600, color:'var(--charcoal)', lineHeight:1.5, marginBottom:16 },
  answerComparison: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 },
  answerBox:        { border:'1.5px solid #FFD9D9', borderRadius:10, padding:'10px 14px', background:'#FFF8F8' },
  answerLabel:      { fontSize:'0.7rem', fontWeight:700, color:'#AAA', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 },
  answerWrong:      { fontSize:'0.88rem', fontWeight:600, color:'var(--error)', lineHeight:1.4 },
  answerCorrect:    { fontSize:'0.88rem', fontWeight:600, color:'var(--success)', lineHeight:1.4 },
  explanationBox:   { background:'linear-gradient(135deg,#eef7f4 0%,#f5f0e8 100%)', borderRadius:10, padding:'14px 16px', borderLeft:'4px solid var(--forest-lt)' },
  explanationTitle: { fontSize:'0.78rem', fontWeight:700, color:'var(--forest)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' },
  explanationText:  { fontSize:'0.88rem', color:'var(--charcoal-lt)', lineHeight:1.7 },
}
