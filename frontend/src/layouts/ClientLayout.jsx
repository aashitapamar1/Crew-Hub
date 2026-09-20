import DashboardShell from '../components/DashboardShell'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard', end: true },
  { to: '/client/projects', label: 'Projects' },
  { to: '/client/files', label: 'Files' },
  { to: '/client/feedback', label: 'Feedback' },
  { to: '/client/notifications', label: 'Notifications' },
  { to: '/client/profile', label: 'Profile' },
]

function ClientLayout() {
  return <DashboardShell title="Client" navItems={navItems} />
}

export default ClientLayout
