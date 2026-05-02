import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  { key: 'science', name: 'Science', emoji: '🔬', description: 'Biology, chemistry, physics, and earth science — all the PSLE topics.', topics: ['Living Things', 'Matter & Materials', 'Forces & Energy', 'Earth & Space'], available: true, color: '#1B3D2F' },
  { key: 'english', name: 'English', emoji: '✏️', description: 'Reading comprehension, grammar, vocabulary, and writing skills.', topics: ['Comprehension', 'Grammar', 'Vocabulary', 'Writing'], available: false, color: '#2D5A45' },
  { key: 'maths', name: 'Mathematics', emoji: '🔢', description: 'Numbers, fractions, geometry, and problem solving.', topics: ['Number Work', 'Fractions', 'Geometry', 'Data Handling'], available: false, color: '#3F7A5E' },
  { key: 'setswana', name: 'Setswana', emoji: '🗣️', description: 'Reading, writing, and oral comprehension in Setswana.', topics: ['Go Bala', 'Go Kwala', 'Puo ya Molomo', 'Dipadi'], available: false, color: '#1B3D2F' },
  { key: 'social', name: 'Social Studies', emoji: '🌍', description: 'Botswana geography, history, civics, and the wider world.', topics: ['History', 'Geography', 'Civics', 'Economics'], available: false, color: '#2D5A45' },
  { key: 'rme', name: 'RME', emoji: '📖', description: 'Religious and moral education — ethics, values, and faiths.', topics: ['Values', 'World Religions', 'Moral Reasoning', 'Community'], available: false, color: '#3F7A5E' },
]

export default function SubjectList() {
  return (
    <div className="page-container">
      <Navbar />
      <div style={styles.header}>
        <div className="content-wrapper">
          <p style={styles.breadcrumb}><Link to="/dashboard" style={{ color: 'var(--sage-lt)' }}>Dashboard</Link> / Subjects</p>
          <h1 style={styles.title}>Choose a Subject</h1>
          <p style={styles.subtitle}>Select a subject to begin practice. More subjects launching soon.</p>
        </div>
      </div>

      <div className="content-wrapper" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={styles.grid}>
          {SUBJECTS.map(sub => (
            <div key={sub.key} style={styles.card} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ ...styles.iconBox, background: sub.color }}>{sub.emoji}</div>
                {sub.available
                  ? <span className="badge badge-green">Available Now</span>
                  : <span className="badge badge-gold">Coming Soon</span>}
              </div>
              <h3 style={styles.subTitle}>{sub.name}</h3>
              <p style={styles.subDesc}>{sub.description}</p>
              <div style={styles.topics}>
                {sub.topics.map(t => (
                  <span key={t} style={styles.topic}>{t}</span>
                ))}
              </div>
              {sub.available ? (
                <Link to={`/quiz/${sub.key}`} className="btn btn-primary btn-full" style={{ marginTop: 20 }}>
                  Start Practice →
                </Link>
              ) : (
                <button className="btn btn-outline btn-full" disabled style={{ marginTop: 20, opacity: 0.5 }}>
                  Coming Soon
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: { background: 'var(--forest)', padding: '40px 0' },
  breadcrumb: { fontSize: '0.82rem', color: 'rgba(245,240,232,0.5)', marginBottom: 10 },
  title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--ivory)', marginBottom: 8 },
  subtitle: { color: 'rgba(245,240,232,0.65)', fontSize: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  card: { padding: '28px', transition: 'transform 0.2s, box-shadow 0.2s' },
  iconBox: { width: 52, height: 52, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' },
  subTitle: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--forest)', marginBottom: 8 },
  subDesc: { color: 'var(--charcoal-lt)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 14 },
  topics: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  topic: { background: 'var(--ivory)', color: 'var(--charcoal-lt)', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 100, border: '1px solid var(--ivory-dk)', fontWeight: 500 },
}
