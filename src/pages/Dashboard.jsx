import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science', name: 'Science', emoji: '🔬', color: '#1B3D2F' },
  { key: 'english', name: 'English', emoji: '✏️', color: '#2D5A45' },
  { key: 'maths', name: 'Mathematics', emoji: '🔢', color: '#3F7A5E' },
  { key: 'setswana', name: 'Setswana', emoji: '🗣️', color: '#1B3D2F' },
  { key: 'social', name: 'Social Studies', emoji: '🌍', color: '#2D5A45' },
  { key: 'rme', name: 'RME', emoji: '📖', color: '#3F7A5E' },
]

export default function Dashboard() {
  const { session, profile, signOut } = useAuth()
  const [recentScores, setRecentScores] = useState([])
  const [subjectProgress, setSubjectProgress] = useState({})
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
      .order('created_at', { ascending: false })

    if (data) {
      setRecentScores(data.slice(0, 5))

      // Build best score per subject from real data
      const progress = {}
      data.forEach(r => {
        const key = r.subject?.toLowerCase()
        if (!progress[key] || r.pct > progress[key]) {
          progress[key] = r.pct
        }
      })
      setSubjectProgress(progress)
    }
    setLoading(false)
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student'
  const role = profile?.role || 'student'

  // Overall = average of best scores, 0 if no attempts
  const attempted = Object.values(subjectProgress)
  const overallProgress = attempted.length > 0
    ? Math.round(attempted.reduce((a, b) => a + b, 0) / attempted.length)
    : 0

  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.wrapper}>

        {/* Banner */}
        <div style={styles.banner}>
          <div style={styles.bannerInner} className="content-wrapper">
            <div>
              <p style={styles.bannerLabel}>
                {role === 'parent' ? '👨‍👩‍👧 Parent Dashboard' : role === 'tutor' ? '🎓 Tutor Dashboard' : '🎒 Student Dashboard'}
              </p>
              <h1 style={styles.bannerTitle}>Welcome back, {displayName.split(' ')[0]}!</h1>
              <p style={styles.bannerSubtitle}>
                {role === 'student'
                  ? overallProgress > 0
                    ? `Your best average score across attempted subjects is ${overallProgress}%.`
                    : "You haven't taken any quizzes yet — start with Science below!"
                  : role === 'parent'
                  ? "Your child's progress summary is below."
                  : 'Manage your students and track their performance.'}
              </p>
            </div>
            <div style={styles.bannerStat}>
              <div style={styles.statRing}>
                <span style={styles.statNumber}>{overallProgress > 0 ? `${overallProgress}%` : '—'}</span>
                <span style={styles.statLabel}>{overallProgress > 0 ? 'Avg Score' : 'No data yet'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60 }}>
          <div style={styles.grid}>

            {/* Subjects */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Subjects</h2>
                <Link to="/subjects" className="btn btn-ghost btn-sm">View All →</Link>
              </div>

              {loading ? (
                <div className="spinner" />
              ) : (
                <div style={styles.subjectsGrid}>
                  {SUBJECTS.map(sub => {
                    const pct = subjectProgress[sub.name.toLowerCase()] ?? subjectProgress[sub.key] ?? null
                    const attempted = pct !== null
                    return (
                      <Link
                        key={sub.key}
                        to={sub.key === 'science' ? '/quiz/science' : '/subjects'}
                        style={styles.subCard}
                      >
                        <div style={{ ...styles.subIcon, background: sub.color }}>{sub.emoji}</div>
                        <div style={styles.subInfo}>
                          <p style={styles.subName}>{sub.name}</p>
                          {attempted ? (
                            <>
                              <div className="progress-bar" style={{ marginTop: 6 }}>
                                <div className="progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <p style={styles.subPct}>Best score: {pct}%</p>
                            </>
                          ) : (
                            <>
                              <div className="progress-bar" style={{ marginTop: 6 }}>
                                <div className="progress-fill" style={{ width: '0%' }} />
                              </div>
                              <p style={{ ...styles.subPct, color: 'var(--charcoal-lt)', fontStyle: 'italic' }}>
                                {sub.key === 'science' ? 'Not attempted yet' : 'Coming soon'}
                              </p>
                            </>
                          )}
                        </div>
                        {sub.key === 'science' && (
                          <span className="badge badge-gold" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                            {attempted ? 'Retry →' : 'Start →'}
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
                  {subjectProgress['science'] ? 'Retry Science Quiz →' : 'Start Science Quiz →'}
                </Link>
              </div>

              <div style={styles.recentCard} className="card">
                <h3 style={styles.qaTitle}>📋 Recent Activity</h3>
                {recentScores.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--charcoal-lt)', fontSize: '0.88rem' }}>
                    No quiz attempts yet.<br />
                    <Link to="/quiz/science" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>
                      Take your first quiz →
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
                      <span style={{ ...styles.activityScore, color: r.pct >= 70 ? 'var(--success)' : r.pct >= 50 ? 'var(--gold-dk)' : 'var(--error)' }}>
                        {r.score}/{r.total} ({r.pct}%)
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.tipCard}>
                <p style={styles.tipBadge}>💡 Study Tip</p>
                <p style={styles.tipText}>
                  Consistent short sessions beat long cramming. Aim for 20 minutes per subject, every day.
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
  banner: { background: 'var(--forest)', padding: '40px 0 44px' },
  bannerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  bannerLabel: { color: 'var(--sage-lt)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  bannerTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: 'var(--ivory)', marginBottom: 8 },
  bannerSubtitle: { color: 'rgba(245,240,232,0.65)', fontSize: '0.97rem' },
  bannerStat: { flexShrink: 0 },
  statRing: { width: 96, height: 96, borderRadius: '50%', border: '3px solid var(--gold)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.1)' },
  statNumber: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold-lt)', fontWeight: 700 },
  statLabel: { fontSize: '0.65rem', color: 'var(--sage-lt)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'center', padding: '0 4px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--forest)' },
  subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  subCard: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderRadius: 'var(--radius-md)', padding: '16px 18px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s', cursor: 'pointer' },
  subIcon: { width: 44, height: 44, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 },
  subInfo: { flex: 1, minWidth: 0 },
  subName: { fontWeight: 600, fontSize: '0.95rem', color: 'var(--charcoal)', marginBottom: 2 },
  subPct: { fontSize: '0.75rem', color: 'var(--forest-lt)', marginTop: 4, fontWeight: 600 },
  quickAction: { padding: '24px', marginBottom: 16 },
  qaTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--forest)', marginBottom: 6 },
  qaDesc: { color: 'var(--charcoal-lt)', fontSize: '0.88rem', lineHeight: 1.6 },
  recentCard: { marginBottom: 16 },
  activityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ivory-dk)' },
  activitySubject: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal)', display: 'block' },
  activityDate: { fontSize: '0.75rem', color: 'var(--charcoal-lt)' },
  activityScore: { fontSize: '0.88rem', fontWeight: 700, flexShrink: 0 },
  tipCard: { background: 'var(--forest)', borderRadius: 'var(--radius-md)', padding: '20px', color: 'var(--ivory)', marginBottom: 12 },
  tipBadge: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 8, letterSpacing: '0.04em' },
  tipText: { fontSize: '0.88rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.65 },
  signOutBtn: { background: 'var(--white)', border: '1.5px solid var(--ivory-dk)', color: 'var(--charcoal-lt)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: '12px' },
}
