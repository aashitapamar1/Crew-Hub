import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Profile from '../pages/Profile'

import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/admin/Dashboard'
import ClientList from '../pages/admin/clients/ClientList'
import ClientForm from '../pages/admin/clients/ClientForm'
import ClientDetails from '../pages/admin/clients/ClientDetails'
import FreelancerList from '../pages/admin/freelancers/FreelancerList'
import FreelancerForm from '../pages/admin/freelancers/FreelancerForm'
import FreelancerDetails from '../pages/admin/freelancers/FreelancerDetails'

import ClientLayout from '../layouts/ClientLayout'
import ClientDashboard from '../pages/client/Dashboard'

import FreelancerLayout from '../layouts/FreelancerLayout'
import FreelancerDashboard from '../pages/freelancer/Dashboard'

const DASHBOARD_BY_ROLE = {
  ADMIN: '/dashboard',
  CLIENT: '/client/dashboard',
  FREELANCER: '/freelancer/dashboard',
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={DASHBOARD_BY_ROLE[user.role]} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />
          <Route path="/freelancers" element={<FreelancerList />} />
          <Route path="/freelancers/new" element={<FreelancerForm />} />
          <Route path="/freelancers/:id" element={<FreelancerDetails />} />
          <Route path="/freelancers/:id/edit" element={<FreelancerForm />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
        <Route element={<ClientLayout />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['FREELANCER']} />}>
        <Route element={<FreelancerLayout />}>
          <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
          <Route path="/freelancer/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
