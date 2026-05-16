import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useQuestions } from '../lib/useQuestions'
import Navbar from '../components/Navbar'

const QUIZ_CONFIGS = {
  science:     { name: 'Science',        emoji: '🔬' },
  maths:       { name: 'Mathematics',    emoji: '🔢' },
  english:     { name: 'English',        emoji: '✏️' },
  setswana:    { name: 'Setswana',       emoji: '🗣️' },
  agriculture: { name: 'Agriculture',    emoji: '🌱' },
  social:      { name: 'Social Studies', emoji: '🌍' },
  rme:         { name: 'RME',            emoji: '📖' },
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

function groupIntoBatches(questions) {
  // Separate passage-linked questions from standalone questions
  const soloGroups = []
  const batchMap   = new Map()   // context_text → [questions]

  for (const q of questions) {
    if (!q.context_text) {
      soloGroups.push({ type: 'solo', questions: [q] })
    } else {
      if (!batchMap.has(q.context_text)) batchMap.set(q.context_text, [])
      batchMap.get(q.context_text).push(q)
    }
  }

  // Sequential question detection — keep original order if found
  const SEQUENTIAL = /\b(arrange|correct order|which order|sequence|rearrange|put.*order)\b/i

  const passageLots = [...batchMap.values()].map(qs => {
    // Always sort by question_number first to restore original order
    const sorted       = [...qs].sort((a, b) => a.question_number - b.question_number)
    const isSequential = sorted.some(q => SEQUENTIAL.test(q.question))
    return {
      type:      'batch',
      questions: isSequential ? sorted : shuffle(sorted),
    }
  })

  // Shuffle the LOTS against each other (solo questions and passage batches)
  // Solo questions are individual lots — they shuffle freely between passage batches
  const allLots = shuffle([...soloGroups, ...passageLots])

  // Flatten: each lot's questions stay together in sequence
  return allLots.flatMap(lot => lot.questions)
}

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
const limitParam = parseInt(searchParams.get('limit')) || 60

  const config = QUIZ_CONFIGS[subject]
  const { session } = useAuth()
  const navigate = useNavigate()

  // ── Fetch questions from Supabase ──────────────────────────
const { questions: rawQuestions, loading, error } = useQuestions(subject, {
  limit: isGuest ? GUEST_LIMIT : limitParam,
  })

  // Build shuffled question list once rawQuestions arrive
  const [questions, setQuestions] = useState([])
  useEffect(() => {
    if (rawQuestions.length > 0) {
      const withShuffledOptions = rawQuestions.map(shuffleOptions)
      const batched = groupIntoBatches(withShuffledOptions)
      const picked  = isGuest ? batched.slice(0, GUEST_LIMIT) : batched
      setQuestions(picked)
    }
  }, [rawQuestions])

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [skipped, setSkipped] = useState(new Set())

  // Restore state when navigating to a previously answered question
  useEffect(() => {
    if (questions.length === 0) return
    const q = questions[current]
    if (!q) return
    const existing = answers.find(a => a.questionId === q.id)
    if (existing) {
      setSelected(existing.selected)
      setRevealed(true)
      setTimeout(() => setShowExplanation(true), 100)
    } else {
      setSelected(null)
      setRevealed(false)
      setShowExplanation(false)
    }
  }, [current, questions])
  const explanationRef = useRef(null)

  // ── Subject not found ──────────────────────────────────────
  if (!config) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--forest)', fontSize: '1.8rem' }}>
            Subject not found
          </h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Go Home</Link>
        </div>
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading || (rawQuestions.length > 0 && questions.length === 0)) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{config.emoji}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--forest)', fontSize: '1.6rem', marginBottom: 8 }}>
            Loading {config.name} questions…
          </h2>
          <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.95rem' }}>
            Fetching from question bank
          </p>
          <div style={styles.loadingBar}>
            <div style={styles.loadingFill} />
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-container">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <h2 style={{ color: 'var(--error)', fontSize: '1.4rem', marginBottom: 12 }}>
            Could not load questions
          </h2>
          <p style={{ color: 'var(--charcoal-lt)', marginBottom: 24 }}>{error}</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    )
  }

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
    setAnswers(prev => [...prev, {
      questionId: question.id,
      selected: optionIndex,
      correct: optionIndex === question.correct,
    }])
  }

  function handleBack() {
    if (current > 0) {
      setCurrent(c => c - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleSkip() {
    setSkipped(prev => new Set([...prev, current]))
    const nextUnskipped = questions.findIndex((_, i) => i > current && !skipped.has(i))
    if (nextUnskipped !== -1) {
      setCurrent(nextUnskipped)
    } else {
      // All remaining are skipped — go to first skipped
      const firstSkipped = [...new Set([...skipped, current])][0]
      setCurrent(firstSkipped !== undefined ? firstSkipped : current + 1)
    }
    setSelected(null)
    setRevealed(false)
    setShowExplanation(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleNext() {
    if (skipped.has(current)) {
      setSkipped(prev => { const n = new Set(prev); n.delete(current); return n })
    }
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleFinish() {
    if (isLast) {
      const finalAnswers = [...answers]
      // Add last answer if not yet recorded
      if (!answers.find(a => a.questionId === question.id)) {
        finalAnswers.push({
          questionId: question.id,
          selected,
          correct: selected === question.correct,
        })
      }
      const score = finalAnswers.filter(a => a.correct).length
      const total = questions.length
      const pct   = Math.round((score / total) * 100)

if (session && !isGuest) {
  try {
    await supabase.from('quiz_results').insert({
      user_id: session.user.id,
      subject: config.name,
      score,
      total,
      pct,
    })

    for (const a of finalAnswers) {
  const q = questions.find(q => q.id === a.questionId)
  if (!q || a.selected === null || a.selected === undefined) continue
  const { error: attemptError } = await supabase.from('student_attempts').insert({
    student_id:      session.user.id,
    question_id:     a.questionId,
    paper_id:        q.paper_id ?? null,
    selected_answer: String.fromCharCode(65 + a.selected),
    is_correct:      a.correct,
  })
  if (attemptError) console.error('Attempt insert error:', attemptError.message)
}
  } catch (err) {
  console.error('Error saving results:', err.message, JSON.stringify(err))
}
}

      navigate('/results', {
        state: { score, total, pct, subject: config.name, answers: finalAnswers, questions, isGuest }
      })
      return
    }

    setCurrent(c => c + 1)
    setSelected(null)
    setRevealed(false)
    setShowExplanation(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100

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
              {skipped.size > 0 && <span style={styles.skippedTag}> · {skipped.size} skipped</span>}
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

          {/* Topic badge */}
          {question.subject_area && (
            <div style={styles.topicBadge}>
              {question.subject_area}
              {question.blooms_level && (
                <span style={styles.bloomsBadge}>{question.blooms_level}</span>
              )}
            </div>
          )}

          <p style={styles.questionLabel}>
            Question {current + 1}
            {skipped.has(current) && (
              <span style={{ marginLeft: 10, fontSize: '0.75rem', background: '#FFF3E0', color: '#E67E22', border: '1px solid #FFB74D', borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>
                🚩 Skipped — come back to this
              </span>
            )}
          </p>

          {question.context_text && (
            <div style={styles.contextBox}>
              <div style={styles.contextLabel}>📖 Read the following, then answer the question</div>
              <div style={styles.contextContent}>{question.context_text}</div>
            </div>
          )}

          <h2 style={styles.questionText}>{question.question}</h2>

          <div style={styles.options}>
            {question.options.map((option, i) => {
              let optStyle = styles.option
              if (revealed) {
                if (i === question.correct)                optStyle = { ...styles.option, ...styles.optionCorrect }
                else if (i === selected && i !== question.correct) optStyle = { ...styles.option, ...styles.optionWrong }
                else                                       optStyle = { ...styles.option, ...styles.optionDimmed }
              } else if (selected === i) {
                optStyle = { ...styles.option, ...styles.optionSelected }
              }
              return (
                <button key={i} style={optStyle} onClick={() => handleSelect(i)} disabled={revealed}>
                  <span style={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                  <span style={styles.optionText}>{option}</span>
                  {revealed && i === question.correct             && <span style={styles.optionMark}>✓</span>}
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
                  {selected === question.correct
                    ? 'Correct!'
                    : `Correct answer: ${question.options[question.correct]}`}
                </strong>
              </div>
              <p style={styles.explanationText}>{question.explanation}</p>
              {question.curriculum_code && (
                <p style={styles.curriculumCode}>Curriculum ref: {question.curriculum_code}</p>
              )}
            </div>
          )}
        </div>

        <div style={styles.navBar}>
          <button
            onClick={handleBack}
            disabled={current === 0}
            style={{ ...styles.navBtn, opacity: current === 0 ? 0.35 : 1 }}
          >
            ← Back
          </button>

          <button
            onClick={handleSkip}
            disabled={revealed}
            style={{ ...styles.skipBtn, opacity: revealed ? 0.35 : 1, cursor: revealed ? 'default' : 'pointer' }}
          >
            Skip 🚩
          </button>

          {isLast
            ? <button
                className="btn btn-primary"
                onClick={handleFinish}
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                See Results →
              </button>
            : <button
                onClick={handleNext}
                style={styles.navBtnPrimary}
              >
                Next →
              </button>
          }
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/dashboard" style={{ color: 'var(--charcoal-lt)', fontSize: '0.85rem' }}>← Exit Quiz</Link>
        </div>
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────
const styles = {
  guestBanner:        { background: 'var(--gold)', padding: '10px 0' },
  guestBannerInner:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: '0.88rem', color: 'var(--forest)', fontWeight: 500 },
  guestBannerLink:    { fontWeight: 700, color: 'var(--forest)', textDecoration: 'underline', fontSize: '0.88rem' },
  guestTag:           { color: 'var(--gold-dk)', fontWeight: 600 },
  progressHeader:     { background: 'var(--white)', borderBottom: '1px solid var(--ivory-dk)', padding: '16px 0' },
  progressMeta:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subject:            { fontWeight: 700, fontSize: '0.9rem', color: 'var(--forest)' },
  counter:            { fontSize: '0.85rem', color: 'var(--charcoal-lt)', fontWeight: 500 },
  questionCard:       { padding: '36px 40px' },
  topicBadge:         { display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, background: 'var(--ivory)', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  bloomsBadge:        { background: 'var(--forest)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 },
  questionLabel:      { fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-dk)', marginBottom: 12 },
  questionText:       { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', color: 'var(--charcoal)', marginBottom: 20, lineHeight: 1.4 },
  contextBox:     { background: '#f0f7ff', border: '1px solid #c7d9f5', borderLeft: '4px solid var(--forest)', borderRadius: '0 8px 8px 0', padding: '18px 20px', marginBottom: 24 },
  contextLabel:   { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--forest)', marginBottom: 10 },
  contextContent: { fontSize: '0.93rem', color: 'var(--charcoal)', lineHeight: 1.75, whiteSpace: 'pre-line', maxHeight: 280, overflowY: 'auto', paddingRight: 4 },
  options:            { display: 'flex', flexDirection: 'column', gap: 12 },
  option:             { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', border: '2px solid var(--ivory-dk)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease', fontFamily: 'var(--font-body)', fontSize: '0.97rem', color: 'var(--charcoal)' },
  optionSelected:     { borderColor: 'var(--forest-lt)', background: '#eef7f4' },
  optionCorrect:      { borderColor: 'var(--success)', background: '#eafaf1', color: 'var(--success)', cursor: 'default' },
  optionWrong:        { borderColor: 'var(--error)', background: '#fdecea', color: 'var(--error)', cursor: 'default' },
  optionDimmed:       { opacity: 0.45, cursor: 'default' },
  optionLetter:       { width: 30, height: 30, borderRadius: '50%', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, color: 'var(--charcoal-lt)' },
  optionText:         { flex: 1 },
  optionMark:         { color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem' },
  optionMarkWrong:    { color: 'var(--error)', fontWeight: 700, fontSize: '1.1rem' },
  explanation:        { marginTop: 28, padding: '20px 24px', background: 'linear-gradient(135deg, #eef7f4 0%, #f5f0e8 100%)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--forest-lt)' },
  explanationHeader:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  explanationIcon:    { fontSize: '1.2rem' },
  explanationTitle:   { color: 'var(--forest)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' },
  explanationText:    { color: 'var(--charcoal-lt)', fontSize: '0.93rem', lineHeight: 1.7 },
  curriculumCode:     { marginTop: 8, fontSize: '0.75rem', color: 'var(--charcoal-lt)', opacity: 0.6 },
  skippedTag:  { color: '#E67E22', fontWeight: 600 },
  skipBtn:        { background: 'none', border: '1.5px solid #FFB74D', borderRadius: 8, padding: '10px 22px', fontSize: '0.88rem', fontWeight: 600, color: '#E67E22', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' },
  navBar:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 12 },
  navBtn:         { background: '#fff', border: '1.5px solid var(--ivory-dk)', borderRadius: 8, padding: '10px 22px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal-lt)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' },
  navBtnPrimary:  { background: 'var(--forest)', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ivory)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' },
  loadingBar:         { width: 200, height: 4, background: 'var(--ivory-dk)', borderRadius: 4, margin: '24px auto 0', overflow: 'hidden' },
  loadingFill:        { height: '100%', width: '60%', background: 'var(--forest)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite' },
}
