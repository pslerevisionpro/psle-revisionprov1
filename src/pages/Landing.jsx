import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const features = [
  { icon: '📚', title: 'All 6 PSLE Subjects', desc: 'English, Setswana, Maths, Science, Social Studies & RME — all in one place.' },
  { icon: '🧠', title: 'Instant Explanations', desc: 'Every question includes a clear explanation so students learn from mistakes, not just scores.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Parents and tutors can follow each student\'s improvement over time with visual dashboards.' },
  { icon: '🏆', title: 'Mock Exams', desc: 'Timed practice exams that mirror the real PSLE format to build confidence and exam readiness.' },
  { icon: '👨‍👩‍👧', title: 'Parent Dashboard', desc: 'Stay informed with weekly progress summaries and consent controls for child safety.' },
  { icon: '🎓', title: 'Tutor Tools', desc: 'Tutors can monitor student performance and identify gaps to target their sessions effectively.' },
]

const subjects = [
  { name: 'English', emoji: '✏️', color: '#1B3D2F' },
  { name: 'Setswana', emoji: '🗣️', color: '#2D5A45' },
  { name: 'Mathematics', emoji: '🔢', color: '#3F7A5E' },
  { name: 'Science', emoji: '🔬', color: '#1B3D2F' },
  { name: 'Social Studies', emoji: '🌍', color: '#2D5A45' },
  { name: 'RME', emoji: '📖', color: '#3F7A5E' },
]

export default function Landing() {
  return (
    <div className="page-container">
      <Navbar />

      {/* Sign In Bar */}
      <div style={styles.signInBar}>
        <div className="content-wrapper" style={styles.signInBarInner}>
          <span style={styles.signInBarText}>Already have an account?</span>
          <div style={styles.signInBarLinks}>
            <Link to="/student-auth" style={styles.signInLink}>🎒 Student Sign In</Link>
            <span style={styles.signInDivider}>|</span>
            <Link to="/parent-auth" style={styles.signInLink}>👨‍👩‍👧 Parent Sign In</Link>
            <span style={styles.signInDivider}>|</span>
            <Link to="/tutor-auth" style={styles.signInLink}>🎓 Tutor Sign In</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBg} aria-hidden="true" />
        <div className="content-wrapper" style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span>✦</span> Botswana Standard 6 & 7
          </div>
          <h1 style={styles.heroTitle}>
            Revise smarter.<br />
            <span style={styles.heroTitleGold}>Score higher.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            PSLE RevisionPro gives every Botswana student expert-quality practice questions,
            instant feedback, and progress tracking — all aligned to the national curriculum.
          </p>
          <div style={styles.heroButtons}>
            <Link to="/student-auth" className="btn btn-gold" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Start Revising Free →
            </Link>
            <Link to="/parent-auth" className="btn btn-outline" style={{ color: 'var(--ivory)', borderColor: 'rgba(245,240,232,0.4)', fontSize: '1rem' }}>
              I'm a Parent
            </Link>
          </div>
          <p style={styles.heroNote}>Free trial • No credit card required • Botswana BWP pricing</p>
        </div>
      </section>

      {/* Subjects strip */}
      <section style={styles.subjectsStrip}>
        <div className="content-wrapper">
          <p style={styles.stripLabel}>Covers all PSLE subjects</p>
          <div style={styles.subjectPills}>
            {subjects.map(s => (
              <span key={s.name} style={{ ...styles.pill, background: s.color }}>
                {s.emoji} {s.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-pad" style={{ background: 'var(--white)' }}>
        <div className="content-wrapper">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Everything a student needs to excel</h2>
            <p style={styles.sectionSubtitle}>
              Built by educators who understand the Botswana PSLE inside and out.
            </p>
          </div>
          <div style={styles.featuresGrid}>
            {features.map(f => (
              <div key={f.title} className="card" style={styles.featureCard}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three portals */}
      <section className="section-pad">
        <div className="content-wrapper">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your portal, your view</h2>
            <p style={styles.sectionSubtitle}>Separate dashboards tailored for students, parents, and tutors.</p>
          </div>
          <div style={styles.portalsGrid}>
            <PortalCard
              emoji="🎒"
              title="Students"
              desc="Practice questions, mock exams, instant explanations, and a personal dashboard tracking your progress by subject."
              link="/student-auth"
              linkLabel="Sign In / Sign Up"
              accent="var(--forest)"
            />
            <PortalCard
              emoji="👨‍👩‍👧"
              title="Parents"
              desc="Monitor your child's performance, review activity reports, manage consent settings, and ensure they're revision-ready."
              link="/parent-auth"
              linkLabel="Sign In / Sign Up"
              accent="var(--gold-dk)"
            />
            <PortalCard
              emoji="🎓"
              title="Tutors"
              desc="Track multiple students, identify weak areas, assign targeted practice, and supplement your tutoring sessions with data."
              link="/tutor-auth"
              linkLabel="Sign In / Register"
              accent="var(--sage)"
            />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={styles.ctaBanner}>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--ivory)', marginBottom: 12 }}>
            Start your child's PSLE preparation today.
          </h2>
          <p style={{ color: 'var(--sage-lt)', marginBottom: 28, fontSize: '1.05rem' }}>
            Join hundreds of Botswana families using RevisionPro to prepare with confidence.
          </p>
          <Link to="/student-auth" className="btn btn-gold" style={{ fontSize: '1rem', padding: '14px 36px' }}>
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div className="content-wrapper" style={styles.footerInner}>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold-lt)', fontWeight: 700 }}>
              ✦ PSLE RevisionPro
            </span>
            <p style={{ color: 'var(--charcoal-lt)', marginTop: 6, fontSize: '0.85rem' }}>
              Botswana's trusted PSLE revision platform.
            </p>
          </div>
          <div style={styles.footerLinks}>
            <Link to="/student-auth" style={styles.footerLink}>Students</Link>
            <Link to="/parent-auth" style={styles.footerLink}>Parents</Link>
            <Link to="/tutor-auth" style={styles.footerLink}>Tutors</Link>
          </div>
          <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} PSLE RevisionPro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function PortalCard({ emoji, title, desc, link, linkLabel, accent }) {
  return (
    <div className="card card-elevated" style={{ textAlign: 'center', padding: '36px 28px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{emoji}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 10, color: accent }}>{title}</h3>
      <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.93rem', lineHeight: 1.7, marginBottom: 24 }}>{desc}</p>
      <Link to={link} className="btn btn-outline btn-sm" style={{ borderColor: accent, color: accent }}>
        {linkLabel}
      </Link>
    </div>
  )
}

const styles = {
  signInBar: {
    background: 'var(--ivory-dk)',
    borderBottom: '1px solid var(--ivory-dk)',
    padding: '10px 0',
  },
  signInBarInner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
  },
  signInBarText: {
    fontSize: '0.85rem', color: 'var(--charcoal-lt)', fontWeight: 500,
  },
  signInBarLinks: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  signInLink: {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--forest)', textDecoration: 'none',
    transition: 'color 0.2s',
  },
  signInDivider: {
    color: 'var(--ivory-dk)', fontSize: '0.85rem',
  },
  hero: {
    background: 'var(--forest)',
    position: 'relative',
    overflow: 'hidden',
    padding: '90px 0 80px',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(143,175,126,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', maxWidth: 640 },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)',
    color: 'var(--gold-lt)', padding: '5px 14px', borderRadius: 100,
    fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 20,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
    fontWeight: 700, color: 'var(--ivory)', marginBottom: 20,
  },
  heroTitleGold: { color: 'var(--gold)' },
  heroSubtitle: {
    fontSize: '1.05rem', color: 'rgba(245,240,232,0.75)',
    maxWidth: 520, lineHeight: 1.75, marginBottom: 32,
  },
  heroButtons: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 },
  heroNote: { fontSize: '0.8rem', color: 'rgba(245,240,232,0.45)' },
  subjectsStrip: { background: 'var(--ivory-dk)', padding: '20px 0', borderBottom: '1px solid var(--ivory-dk)' },
  stripLabel: { fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal-lt)', marginBottom: 12 },
  subjectPills: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  pill: { padding: '6px 14px', borderRadius: 100, fontSize: '0.83rem', fontWeight: 600, color: 'var(--ivory)', letterSpacing: '0.02em' },
  sectionHeader: { textAlign: 'center', marginBottom: 48 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: 'var(--forest)', marginBottom: 12 },
  sectionSubtitle: { color: 'var(--charcoal-lt)', fontSize: '1rem', maxWidth: 520, margin: '0 auto' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  featureCard: { padding: '28px' },
  featureIcon: { fontSize: '1.8rem', marginBottom: 14 },
  featureTitle: { fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--forest)', marginBottom: 8 },
  featureDesc: { color: 'var(--charcoal-lt)', fontSize: '0.92rem', lineHeight: 1.65 },
  portalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },
  ctaBanner: { background: 'var(--forest)', padding: '70px 0' },
  footer: { background: 'var(--ivory-dk)', padding: '40px 0', borderTop: '1px solid var(--ivory-dk)' },
  footerInner: { display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: 24 },
  footerLink: { color: 'var(--charcoal-lt)', fontSize: '0.9rem', fontWeight: 500 },
}
