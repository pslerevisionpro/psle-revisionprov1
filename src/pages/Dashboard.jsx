import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science', name: 'Science', emoji: '🔬', color: '#1B3D2F', available: true },
  { key: 'english', name: 'English', emoji: '✏️', color: '#2D5A45', available: false },
  { key: 'maths', name: 'Mathematics', emoji: '🔢', color: '#3F7A5E', available: false },
  { key: 'setswana', name: 'Setswana', emoji: '🗣️', color: '#1B3D2F', available: false },
  { key: 'social', name: 'Social Studies', emoji: '🌍', color: '#2D5A45', available: false },
  { key: 'rme', name: 'RME', emoji: '📖', color: '#3F7A5E', available: false },
]

function getGradeColor(pct) {
  if (pct >= 80) return '#27AE60'
  if (pct >= 65) return '#2980B9'
  if (pct >= 50) return '#E67E22'
  return '#C0392B'
}

function getGradeLetter(pct) {
  if (pct >= 80) return 'A'
  if (pct >= 65) return 'B'
  if (pct >= 50) return 'C'
  return 'D'
}

// Mini sparkline chart for attempt history
function SparkLine({ attempts }) {
  if (!attempts || attempts.length === 0) return null
  const w = 120, h = 36, pad = 4
  const max = 100
  const pts = attempts.slice(-8)
  const xStep = pts.length < 2 ? 0 : (w - pad * 2) / (pts.length - 1)
  const y = v => h - pad - ((v / max) * (h - pad * 2))
  const points = pts.map((p, i) => `${pad + i * xStep},${y(p.pct)}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke="var(--sage)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={pad + i * xStep}
          cy={y(p.pct)}
          r="3"
          fill={getGradeColor(p.pct)}
        />
      ))}
    </svg>
  )
}

// Bar chart showing score history per subject
function ScoreBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--charcoal-lt)', fontSize: '0.88rem' }}>
        No quiz attempts yet.<br />
        <Link to="/quiz/science" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>Take your first quiz →</Link>
      </div>
    )
  }
  const max = 100
  const barW = 36
  const gap = 16
  const h = 140
  const labelH = 32
  const totalW = data.length * (barW + gap) - gap
  return (
    <svg width="100%" viewBox={`0 0 ${Math.max(totalW, 280)} ${h + labelH}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => {
        const yPos = h - (v / max) * h
        return (
          <g key={v}>
            <line x1="0" y1={yPos} x2={Math.max(totalW, 280)} y2={yPos} stroke="var(--ivory-dk)" strokeWidth="1" />
            <text x="-4" y={yPos + 4} fontSize="9" fill="var(--charcoal-lt)" textAnchor="end">{v}%</text>
          </g>
        )
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = i * (barW + gap)
        const barH = (d.pct / max) * h
        const y = h - barH
        const col = getGradeColor(d.pct)
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={col} rx="3" opacity="0.85" />
            <text x={x + barW / 2} y={y - 5} fontSize="10" fill={col} textAnchor="middle" fontWeight="700">
              {d.pct}%
            </text>
            <text x={x + barW / 2} y={h + 14} fontSize="9" fill="var(--charcoal-lt)" textAnchor="middle">
              {d.label}
            </text>
            <text x={x + barW / 2} y={h + 26} fontSize="8" fill="var(--charcoal-lt)" textAnchor="middle">
              {d.date}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Radial progress circle
function RadialProgress({ pct, size = 80, label }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const fill = pct > 0 ? (pct / 100) * circ : 0
  const color = pct > 0 ? getGradeColor(pct) : 'var(--ivory-dk)'
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ivory-dk)" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill={pct > 0 ? color : 'var(--charcoal-lt)'}>
        {pct > 0 ? `${pct}%` : '—'}
      </text>
      {label && (
        <text x={size / 2} y={size / 2 + 10} textAnchor="middle" fontSize="8" fill="var(--charcoal-lt)">{label}</text>
      )}
    </svg>
  )
}

export default function Dashboard() {
  const { session, profile, signOut } = useAuth()
  const [allResults, setAllResults] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (data) setAllResults(data)
    setLoading(false)
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student'
  const role = profile?.role || 'student'

  // Best score per subject
  const bestScores = {}
  const attemptsBySubject = {}
  allResults.forEach(r => {
    const key = r.subject?.toLowerCase()
    if (!bestScores[key] || r.pct > bestScores[key]) bestScores[key] = r.pct
    if (!attemptsBySubject[key]) attemptsBySubject[key] = []
    attemptsBySubject[key].push(r)
  })

  const attempted = Object.values(bestScores)
  const overallAvg = attempted.length > 0
    ? Math.round(attempted.reduce((a, b) => a + b, 0) / attempted.length)
    : 0
  const totalAttempts = allResults.length
  const bestScore = attempted.length > 0 ? Math.max(...attempted) : 0
  const recentScores = [...allResults].reverse().slice(0, 5)

  // Chart data: last 10 attempts across all subjects
  const chartData = [...allResults].reverse().slice(0, 10).reverse().map(r => ({
    pct: r.pct,
    label: r.subject?.slice(0, 3) || 'Q',
    date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }))

  // Science-specific attempts for sparkline
  const scienceAttempts = attemptsBySubject['science'] || []

  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.wrapper}>

        {/* Banner */}
        <div style={styles.banner}>
          <div style={styles.bannerInner} className="content-wrapper">
            <div style={{ flex: 1 }}>
              <p style={styles.bannerLabel}>
                {role === 'parent' ? '👨‍👩‍👧 Parent Dashboard' : role === 'tutor' ? '🎓 Tutor Dashboard' : '🎒 Student Dashboard'}
              </p>
              <h1 style={styles.bannerTitle}>Welcome back, {displayName.split(' ')[0]}!</h1>
              <p style={styles.bannerSubtitle}>
                {totalAttempts === 0
                  ? "You haven't taken any quizzes yet — start with Science below!"
                  : `${totalAttempts} quiz attempt${totalAttempts > 1 ? 's' : ''} recorded across ${attempted.length} subject${attempted.length > 1 ? 's' : ''}.`}
              </p>
            </div>

            {/* Summary stats */}
            <div style={styles.bannerStats}>
              <div style={styles.bannerStatBox}>
                <span style={styles.bannerStatNum}>{totalAttempts}</span>
                <span style={styles.bannerStatLabel}>Attempts</span>
              </div>
              <div style={styles.bannerStatBox}>
                <span style={{ ...styles.bannerStatNum, color: overallAvg > 0 ? getGradeColor(overallAvg) : 'var(--sage-lt)' }}>
                  {overallAvg > 0 ? `${overallAvg}%` : '—'}
                </span>
                <span style={styles.bannerStatLabel}>Avg Score</span>
              </div>
              <div style={styles.bannerStatBox}>
                <span style={{ ...styles.bannerStatNum, color: bestScore > 0 ? getGradeColor(bestScore) : 'var(--sage-lt)' }}>
                  {bestScore > 0 ? `${bestScore}%` : '—'}
                </span>
                <span style={styles.bannerStatLabel}>Best Score</span>
              </div>
              <div style={styles.bannerStatBox}>
                <span style={{ ...styles.bannerStatNum, color: 'var(--gold-lt)' }}>
                  {overallAvg > 0 ? getGradeLetter(overallAvg) : '—'}
                </span>
                <span style={styles.bannerStatLabel}>Grade</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-wrapper" style={{ paddingTop: 32, paddingBottom: 60 }}>
          <div style={styles.grid}>

            {/* Left: subjects + chart */}
            <div style={{ minWidth: 0 }}>

              {/* Score history chart */}
              <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
                <div style={styles.sectionHeader}>
                  <h2 style={styles.sectionTitle}>📈 Score History</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-lt)' }}>Last 10 attempts</span>
                </div>
                {loading ? <div className="spinner" /> : <ScoreBarChart data={chartData} />}
              </div>

              {/* Subjects */}
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Subjects</h2>
                <Link to="/subjects" className="btn btn-ghost btn-sm">View All →</Link>
              </div>

              {loading ? <div className="spinner" /> : (
                <div style={styles.subjectsGrid}>
                  {SUBJECTS.map(sub => {
                    const best = bestScores[sub.name.toLowerCase()] ?? bestScores[sub.key] ?? null
                    const attempts = attemptsBySubject[sub.name.toLowerCase()] || attemptsBySubject[sub.key] || []
                    return (
                      <Link
                        key={sub.key}
                        to={sub.available ? `/quiz/${sub.key}` : '/subjects'}
                        style={styles.subCard}
                      >
                        <RadialProgress pct={best ?? 0} size={64} label={best ? 'best' : sub.available ? 'try!' : 'soon'} />
                        <div style={styles.subInfo}>
                          <div style={styles.subTop}>
                            <span style={{ ...styles.subIcon2, background: sub.color }}>{sub.emoji}</span>
                            <p style={styles.subName}>{sub.name}</p>
                          </div>
                          {best !== null ? (
                            <>
                              <p style={{ fontSize: '0.75rem', color: getGradeColor(best), fontWeight: 700, marginBottom: 4 }}>
                                Best: {best}% · Grade {getGradeLetter(best)} · {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
                              </p>
                              <SparkLine attempts={attempts} />
                            </>
                          ) : (
                            <p style={{ fontSize: '0.75rem', color: 'var(--charcoal-lt)', fontStyle: 'italic' }}>
                              {sub.available ? 'Not attempted yet' : 'Coming soon'}
                            </p>
                          )}
                        </div>
                        {sub.available && (
                          <span className="badge badge-gold" style={{ fontSize: '0.7rem', flexShrink: 0, alignSelf: 'flex-start' }}>
                            {best !== null ? 'Retry →' : 'Start →'}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div style={styles.quickAction} className="card card-elevated">
                <h3 style={styles.qaTitle}>🚀 Quick Revision</h3>
                <p style={styles.qaDesc}>Jump straight into a Science practice session.</p>
                <Link to="/quiz/science" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
                  {bestScores['science'] ? 'Retry Science Quiz →' : 'Start Science Quiz →'}
                </Link>
              </div>

              {/* Subject progress circles */}
              <div className="card" style={{ marginBottom: 16, padding: '20px' }}>
                <h3 style={styles.qaTitle}>🎯 Subject Overview</h3>
                <div style={styles.circlesGrid}>
                  {SUBJECTS.map(sub => {
                    const best = bestScores[sub.name.toLowerCase()] ?? bestScores[sub.key] ?? 0
                    return (
                      <div key={sub.key} style={{ textAlign: 'center' }}>
                        <RadialProgress pct={best} size={56} />
                        <p style={{ fontSize: '0.68rem', color: 'var(--charcoal-lt)', marginTop: 4, fontWeight: 600 }}>
                          {sub.emoji} {sub.name.split(' ')[0]}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent activity */}
              <div style={styles.recentCard} className="card">
                <h3 style={styles.qaTitle}>📋 Recent Activity</h3>
                {recentScores.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--charcoal-lt)', fontSize: '0.85rem' }}>
                    No attempts yet.<br />
                    <Link to="/quiz/science" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>
                      Start here →
                    </Link>
                  </div>
                ) : (
                  recentScores.map((r, i) => (
                    <div key={i} style={styles.activityRow}>
                      <div>
                        <span style={styles.activitySubject}>{r.subject}</span>
                        <span style={styles.activityDate}>
                          {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ ...styles.activityScore, color: getGradeColor(r.pct) }}>
                          {r.score}/{r.total}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: getGradeColor(r.pct) }}>
                          {r.pct}% · {getGradeLetter(r.pct)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.tipCard}>
                <p style={styles.tipBadge}>💡 Study Tip</p>
                <p style={styles.tipText}>
                  {totalAttempts === 0
                    ? 'Start with Science — it\'s ready now. Other subjects coming soon!'
                    : overallAvg >= 70
                    ? 'Great scores! Keep the consistency and try harder questions next time.'
                    : 'Review the explanations after each wrong answer — that\'s where the real learning happens.'}
                </p>
              </div>

              <button
                onClick={async () => { await signOut(); navigate('/') }}
                className="btn btn-full"
                style={styles.signOutBtn}
              >
                ← Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { minHeight: 'calc(100vh - 64px)' },
  banner: { background: 'var(--forest)', padding: '36px 0 40px' },
  bannerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  bannerLabel: { color: 'var(--sage-lt)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  bannerTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'var(--ivory)', marginBottom: 8 },
  bannerSubtitle: { color: 'rgba(245,240,232,0.65)', fontSize: '0.93rem' },
  bannerStats: { display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap' },
  bannerStatBox: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', textAlign: 'center', minWidth: 72 },
  bannerStatNum: { display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1 },
  bannerStatLabel: { display: 'block', fontSize: '0.68rem', color: 'var(--sage-lt)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--forest)' },
  subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  subCard: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderRadius: 'var(--radius-md)', padding: '16px 18px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s', cursor: 'pointer' },
  subTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  subIcon2: { width: 24, height: 24, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 },
  subInfo: { flex: 1, minWidth: 0 },
  subName: { fontWeight: 600, fontSize: '0.92rem', color: 'var(--charcoal)' },
  quickAction: { padding: '24px', marginBottom: 16 },
  qaTitle: { fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--forest)', marginBottom: 6 },
  qaDesc: { color: 'var(--charcoal-lt)', fontSize: '0.88rem', lineHeight: 1.6 },
  circlesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 },
  recentCard: { marginBottom: 16 },
  activityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ivory-dk)' },
  activitySubject: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', display: 'block' },
  activityDate: { fontSize: '0.72rem', color: 'var(--charcoal-lt)' },
  activityScore: { fontSize: '0.88rem', fontWeight: 700 },
  tipCard: { background: 'var(--forest)', borderRadius: 'var(--radius-md)', padding: '20px', color: 'var(--ivory)', marginBottom: 12 },
  tipBadge: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 8, letterSpacing: '0.04em' },
  tipText: { fontSize: '0.88rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.65 },
  signOutBtn: { background: 'var(--white)', border: '1.5px solid var(--ivory-dk)', color: 'var(--charcoal-lt)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: '12px' },
}
