import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function DashboardShell({ title, navItems }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Crew Hub</h2>
          <p className="text-xs text-gray-500">{title}</p>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <p className="truncate text-sm font-medium text-gray-700">{user?.name}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-md border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardShell
