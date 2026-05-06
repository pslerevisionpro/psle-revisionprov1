import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science',     name: 'Science',       emoji: '🔬', description: 'Biology, chemistry, physics, and earth science — all the PSLE topics.', topics: ['Living Things', 'Matter & Materials', 'Forces & Energy', 'Earth & Space'], available: true,  color: '#1B3D2F' },
  { key: 'english',     name: 'English',        emoji: '✏️', description: 'Reading comprehension, grammar, vocabulary, and writing skills.',           topics: ['Comprehension', 'Grammar', 'Vocabulary', 'Writing'],                  available: false, color: '#2D5A45' },
  { key: 'maths',       name: 'Mathematics',    emoji: '🔢', description: 'Numbers, fractions, geometry, and problem solving.',                        topics: ['Number Work', 'Fractions', 'Geometry', 'Data Handling'],             available: false, color: '#3F7A5E' },
  { key: 'setswana',    name: 'Setswana',       emoji: '🗣️', description: 'Reading, writing, and oral comprehension in Setswana.',                    topics: ['Go Bala', 'Go Kwala', 'Puo ya Molomo', 'Dipadi'],                   available: false, color: '#1B3D2F' },
  { key: 'social',      name: 'Social Studies', emoji: '🌍', description: 'Botswana geography, history, civics, and the wider world.',                 topics: ['History', 'Geography', 'Civics', 'Economics'],                       available: false, color: '#2D5A45' },
  { key: 'agriculture', name: 'Agriculture',    emoji: '🌱', description: 'Farming, crops, soils, livestock and agricultural practices in Botswana.',  topics: ['Soils & Crops', 'Livestock', 'Farm Management', 'Irrigation'],      available: false, color: '#5C7A3E' },
  { key: 'rme',         name: 'RME',            emoji: '📖', description: 'Religious and moral education — ethics, values, and faiths.',               topics: ['Values', 'World Religions', 'Moral Reasoning', 'Community'],        available: false, color: '#3F7A5E' },
]

const MODES = [
  {
    limit: 10,
    label: 'Quick Practice',
    sublabel: '~5 minutes',
    emoji: '⚡',
    desc: 'A short burst of 10 random questions. Great for a daily warm-up.',
    color: '#27AE60',
    recommended: true,
  },
  {
    limit: 20,
    label: 'Standard Practice',
    sublabel: '~10 minutes',
    emoji: '📚',
    desc: '20 questions covering a broader range of topics for deeper revision.',
    color: '#2980B9',
    recommended: false,
  },
  {
    limit: 60,
    label: 'Full Paper',
    sublabel: '~30 minutes',
    emoji: '🎓',
    desc: 'All 60 questions — full exam length. Use this for serious revision or timed simulation.',
    color: '#8E44AD',
    recommended: false,
  },
]

export default function SubjectList() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  function handleSubjectClick(sub) {
    if (!sub.available) return
    setSelected(selected === sub.key ? null : sub.key)
  }

  function startQuiz(subKey, limit) {
    navigate(`/quiz/${subKey}?limit=${limit}`)
  }

  return (
    <div className="page-container">
      <Navbar />

      <div style={styles.header}>
        <div className="content-wrapper">
          <p style={styles.breadcrumb}>
            <Link to="/dashboard" style={{ color: 'var(--sage-lt)' }}>Dashboard</Link> / Subjects
          </p>
          <h1 style={styles.title}>Choose a Subject</h1>
          <p style={styles.subtitle}>Select a subject, then choose how many questions to practice.</p>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={styles.grid}>
          {SUBJECTS.map(sub => {
            const isSelected = selected === sub.key
            return (
              <div key={sub.key} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Subject card */}
                <div
                  style={{
                    ...styles.card,
                    ...(isSelected ? styles.cardSelected : {}),
                    ...(sub.available ? { cursor: 'pointer' } : {}),
                  }}
                  onClick={() => handleSubjectClick(sub)}
                  className="card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ ...styles.iconBox, background: sub.color }}>{sub.emoji}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {sub.available
                        ? <span className="badge badge-green">Available</span>
                        : <span className="badge badge-gold">Coming Soon</span>}
                      {isSelected && <span style={styles.expandedBadge}>▲ Select mode</span>}
                    </div>
                  </div>

                  <h3 style={styles.subTitle}>{sub.name}</h3>
                  <p style={styles.subDesc}>{sub.description}</p>

                  <div style={styles.topics}>
                    {sub.topics.map(t => (
                      <span key={t} style={styles.topic}>{t}</span>
                    ))}
                  </div>

                  {sub.available ? (
                    <div
                      style={{ ...styles.startBtn, background: isSelected ? sub.color : 'var(--forest)' }}
                      onClick={e => { e.stopPropagation(); handleSubjectClick(sub) }}
                    >
                      {isSelected ? 'Choose how many questions ↓' : 'Start Practice →'}
                    </div>
                  ) : (
                    <button className="btn btn-outline btn-full" disabled style={{ marginTop: 20, opacity: 0.5 }}>
                      Coming Soon
                    </button>
                  )}
                </div>

                {/* Mode picker — expands below selected card */}
                {isSelected && (
                  <div style={styles.modePicker}>
                    <p style={styles.modePickerTitle}>How many questions?</p>
                    <div style={styles.modeGrid}>
                      {MODES.map(mode => (
                        <button
                          key={mode.limit}
                          style={styles.modeCard}
                          onClick={() => startQuiz(sub.key, mode.limit)}
                        >
                          <div style={styles.modeTop}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '1.3rem' }}>{mode.emoji}</span>
                              <div style={{ textAlign: 'left' }}>
                                <p style={styles.modeLabel}>{mode.label}</p>
                                <p style={styles.modeSublabel}>{mode.sublabel}</p>
                              </div>
                            </div>
                            {mode.recommended && (
                              <span style={styles.recommendedBadge}>Recommended</span>
                            )}
                          </div>
                          <p style={styles.modeDesc}>{mode.desc}</p>
                          <div style={{ ...styles.modeBtn, background: mode.color }}>
                            {mode.limit} Questions →
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      style={styles.cancelBtn}
                      onClick={() => setSelected(null)}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles = {
  header:           { background: 'var(--forest)', padding: '40px 0' },
  breadcrumb:       { fontSize: '0.82rem', color: 'rgba(245,240,232,0.5)', marginBottom: 10 },
  title:            { fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,2.8rem)', color: 'var(--ivory)', marginBottom: 8 },
  subtitle:         { color: 'rgba(245,240,232,0.65)', fontSize: '1rem' },
  grid:             { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24, alignItems: 'start' },
  card:             { padding: '28px', transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s' },
  cardSelected:     { border: '2px solid var(--forest)', boxShadow: '0 4px 20px rgba(27,61,47,0.15)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0 !important' },
  iconBox:          { width: 52, height: 52, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' },
  expandedBadge:    { fontSize: '0.72rem', fontWeight: 700, color: 'var(--forest)', background: 'var(--ivory)', padding: '3px 8px', borderRadius: 100 },
  subTitle:         { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--forest)', marginBottom: 8 },
  subDesc:          { color: 'var(--charcoal-lt)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 14 },
  topics:           { display: 'flex', flexWrap: 'wrap', gap: 6 },
  topic:            { background: 'var(--ivory)', color: 'var(--charcoal-lt)', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 100, border: '1px solid var(--ivory-dk)', fontWeight: 500 },
  startBtn:         { marginTop: 20, background: 'var(--forest)', color: 'var(--gold-lt)', borderRadius: 8, padding: '12px 20px', textAlign: 'center', fontWeight: 700, fontSize: '0.92rem', fontFamily: 'var(--font-body)', transition: 'background 0.2s' },

  // Mode picker
  modePicker:       { background: 'var(--ivory)', border: '2px solid var(--forest)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: '20px', marginTop: -2 },
  modePickerTitle:  { fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--forest)', marginBottom: 14, textAlign: 'center' },
  modeGrid:         { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 },
  modeCard:         { background: 'var(--white)', border: '1.5px solid var(--ivory-dk)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', transition: 'box-shadow 0.18s', width: '100%' },
  modeTop:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  modeLabel:        { fontWeight: 700, fontSize: '0.95rem', color: 'var(--charcoal)', marginBottom: 1 },
  modeSublabel:     { fontSize: '0.72rem', color: '#AAA', fontWeight: 500 },
  recommendedBadge: { fontSize: '0.68rem', fontWeight: 700, background: '#eafaf1', color: '#27AE60', padding: '3px 8px', borderRadius: 100, border: '1px solid #a9e4be', flexShrink: 0 },
  modeDesc:         { fontSize: '0.82rem', color: 'var(--charcoal-lt)', lineHeight: 1.5, marginBottom: 10 },
  modeBtn:          { color: 'white', borderRadius: 7, padding: '8px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' },
  cancelBtn:        { width: '100%', background: 'transparent', border: 'none', color: '#AAA', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '6px', textAlign: 'center' },
}
