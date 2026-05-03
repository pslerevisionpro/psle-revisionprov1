import { useState, useRef, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { scienceQuestions } from '../data/scienceQuestions'
import Navbar from '../components/Navbar'

const QUIZ_CONFIGS = {
  science: { name: 'Science', emoji: '🔬', questions: scienceQuestions },
}

const GUEST_LIMIT = 3

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle answer options but track where the correct answer moved to
function shuffleOptions(question) {
  const indexed = question.options.map((text, i) => ({ text, isCorrect: i === question.correct }))
  const shuffled = shuffle(indexed)
  return {
    ...question,
    options: shuffled.map(o => o.text),
    correct: shuffled.findIndex(o => o.isCorrect),
  }
}

export default function Quiz() {
  const { subject } = useParams()
  const [searchParams] = useSearchParams()
  const isGuest = searchParams.get('guest') === 'true' || sessionStorage.getItem('rp_guest_mode') === 'true'

  const config = QUIZ_CONFIGS[subject]
  const { session } = useAuth()
  const navigate = useNavigate()

  // Randomize once per quiz session using useMemo
  const questions = useMemo(() => {
    if (!config) return []
    const pool = isGuest ? config.questions.slice(0, GUEST_LIMIT * 2) : config.questions
    const picked = shuffle(pool).slice(0, isGuest ? GUEST_LIMIT : pool.length)
    return picked.map(shuffleOptions)
  }, [])

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [showExplanation, setShowExplanation] = useState(false)
  const explanationRef = useRef(null)

  if (!config) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--forest)', fontSize: '1.8rem' }}>Subject not found</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Go Home</Link>
        </div>
      </div>
    )
  }

  const question = questions[current]
  const isLast = current === questions.length - 1

  function handleSelect(optionIndex) {
    if (revealed) return
    const isCorrect = optionIndex === question.correct
    setSelected(optionIndex)
    setRevealed(true)
    setShowExplanation(false)
    setTimeout(() => {
      setShowExplanation(true)
      setTimeout(() => explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }, 400)
    // Record answer immediately when selected
    setAnswers(prev => [...prev, { questionId: question.id, selected: optionIndex, correct: isCorrect }])
  }

  async function handleNext() {
    if (isLast) {
      // answers already includes this question — no double counting
      const score = answers.filter(a => a.correct).length
      const pct = Math.round((score / questions.length) * 100)

      if (session && !isGuest) {
        await supabase.from('quiz_results').insert({
          user_id: session.user.id,
          subject: config.name,
          score,
          total: questions.length,
          pct,
        })
      }

      navigate('/results', {
        state: { score, total: questions.length, pct, subject: config.name, answers, isGuest }
      })
      return
    }
    setCurrent(c => c + 1)
    setSelected(null)
    setRevealed(false)
    setShowExplanation(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const progress = (current / questions.length) * 100

  return (
    <div className="page-container">
      <Navbar />

      {isGuest && (
        <div style={styles.guestBanner}>
          <div className="content-wrapper" style={styles.guestBannerInner}>
            <span>🎮 <strong>Free Trial</strong> — Question {current + 1} of {GUEST_LIMIT} · No account needed</span>
            <Link to="/parent-auth" style={styles.guestBannerLink}>Unlock all questions →</Link>
          </div>
        </div>
      )}

      <div style={styles.progressHeader}>
        <div className="content-wrapper">
          <div style={styles.progressMeta}>
            <span style={styles.subject}>{config.emoji} {config.name}</span>
            <span style={styles.counter}>
              Question {current + 1} of {questions.length}
              {isGuest && <span style={styles.guestTag}> · Free Trial</span>}
            </span>
          </div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760 }}>
        <div className="card card-elevated" style={styles.questionCard}>
          <p style={styles.questionLabel}>Question {current + 1}</p>
          <h2 style={styles.questionText}>{question.question}</h2>

          <div style={styles.options}>
            {question.options.map((option, i) => {
              let optStyle = styles.option
              if (revealed) {
                if (i === question.correct) optStyle = { ...styles.option, ...styles.optionCorrect }
                else if (i === selected && i !== question.correct) optStyle = { ...styles.option, ...styles.optionWrong }
                else optStyle = { ...styles.option, ...styles.optionDimmed }
              } else if (selected === i) {
                optStyle = { ...styles.option, ...styles.optionSelected }
              }
              return (
                <button key={i} style={optStyle} onClick={() => handleSelect(i)} disabled={revealed}>
                  <span style={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                  <span style={styles.optionText}>{option}</span>
                  {revealed && i === question.correct && <span style={styles.optionMark}>✓</span>}
                  {revealed && i === selected && i !== question.correct && <span style={styles.optionMarkWrong}>✗</span>}
                </button>
              )
            })}
          </div>

          {showExplanation && (
            <div ref={explanationRef} style={styles.explanation}>
              <div style={styles.explanationHeader}>
                <span style={styles.explanationIcon}>{selected === question.correct ? '🎉' : '💡'}</span>
                <strong style={styles.explanationTitle}>
                  {selected === question.correct ? 'Correct!' : `Correct answer: ${question.options[question.correct]}`}
                </strong>
              </div>
              <p style={styles.explanationText}>{question.explanation}</p>
            </div>
          )}
        </div>

        {revealed && (
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleNext} style={{ padding: '14px 32px', fontSize: '1rem' }}>
              {isLast ? 'See My Results →' : 'Next Question →'}
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ color: 'var(--charcoal-lt)', fontSize: '0.85rem' }}>← Exit Quiz</Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  guestBanner: { background: 'var(--gold)', padding: '10px 0' },
  guestBannerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: '0.88rem', color: 'var(--forest)', fontWeight: 500 },
  guestBannerLink: { fontWeight: 700, color: 'var(--forest)', textDecoration: 'underline', fontSize: '0.88rem' },
  guestTag: { color: 'var(--gold-dk)', fontWeight: 600 },
  progressHeader: { background: 'var(--white)', borderBottom: '1px solid var(--ivory-dk)', padding: '16px 0' },
  progressMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--forest)' },
  counter: { fontSize: '0.85rem', color: 'var(--charcoal-lt)', fontWeight: 500 },
  questionCard: { padding: '36px 40px' },
  questionLabel: { fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-dk)', marginBottom: 12 },
  questionText: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', color: 'var(--charcoal)', marginBottom: 32, lineHeight: 1.4 },
  options: { display: 'flex', flexDirection: 'column', gap: 12 },
  option: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', border: '2px solid var(--ivory-dk)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease', fontFamily: 'var(--font-body)', fontSize: '0.97rem', color: 'var(--charcoal)' },
  optionSelected: { borderColor: 'var(--forest-lt)', background: '#eef7f4' },
  optionCorrect: { borderColor: 'var(--success)', background: '#eafaf1', color: 'var(--success)', cursor: 'default' },
  optionWrong: { borderColor: 'var(--error)', background: '#fdecea', color: 'var(--error)', cursor: 'default' },
  optionDimmed: { opacity: 0.45, cursor: 'default' },
  optionLetter: { width: 30, height: 30, borderRadius: '50%', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, color: 'var(--charcoal-lt)' },
  optionText: { flex: 1 },
  optionMark: { color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem' },
  optionMarkWrong: { color: 'var(--error)', fontWeight: 700, fontSize: '1.1rem' },
  explanation: { marginTop: 28, padding: '20px 24px', background: 'linear-gradient(135deg, #eef7f4 0%, #f5f0e8 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--forest-lt)' },
  explanationHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  explanationIcon: { fontSize: '1.2rem' },
  explanationTitle: { color: 'var(--forest)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' },
  explanationText: { color: 'var(--charcoal-lt)', fontSize: '0.93rem', lineHeight: 1.7 },
}
