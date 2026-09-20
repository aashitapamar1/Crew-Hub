import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DASHBOARD_BY_ROLE = {
  ADMIN: '/dashboard',
  CLIENT: '/client/dashboard',
  FREELANCER: '/freelancer/dashboard',
}

function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={DASHBOARD_BY_ROLE[user.role] || '/login'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
