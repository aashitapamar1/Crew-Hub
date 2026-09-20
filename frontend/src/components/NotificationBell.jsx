import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../context/NotificationContext'

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-medium text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                    n.isRead ? 'bg-white' : 'bg-blue-50'
                  }`}
                >
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="mt-0.5 text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM8.5 17a1.5 1.5 0 003 0h-3z" />
    </svg>
  )
}

export default NotificationBell
