import { useAuth } from '../../context/AuthContext'

function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user?.name}</h1>
      <p className="mt-1 text-gray-500">Here are your assigned projects and tasks.</p>
    </div>
  )
}

export default Dashboard
