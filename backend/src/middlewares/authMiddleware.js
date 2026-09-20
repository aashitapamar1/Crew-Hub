const { verifyToken } = require('../utils/jwt')
const prisma = require('../config/db')

async function protect(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = verifyToken(token)

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' })
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' })
    }
    next()
  }
}

module.exports = { protect, authorize }
