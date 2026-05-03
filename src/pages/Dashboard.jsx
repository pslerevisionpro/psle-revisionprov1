import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science',  name: 'Science',       emoji: '🔬', color: '#1B3D2F', available: true  },
  { key: 'english',  name: 'English',        emoji: '✏️', color: '#2D5A45', available: false },
  { key: 'maths',    name: 'Mathematics',    emoji: '🔢', color: '#3F7A5E', available: false },
  { key: 'setswana', name: 'Setswana',       emoji: '🗣️', color: '#1B3D2F', available: false },
  { key: 'social',   name: 'Social Studies', emoji: '🌍', color: '#2D5A45', available: false },
  { key: 'rme',      name: 'RME',            emoji: '📖', color: '#3F7A5E', available: false },
]

function clamp(v) { return Math.min(100, Math.max(0, v)) }

function gradeColor(pct) {
  if (pct >= 80) return '#27AE60'
  if (pct >= 65) return '#2980B9'
  if (pct >= 50) return '#E67E22'
  return '#C0392B'
}

function gradeLetter(pct) {
  if (pct >= 80) return 'A'
  if (pct >= 65) return 'B'
  if (pct >= 50) return 'C'
  return 'D'
}

/* ── Apple-style bar chart ───────────────────────────────── */
function ScoreChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={chart.empty}>
        <p style={chart.emptyIcon}>📊</p>
        <p style={chart.emptyText}>No attempts yet</p>
        <Link to="/quiz/science" style={chart.emptyLink}>Take your first quiz →</Link>
      </div>
    )
  }

  const BAR_W  = 6
  const BAR_R  = 3
  const GAP    = 18
  const H      = 100
  const BOTTOM = 36   // space for labels below baseline
  const TOP    = 20   // space for value label above bar
  const LEFT   = 28   // y-axis label space
  const TOTAL_H = H + BOTTOM + TOP
  const totalW = Math.max(data.length * (BAR_W + GAP) - GAP + LEFT, 160)

  const gridLines = [0, 25, 50, 75, 100]

  return (
    <div style={chart.wrap}>
      <svg
        viewBox={`0 0 ${totalW} ${TOTAL_H}`}
        width="100%"
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Grid lines + y-axis labels */}
        {gridLines.map(v => {
          const y = TOP + H - (v / 100) * H
          return (
            <g key={v}>
              <line
                x1={LEFT} y1={y}
                x2={totalW} y2={y}
                stroke={v === 0 ? '#C8C8C8' : '#EBEBEB'}
                strokeWidth={v === 0 ? 1 : 0.5}
              />
              <text
                x={LEFT - 4} y={y + 3.5}
                fontSize="7" fill="#A0A0A0"
                textAnchor="end" fontFamily="'Outfit', sans-serif"
              >
                {v}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const pct   = clamp(d.pct)
          const x     = LEFT + i * (BAR_W + GAP)
          const barH  = (pct / 100) * H
          const y     = TOP + H - barH
          const color = gradeColor(pct)

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x} y={y}
                width={BAR_W} height={barH}
                rx={BAR_R} ry={BAR_R}
                fill={color}
                opacity="0.88"
              />

              {/* Value above bar */}
              <text
                x={x + BAR_W / 2} y={y - 4}
                fontSize="7.5" fill={color}
                textAnchor="middle" fontWeight="700"
                fontFamily="'Outfit', sans-serif"
              >
                {pct}%
              </text>

              {/* Subject label */}
              <text
                x={x + BAR_W / 2} y={TOP + H + 12}
                fontSize="7" fill="#888"
                textAnchor="middle"
                fontFamily="'Outfit', sans-serif"
              >
                {d.label}
              </text>

              {/* Date label */}
              <text
                x={x + BAR_W / 2} y={TOP + H + 23}
                fontSize="6.5" fill="#AAAAAA"
                textAnchor="middle"
                fontFamily="'Outfit', sans-serif"
              >
                {d.date}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const chart = {
  wrap: { maxWidth: 360, margin: '0 auto',
    padding: '8px 0 4px',
    overflowX: 'auto',
  },
  empty: {
    textAlign: 'center',
    padding: '32px 0 24px',
  },
  emptyIcon: { fontSize: '2rem', marginBottom: 8 },
  emptyText: { color: 'var(--charcoal-lt)', fontSize: '0.88rem', marginBottom: 8 },
  emptyLink: { color: 'var(--forest-lt)', fontWeight: 600, fontSize: '0.85rem' },
}

/* ── Radial progress ring ────────────────────────────────── */
function Ring({ pct, size = 60 }) {
  const safe  = clamp(pct ?? 0)
  const r     = (size - 10) / 2
  const circ  = 2 * Math.PI * r
  const fill  = safe > 0 ? (safe / 100) * circ : 0
  const color = safe > 0 ? gradeColor(safe) : '#E0E0E0'
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0F0F0" strokeWidth="5" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.7s ease' }}
      />
      <text x={size/2} y={size/2 + 4} textAnchor="middle"
        fontSize={safe > 0 ? '11' : '13'} fontWeight="700"
        fill={safe > 0 ? color : '#C0C0C0'}
        fontFamily="'Outfit', sans-serif"
      >
        {safe > 0 ? `${safe}%` : '—'}
      </text>
    </svg>
  )
}

/* ── Sparkline ───────────────────────────────────────────── */
function Spark({ attempts }) {
  if (!attempts || attempts.length < 2) return null
  const W = 100, H = 28, P = 3
  const pts = attempts.slice(-8)
  const xStep = (W - P * 2) / (pts.length - 1)
  const y = v => H - P - (clamp(v) / 100) * (H - P * 2)
  const points = pts.map((p, i) => `${P + i * xStep},${y(p.pct)}`).join(' ')
  return (
    <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
      <polyline points={points} fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={P + i * xStep} cy={y(p.pct)} r="2.5" fill={gradeColor(clamp(p.pct))} />
      ))}
    </svg>
  )
}

/* ── Main Dashboard ──────────────────────────────────────── */
export default function Dashboard() {
  const { session, profile, signOut } = useAuth()
  const [allResults, setAllResults]   = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => { if (session) loadData() }, [session])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', session.user.id)
      .lte('pct', 100)           // safety: ignore any corrupt rows
      .order('created_at', { ascending: true })
    if (data) setAllResults(data)
    setLoading(false)
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student'
  const role        = profile?.role || 'student'

  const bestScores       = {}
  const attemptsBySubject = {}
  allResults.forEach(r => {
    const key = r.subject?.toLowerCase()
    if (!bestScores[key] || r.pct > bestScores[key]) bestScores[key] = clamp(r.pct)
    if (!attemptsBySubject[key]) attemptsBySubject[key] = []
    attemptsBySubject[key].push({ ...r, pct: clamp(r.pct) })
  })

  const attempted    = Object.values(bestScores)
  const overallAvg   = attempted.length > 0 ? Math.round(attempted.reduce((a, b) => a + b, 0) / attempted.length) : 0
  const totalAttempts = allResults.length
  const bestScore    = attempted.length > 0 ? Math.max(...attempted) : 0
  const recentScores = [...allResults].reverse().slice(0, 5)

  const chartData = [...allResults].reverse().slice(0, 10).reverse().map(r => ({
    pct:   clamp(r.pct),
    label: r.subject?.slice(0, 3) || 'Q',
    date:  new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }))

  return (
    <div className="page-container">
      <Navbar />

      {/* ── Banner ── */}
      <div style={s.banner}>
        <div className="content-wrapper" style={s.bannerInner}>
          <div style={{ flex: 1 }}>
            <p style={s.bannerRole}>
              {role === 'parent' ? '👨‍👩‍👧 Parent Dashboard'
               : role === 'tutor' ? '🎓 Tutor Dashboard'
               : '🎒 Student Dashboard'}
            </p>
            <h1 style={s.bannerTitle}>Welcome back, {displayName.split(' ')[0]}!</h1>
            <p style={s.bannerSub}>
              {totalAttempts === 0
                ? "You haven't taken any quizzes yet — start with Science below!"
                : `${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''} across ${attempted.length} subject${attempted.length > 1 ? 's' : ''}.`}
            </p>
          </div>

          <div style={s.statRow}>
            {[
              { val: totalAttempts || '—', label: 'Attempts' },
              { val: overallAvg > 0 ? `${overallAvg}%` : '—', label: 'Avg Score', color: overallAvg > 0 ? gradeColor(overallAvg) : undefined },
              { val: bestScore > 0 ? `${bestScore}%` : '—',   label: 'Best Score', color: bestScore > 0 ? gradeColor(bestScore) : undefined },
              { val: overallAvg > 0 ? gradeLetter(overallAvg) : '—', label: 'Grade', color: 'var(--gold-lt)' },
            ].map((st, i) => (
              <div key={i} style={s.statBox}>
                <span style={{ ...s.statNum, ...(st.color ? { color: st.color } : {}) }}>{st.val}</span>
                <span style={s.statLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="content-wrapper" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={s.grid}>

          {/* Left column */}
          <div style={{ minWidth: 0 }}>

            {/* Score History card */}
            <div style={s.chartCard}>
              <div style={s.chartHeader}>
                <div>
                  <p style={s.chartTitle}>Score History</p>
                  <p style={s.chartSub}>Your last {chartData.length || 0} quiz attempt{chartData.length !== 1 ? 's' : ''}</p>
                </div>
                {overallAvg > 0 && (
                  <div style={{ ...s.chartBadge, background: gradeColor(overallAvg) + '18', color: gradeColor(overallAvg) }}>
                    Avg {overallAvg}%
                  </div>
                )}
              </div>
              {loading ? <div className="spinner" style={{ margin: '24px auto' }} /> : <ScoreChart data={chartData} />}
            </div>

            {/* Subjects */}
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Subjects</h2>
              <Link to="/subjects" className="btn btn-ghost btn-sm">View All →</Link>
            </div>

            {loading ? <div className="spinner" /> : (
              <div style={s.subGrid}>
                {SUBJECTS.map(sub => {
                  const key      = sub.name.toLowerCase()
                  const best     = bestScores[key] ?? bestScores[sub.key] ?? null
                  const attempts = attemptsBySubject[key] || attemptsBySubject[sub.key] || []
                  return (
                    <Link key={sub.key} to={sub.available ? `/quiz/${sub.key}` : '/subjects'} style={s.subCard}>
                      <Ring pct={best ?? 0} size={60} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ ...s.subDot, background: sub.color }}>{sub.emoji}</span>
                          <span style={s.subName}>{sub.name}</span>
                        </div>
                        {best !== null ? (
                          <>
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: gradeColor(best), marginBottom: 2 }}>
                              Best {best}% · Grade {gradeLetter(best)} · {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
                            </p>
                            <Spark attempts={attempts} />
                          </>
                        ) : (
                          <p style={{ fontSize: '0.72rem', color: '#AAA', fontStyle: 'italic' }}>
                            {sub.available ? 'Not attempted yet' : 'Coming soon'}
                          </p>
                        )}
                      </div>
                      {sub.available && (
                        <span style={s.subBadge}>{best !== null ? 'Retry →' : 'Start →'}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick action */}
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>🚀 Quick Revision</p>
              <p style={s.sideCardDesc}>Jump straight into a Science session.</p>
              <Link to="/quiz/science" className="btn btn-primary btn-full" style={{ marginTop: 14, fontSize: '0.9rem' }}>
                {bestScores['science'] ? 'Retry Science →' : 'Start Science →'}
              </Link>
            </div>

            {/* Mini subject circles */}
            <div style={{ ...s.sideCard, padding: '18px 16px' }}>
              <p style={s.sideCardTitle}>🎯 Overview</p>
              <div style={s.circleGrid}>
                {SUBJECTS.map(sub => {
                  const best = bestScores[sub.name.toLowerCase()] ?? bestScores[sub.key] ?? 0
                  return (
                    <div key={sub.key} style={{ textAlign: 'center' }}>
                      <Ring pct={best} size={50} />
                      <p style={{ fontSize: '0.62rem', color: '#999', marginTop: 3, fontWeight: 600 }}>
                        {sub.emoji} {sub.name.split(' ')[0]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div style={s.sideCard}>
              <p style={s.sideCardTitle}>📋 Recent Activity</p>
              {recentScores.length === 0 ? (
                <p style={{ color: '#AAA', fontSize: '0.83rem', textAlign: 'center', padding: '16px 0' }}>
                  No attempts yet
                </p>
              ) : recentScores.map((r, i) => (
                <div key={i} style={s.actRow}>
                  <div>
                    <p style={s.actSubject}>{r.subject}</p>
                    <p style={s.actDate}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ ...s.actScore, color: gradeColor(clamp(r.pct)) }}>{clamp(r.pct)}%</p>
                    <p style={{ ...s.actGrade, color: gradeColor(clamp(r.pct)) }}>Grade {gradeLetter(clamp(r.pct))}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div style={s.tipCard}>
              <p style={s.tipBadge}>💡 Tip</p>
              <p style={s.tipText}>
                {totalAttempts === 0
                  ? 'Start with Science — it\'s available now.'
                  : overallAvg >= 70
                  ? 'Great scores! Consistency is key — keep going.'
                  : 'Review explanations after each wrong answer.'}
              </p>
            </div>

            <button onClick={async () => { await signOut(); navigate('/') }} style={s.signOut}>
              ← Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  banner:      { background: 'var(--forest)', padding: '36px 0 40px' },
  bannerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  bannerRole:  { color: 'var(--sage-lt)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  bannerTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.4rem)', color: 'var(--ivory)', marginBottom: 8 },
  bannerSub:   { color: 'rgba(245,240,232,0.6)', fontSize: '0.9rem' },
  statRow:     { display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 },
  statBox:     { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 64 },
  statNum:     { display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1 },
  statLabel:   { display: 'block', fontSize: '0.64rem', color: 'var(--sage-lt)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 },

  grid:        { display: 'grid', gridTemplateColumns: '1fr 288px', gap: 24, alignItems: 'start' },

  chartCard:   { background: 'var(--white)', borderRadius: 16, border: '1px solid var(--ivory-dk)', padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(27,61,47,0.07)' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  chartTitle:  { fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--forest)', marginBottom: 2 },
  chartSub:    { fontSize: '0.75rem', color: '#AAA' },
  chartBadge:  { fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 100 },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--forest)' },

  subGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 },
  subCard:  { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s, transform 0.15s' },
  subDot:   { width: 22, height: 22, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 },
  subName:  { fontWeight: 600, fontSize: '0.88rem', color: 'var(--charcoal)' },
  subBadge: { fontSize: '0.7rem', fontWeight: 700, background: '#fef3cd', color: '#856404', padding: '3px 9px', borderRadius: 100, flexShrink: 0, alignSelf: 'flex-start' },

  sideCard:     { background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderRadius: 14, padding: '20px', marginBottom: 14, boxShadow: '0 1px 6px rgba(27,61,47,0.07)' },
  sideCardTitle:{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--forest)', marginBottom: 5 },
  sideCardDesc: { color: 'var(--charcoal-lt)', fontSize: '0.83rem', lineHeight: 1.55 },
  circleGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 },

  actRow:     { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--ivory-dk)' },
  actSubject: { fontSize: '0.83rem', fontWeight: 600, color: 'var(--charcoal)' },
  actDate:    { fontSize: '0.7rem', color: '#AAA' },
  actScore:   { fontSize: '0.88rem', fontWeight: 700 },
  actGrade:   { fontSize: '0.7rem', fontWeight: 600 },

  tipCard: { background: 'var(--forest)', borderRadius: 14, padding: '18px', marginBottom: 12 },
  tipBadge:{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 6, letterSpacing: '0.04em' },
  tipText: { fontSize: '0.83rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.6 },

  signOut: { width: '100%', background: 'var(--white)', border: '1.5px solid var(--ivory-dk)', color: 'var(--charcoal-lt)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', padding: '11px', transition: 'all 0.2s' },
}
