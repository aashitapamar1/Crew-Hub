import { useNotifications } from '../context/NotificationContext'

function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={`cursor-pointer px-4 py-3 ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                </div>
                <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Notifications
