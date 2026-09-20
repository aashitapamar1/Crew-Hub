const prisma = require('../config/db')

async function listNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  res.status(200).json({ success: true, notifications, unreadCount })
}

async function markAsRead(req, res) {
  const { id } = req.params

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Notification not found' })
  }

  const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } })
  res.status(200).json({ success: true, notification: updated })
}

async function markAllAsRead(req, res) {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } })
  res.status(200).json({ success: true, message: 'All notifications marked as read' })
}

module.exports = { listNotifications, markAsRead, markAllAsRead }
