import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>✦</span>
          <span>
            <span style={styles.brandMain}>PSLE</span>
            <span style={styles.brandSub}> RevisionPro</span>
          </span>
        </Link>

        <div style={styles.actions}>
          {session ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
              <button onClick={handleSignOut} className="btn btn-outline btn-sm">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/student-auth" className="btn btn-ghost btn-sm">Student</Link>
              <Link to="/parent-auth" className="btn btn-ghost btn-sm">Parent</Link>
              <Link to="/tutor-auth" className="btn btn-primary btn-sm">Tutor Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: 'var(--forest)',
    borderBottom: '1px solid rgba(201,168,76,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(27,61,47,0.25)',
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  brandIcon: {
    color: 'var(--gold)',
    fontSize: '1.3rem',
  },
  brandMain: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--gold-lt)',
    letterSpacing: '0.04em',
  },
  brandSub: {
    fontFamily: 'var(--font-body)',
    fontSize: '1.1rem',
    fontWeight: 400,
    color: 'var(--sage-lt)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
}
