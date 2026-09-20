import DashboardShell from '../components/DashboardShell'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/freelancers', label: 'Freelancers' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/reports', label: 'Reports' },
  { to: '/ai-insights', label: 'AI Insights' },
  { to: '/profile', label: 'Profile' },
]

function AdminLayout() {
  return <DashboardShell title="Admin" navItems={navItems} />
}

export default AdminLayout
