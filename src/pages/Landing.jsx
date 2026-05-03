import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  function startGuestQuiz() {
    sessionStorage.setItem('rp_guest_mode', 'true')
    sessionStorage.setItem('rp_guest_start', Date.now().toString())
    navigate('/quiz/science?guest=true')
  }

  return (
    <div className="page-container">
      <Navbar />

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

      <section style={styles.hero}>
        <div style={styles.heroBg} aria-hidden="true" />
        <div className="content-wrapper" style={styles.heroContent}>
          <div style={styles.heroBadge}><span>✦</span> Botswana Standard 6 & 7</div>
          <h1 style={styles.heroTitle}>
            Revise smarter.<br />
            <span style={styles.heroTitleGold}>Score higher.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            PSLE RevisionPro gives every Botswana student expert-quality practice questions,
            instant feedback, and progress tracking — all aligned to the national curriculum.
          </p>
          <div style={styles.heroButtons}>
            <button onClick={startGuestQuiz} className="btn btn-gold" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Try 3 Free Questions →
            </button>
            <Link to="/parent-auth" className="btn btn-outline" style={{ color: 'var(--ivory)', borderColor: 'rgba(245,240,232,0.4)', fontSize: '1rem' }}>
              I'm a Parent
            </Link>
          </div>
          <p style={styles.heroNote}>
            No sign up needed to try · No data collected · Full access requires parent consent
          </p>
        </div>
      </section>

      <section style={styles.trustBar}>
        <div className="content-wrapper" style={styles.trustBarInner}>
          <span style={styles.trustItem}>🔒 No minor data collected without parental consent</span>
          <span style={styles.trustDot}>•</span>
          <span style={styles.trustItem}>📋 Botswana Data Protection Act 2018 compliant</span>
          <span style={styles.trustDot}>•</span>
          <span style={styles.trustItem}>👨‍👩‍👧 Parent controls everything</span>
        </div>
      </section>

      <section style={styles.subjectsStrip}>
        <div className="content-wrapper">
          <p style={styles.stripLabel}>Covers all PSLE subjects</p>
          <div style={styles.subjectPills}>
            {subjects.map(s => (
              <span key={s.name} style={{ ...styles.pill, background: s.color }}>{s.emoji} {s.name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ background: 'var(--white)' }}>
        <div className="content-wrapper">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>How it works for families</h2>
            <p style={styles.sectionSubtitle}>Designed so children can explore safely, and parents stay in control.</p>
          </div>
          <div style={styles.stepsGrid}>
            <StepCard num="1" title="Child tries it free" desc="Your child can try 3 questions with no account and no data collected — just to see if they like it." icon="🎮" />
            <StepCard num="2" title="They show you their score" desc="After the trial, they get a prompt designed to show you — their parent — so you can decide together." icon="📊" />
            <StepCard num="3" title="You sign up and consent" desc="You create the account, give parental consent, and set up your child's login. You stay in control." icon="✅" />
            <StepCard num="4" title="Full access unlocked" desc="Your child gets their personal dashboard, progress tracking across all subjects, and mock exam access." icon="🚀" />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="content-wrapper">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Everything a student needs to excel</h2>
            <p style={styles.sectionSubtitle}>Built by educators who understand the Botswana PSLE inside and out.</p>
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

      <section className="section-pad" style={{ background: 'var(--white)' }}>
        <div className="content-wrapper">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your portal, your view</h2>
            <p style={styles.sectionSubtitle}>Separate dashboards tailored for students, parents, and tutors.</p>
          </div>
          <div style={styles.portalsGrid}>
            <PortalCard emoji="🎒" title="Students" desc="Practice questions, mock exams, instant explanations, and a personal dashboard tracking your progress by subject." link="/student-auth" linkLabel="Sign In / Sign Up" accent="var(--forest)" />
            <PortalCard emoji="👨‍👩‍👧" title="Parents" desc="Create your child's account, give consent, monitor performance, and stay in full control of their learning data." link="/parent-auth" linkLabel="Sign In / Sign Up" accent="var(--gold-dk)" />
            <PortalCard emoji="🎓" title="Tutors" desc="Track multiple students, identify weak areas, assign targeted practice, and supplement your sessions with data." link="/tutor-auth" linkLabel="Sign In / Register" accent="var(--sage)" />
          </div>
        </div>
      </section>

      <section style={styles.ctaBanner}>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--ivory)', marginBottom: 12 }}>
            Start your child's PSLE preparation today.
          </h2>
          <p style={{ color: 'var(--sage-lt)', marginBottom: 28, fontSize: '1.05rem' }}>
            Join hundreds of Botswana families using RevisionPro to prepare with confidence.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startGuestQuiz} className="btn btn-gold" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Try Free — No Sign Up →
            </button>
            <Link to="/parent-auth" className="btn btn-outline" style={{ color: 'var(--ivory)', borderColor: 'rgba(245,240,232,0.4)', fontSize: '1rem', padding: '14px 32px' }}>
              Parent Sign Up
            </Link>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div className="content-wrapper" style={styles.footerInner}>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold-lt)', fontWeight: 700 }}>✦ PSLE RevisionPro</span>
            <p style={{ color: 'var(--charcoal-lt)', marginTop: 6, fontSize: '0.85rem' }}>Botswana's trusted PSLE revision platform.</p>
          </div>
          <div style={styles.footerLinks}>
            <Link to="/student-auth" style={styles.footerLink}>Students</Link>
            <Link to="/parent-auth" style={styles.footerLink}>Parents</Link>
            <Link to="/tutor-auth" style={styles.footerLink}>Tutors</Link>
          </div>
          <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.8rem' }}>© {new Date().getFullYear()} PSLE RevisionPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function StepCard({ num, title, desc, icon }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepNum}>{num}</div>
      <div style={styles.stepIcon}>{icon}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepDesc}>{desc}</p>
    </div>
  )
}

function PortalCard({ emoji, title, desc, link, linkLabel, accent }) {
  return (
    <div className="card card-elevated" style={{ textAlign: 'center', padding: '36px 28px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{emoji}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 10, color: accent }}>{title}</h3>
      <p style={{ color: 'var(--charcoal-lt)', fontSize: '0.93rem', lineHeight: 1.7, marginBottom: 24 }}>{desc}</p>
      <Link to={link} className="btn btn-outline btn-sm" style={{ borderColor: accent, color: accent }}>{linkLabel}</Link>
    </div>
  )
}

const styles = {
  signInBar: { background: 'var(--ivory-dk)', borderBottom: '1px solid #e0d9c8', padding: '10px 0' },
  signInBarInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  signInBarText: { fontSize: '0.85rem', color: 'var(--charcoal-lt)', fontWeight: 500 },
  signInBarLinks: { display: 'flex', alignItems: 'center', gap: 12 },
  signInLink: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--forest)' },
  signInDivider: { color: '#ccc', fontSize: '0.85rem' },
  hero: { background: 'var(--forest)', position: 'relative', overflow: 'hidden', padding: '90px 0 80px' },
  heroBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(143,175,126,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  heroContent: { position: 'relative', maxWidth: 640 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)', color: 'var(--gold-lt)', padding: '5px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 20 },
  heroTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 700, color: 'var(--ivory)', marginBottom: 20 },
  heroTitleGold: { color: 'var(--gold)' },
  heroSubtitle: { fontSize: '1.05rem', color: 'rgba(245,240,232,0.75)', maxWidth: 520, lineHeight: 1.75, marginBottom: 32 },
  heroButtons: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 },
  heroNote: { fontSize: '0.8rem', color: 'rgba(245,240,232,0.45)' },
  trustBar: { background: 'var(--forest-mid)', padding: '12px 0' },
  trustBarInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 16 },
  trustItem: { fontSize: '0.82rem', color: 'var(--sage-lt)', fontWeight: 500 },
  trustDot: { color: 'rgba(181,204,168,0.4)', fontSize: '0.8rem' },
  subjectsStrip: { background: 'var(--ivory-dk)', padding: '20px 0' },
  stripLabel: { fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal-lt)', marginBottom: 12 },
  subjectPills: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  pill: { padding: '6px 14px', borderRadius: 100, fontSize: '0.83rem', fontWeight: 600, color: 'var(--ivory)' },
  sectionHeader: { textAlign: 'center', marginBottom: 48 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: 'var(--forest)', marginBottom: 12 },
  sectionSubtitle: { color: 'var(--charcoal-lt)', fontSize: '1rem', maxWidth: 520, margin: '0 auto' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 },
  stepCard: { textAlign: 'center', padding: '28px 20px', background: 'var(--ivory)', borderRadius: 'var(--radius-md)', border: '1px solid var(--ivory-dk)' },
  stepNum: { width: 32, height: 32, borderRadius: '50%', background: 'var(--forest)', color: 'var(--gold-lt)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
  stepIcon: { fontSize: '1.8rem', marginBottom: 12 },
  stepTitle: { fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--forest)', marginBottom: 8 },
  stepDesc: { color: 'var(--charcoal-lt)', fontSize: '0.88rem', lineHeight: 1.65 },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  featureCard: { padding: '28px' },
  featureIcon: { fontSize: '1.8rem', marginBottom: 14 },
  featureTitle: { fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--forest)', marginBottom: 8 },
  featureDesc: { color: 'var(--charcoal-lt)', fontSize: '0.92rem', lineHeight: 1.65 },
  portalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },
  ctaBanner: { background: 'var(--forest)', padding: '70px 0' },
  footer: { background: 'var(--ivory-dk)', padding: '40px 0', borderTop: '1px solid #e0d9c8' },
  footerInner: { display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: 24 },
  footerLink: { color: 'var(--charcoal-lt)', fontSize: '0.9rem', fontWeight: 500 },
}
