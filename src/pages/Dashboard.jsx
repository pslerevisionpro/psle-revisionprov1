import { useAuth } from '../context/AuthContext'
import StudentDashboard from './StudentDashboard'
import ParentDashboard from './ParentDashboard'
import TutorDashboard from './TutorDashboard'

export default function Dashboard() {
  const { profile, session } = useAuth()
  const role = profile?.role || 'student'

  if (role === 'parent') return <ParentDashboard />
  if (role === 'tutor')  return <TutorDashboard />
  return <StudentDashboard />
}
