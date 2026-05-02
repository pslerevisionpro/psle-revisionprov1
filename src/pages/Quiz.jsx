import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { scienceQuestions } from '../data/scienceQuestions'
import Navbar from '../components/Navbar'

const QUIZ_CONFIGS = {
  science: { name: 'Science', emoji: '🔬', questions: scienceQuestions },
}

export default function Quiz() {
  const { subject } = useParams()
  const config = QUIZ_CONFIGS[subject]
  const { session } = useAuth()
  const navigate = useNavigate()

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
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--forest)', fontSize: '1.8rem' }}>
            Subject not found
          </h2>
          <Link to="/subjects" className="btn btn-primary" style={{ marginTop: 20 }}>Back to Subjects</Link>
        </div>
      </div>
    )
  }

  const questions = config.questions
  const question = questions[current]
  const isLast = current === questions.length - 1

  function handleSelect(optionIndex) {
    if (revealed) return
    setSelected(optionIndex)
    setRevealed(true)
    setShowExplanation(false)
    setTimeout(() => {
      setShowExplanation(true)
      setTimeout(() => explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }, 400)
    setAnswers(prev => [...prev, { questionId: question.id, selected: optionIndex, correct: optionIndex === question.correct }])
  }

  async function handleNext() {
    if (isLast) {
      // Save result
      const score = answers.filter(a => a.correct).length
      const pct = Math.round((score / questions.length) * 100)
      if (session) {
        await supabase.from('quiz_results').insert({
          user_id: session.user.id,
          subject: config.name,
          score,
          total: questions.length,
          pct,
        })
      }
      navigate('/results', { state: { score, total: questions.length, pct, subject: config.name, answers } })
      return
    }
    setCurrent(c => c + 1)
    setSelected(null)
    setRevealed(false)
    setShowExplanation(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const progress = ((current) / questions.length) * 100

  return (
    <div className="page-container">
      <Navbar />

      {/* Progress header */}
      <div style={styles.progressHeader}>
        <div className="content-wrapper">
          <div style={styles.progressMeta}>
            <span style={styles.subject}>{config.emoji} {config.name}</span>
            <span style={styles.counter}>Question {current + 1} of {questions.length}</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 760 }}>
        {/* Question card */}
        <div className="card card-elevated" style={styles.questionCard}>
          <p style={styles.questionLabel}>Question {current + 1}</p>
          <h2 style={styles.questionText}>{question.question}</h2>

          {/* Options */}
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

          {/* Explanation */}
          {showExplanation && (
            <div ref={explanationRef} style={styles.explanation}>
              <div style={styles.explanationHeader}>
                <span style={styles.explanationIcon}>
                  {selected === question.correct ? '🎉' : '💡'}
                </span>
                <strong style={styles.explanationTitle}>
                  {selected === question.correct ? 'Correct!' : `Correct answer: ${question.options[question.correct]}`}
                </strong>
              </div>
              <p style={styles.explanationText}>{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {revealed && (
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleNext} style={{ padding: '14px 32px', fontSize: '1rem' }}>
              {isLast ? 'See My Results →' : 'Next Question →'}
            </button>
          </div>
        )}

        {/* Exit */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/subjects" style={{ color: 'var(--charcoal-lt)', fontSize: '0.85rem' }}>
            ← Exit Quiz
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  progressHeader: { background: 'var(--white)', borderBottom: '1px solid var(--ivory-dk)', padding: '16px 0' },
  progressMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--forest)', letterSpacing: '0.02em' },
  counter: { fontSize: '0.85rem', color: 'var(--charcoal-lt)', fontWeight: 500 },

  questionCard: { padding: '36px 40px' },
  questionLabel: { fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-dk)', marginBottom: 12 },
  questionText: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', color: 'var(--charcoal)', marginBottom: 32, lineHeight: 1.4 },

  options: { display: 'flex', flexDirection: 'column', gap: 12 },
  option: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
    border: '2px solid var(--ivory-dk)', borderRadius: 'var(--radius-sm)',
    background: 'var(--white)', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.18s ease', fontFamily: 'var(--font-body)',
    fontSize: '0.97rem', color: 'var(--charcoal)',
  },
  optionSelected: { borderColor: 'var(--forest-lt)', background: '#eef7f4' },
  optionCorrect: { borderColor: 'var(--success)', background: '#eafaf1', color: 'var(--success)', cursor: 'default' },
  optionWrong: { borderColor: 'var(--error)', background: '#fdecea', color: 'var(--error)', cursor: 'default' },
  optionDimmed: { opacity: 0.45, cursor: 'default' },
  optionLetter: { width: 30, height: 30, borderRadius: '50%', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, color: 'var(--charcoal-lt)' },
  optionText: { flex: 1 },
  optionMark: { color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem' },
  optionMarkWrong: { color: 'var(--error)', fontWeight: 700, fontSize: '1.1rem' },

  explanation: {
    marginTop: 28, padding: '20px 24px',
    background: 'linear-gradient(135deg, #eef7f4 0%, #f5f0e8 100%)',
    borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--forest-lt)',
    animation: 'fadeSlideIn 0.3s ease',
  },
  explanationHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  explanationIcon: { fontSize: '1.2rem' },
  explanationTitle: { color: 'var(--forest)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' },
  explanationText: { color: 'var(--charcoal-lt)', fontSize: '0.93rem', lineHeight: 1.7 },
}
