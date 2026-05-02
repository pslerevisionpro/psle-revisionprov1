import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'english', name: 'English', emoji: '✏️', color: '#1B3D2F', progress: 68 },
  { key: 'setswana', name: 'Setswana', emoji: '🗣️', color: '#2D5A45', progress: 45 },
  { key: 'maths', name: 'Mathematics', emoji: '🔢', color: '#3F7A5E', progress: 72 },
  { key: 'science', name: 'Science', emoji: '🔬', color: '#1B3D2F', progress: 55 },
  { key: 'social', name: 'Social Studies', emoji: '🌍', color: '#2D5A45', progress: 80 },
  { key: 'rme', name: 'RME', emoji: '📖', color: '#3F7A5E', progress: 33 },
]

export default function Dashboard() {
  const { session, profile } = useAuth()
  const [recentScores, setRecentScores] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (session) loadRecentScores()
  }, [session])

  async function loadRecentScores() {
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setRecentScores(data)
  }

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student'
  const role = profile?.role || 'student'
  const overallProgress = Math.round(SUBJECTS.reduce((a, s) => a + s.progress, 0) / SUBJECTS.length)

  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.wrapper}>
        {/* Welcome banner */}
        <div style={styles.banner}>
          <div style={styles.bannerInner} className="content-wrapper">
            <div>
              <p style={styles.bannerLabel}>
                {role === 'parent' ? '👨‍👩‍👧 Parent Dashboard' : role === 'tutor' ? '🎓 Tutor Dashboard' : '🎒 Student Dashboard'}
              </p>
              <h1 style={styles.bannerTitle}>Welcome back, {displayName.split(' ')[0]}!</h1>
              <p style={styles.bannerSubtitle}>
                {role === 'student'
                  ? `Keep going — you're ${overallProgress}% through your revision targets.`
                  : role === 'parent'
                  ? 'Your child\'s progress summary is below.'
                  : 'Manage your students and track their performance.'}
              </p>
            </div>
            <div style={styles.bannerStat}>
              <div style={styles.statRing}>
                <span style={styles.statNumber}>{overallProgress}%</span>
                <span style={styles.statLabel}>Overall</span>
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
              <div style={styles.subjectsGrid}>
                {SUBJECTS.map(sub => (
                  <Link key={sub.key} to={sub.key === 'science' ? '/quiz/science' : '/subjects'} style={styles.subCard}>
                    <div style={{ ...styles.subIcon, background: sub.color }}>{sub.emoji}</div>
                    <div style={styles.subInfo}>
                      <p style={styles.subName}>{sub.name}</p>
                      <div className="progress-bar" style={{ marginTop: 6 }}>
                        <div className="progress-fill" style={{ width: `${sub.progress}%` }} />
                      </div>
                      <p style={styles.subPct}>{sub.progress}% complete</p>
                    </div>
                    {sub.key === 'science' && (
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Practice →</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {/* Quick action */}
              <div style={styles.quickAction} className="card card-elevated">
                <h3 style={styles.qaTitle}>🚀 Quick Revision</h3>
                <p style={styles.qaDesc}>Jump straight into a Science practice session.</p>
                <Link to="/quiz/science" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
                  Start Science Quiz →
                </Link>
              </div>

              {/* Recent activity */}
              <div style={styles.recentCard} className="card">
                <h3 style={styles.qaTitle}>📋 Recent Activity</h3>
                {recentScores.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--charcoal-lt)', fontSize: '0.88rem' }}>
                    No quiz attempts yet.<br />
                    <Link to="/quiz/science" style={{ color: 'var(--forest-lt)', fontWeight: 600 }}>Take your first quiz →</Link>
                  </div>
                ) : (
                  recentScores.map((r, i) => (
                    <div key={i} style={styles.activityRow}>
                      <span style={styles.activitySubject}>{r.subject || 'Science'}</span>
                      <span style={{ ...styles.activityScore, color: r.pct >= 70 ? 'var(--success)' : 'var(--gold-dk)' }}>
                        {r.score}/{r.total} ({r.pct}%)
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Tip */}
              <div style={styles.tipCard}>
                <p style={styles.tipBadge}>💡 Study Tip</p>
                <p style={styles.tipText}>
                  Consistent short sessions beat long cramming. Aim for 20 minutes per subject, every day.
                </p>
              </div>
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
  statNumber: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold-lt)', fontWeight: 700 },
  statLabel: { fontSize: '0.7rem', color: 'var(--sage-lt)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--forest)' },
  subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  subCard: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--white)', border: '1px solid var(--ivory-dk)', borderRadius: 'var(--radius-md)', padding: '16px 18px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s, transform 0.15s', cursor: 'pointer' },
  subIcon: { width: 44, height: 44, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 },
  subInfo: { flex: 1, minWidth: 0 },
  subName: { fontWeight: 600, fontSize: '0.95rem', color: 'var(--charcoal)', marginBottom: 2 },
  subPct: { fontSize: '0.75rem', color: 'var(--charcoal-lt)', marginTop: 4 },

  quickAction: { padding: '24px', marginBottom: 16 },
  qaTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--forest)', marginBottom: 6 },
  qaDesc: { color: 'var(--charcoal-lt)', fontSize: '0.88rem', lineHeight: 1.6 },

  recentCard: { marginBottom: 16 },
  activityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ivory-dk)' },
  activitySubject: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal)' },
  activityScore: { fontSize: '0.88rem', fontWeight: 700 },

  tipCard: { background: 'var(--forest)', borderRadius: 'var(--radius-md)', padding: '20px', color: 'var(--ivory)' },
  tipBadge: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 8, letterSpacing: '0.04em' },
  tipText: { fontSize: '0.88rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.65 },
}
