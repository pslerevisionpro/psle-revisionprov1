import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import StudentAuth from './pages/StudentAuth'
import ParentAuth from './pages/ParentAuth'
import TutorAuth from './pages/TutorAuth'
import Dashboard from './pages/Dashboard'
import SubjectList from './pages/SubjectList'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import ResetPassword from './pages/ResetPassword'

function GuestOrAuth({ children }) {
  const isGuest = typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('guest') === 'true' ||
     sessionStorage.getItem('rp_guest_mode') === 'true')
  if (isGuest) return children
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student-auth" element={<StudentAuth />} />
        <Route path="/parent-auth" element={<ParentAuth />} />
        <Route path="/tutor-auth" element={<TutorAuth />} />
        <Route path="/quiz/:subject" element={<GuestOrAuth><Quiz /></GuestOrAuth>} />
        <Route path="/results" element={<GuestOrAuth><Results /></GuestOrAuth>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
        <Route path="*" element={
          <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', gap:16 }}>
            <span style={{ fontSize:'3rem' }}>📭</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', color:'var(--forest)' }}>Page not found</h2>
            <a href="/" className="btn btn-primary">Go Home</a>
          </div>
        } />
      </Routes>
    </AuthProvider>
  )
}
