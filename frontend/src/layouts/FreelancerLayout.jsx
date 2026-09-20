import DashboardShell from '../components/DashboardShell'

const navItems = [
  { to: '/freelancer/dashboard', label: 'Dashboard', end: true },
  { to: '/freelancer/projects', label: 'Projects' },
  { to: '/freelancer/tasks', label: 'Tasks' },
  { to: '/freelancer/files', label: 'Files' },
  { to: '/freelancer/notifications', label: 'Notifications' },
  { to: '/freelancer/profile', label: 'Profile' },
]

function FreelancerLayout() {
  return <DashboardShell title="Freelancer" navItems={navItems} />
}

export default FreelancerLayout
