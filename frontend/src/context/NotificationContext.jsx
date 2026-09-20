import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import * as notificationService from '../services/notificationService'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(() => {
    if (!user) return
    notificationService.listNotifications().then((res) => {
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [user, refresh])

  async function markAsRead(id) {
    await notificationService.markAsRead(id)
    refresh()
  }

  async function markAllAsRead() {
    await notificationService.markAllAsRead()
    refresh()
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
