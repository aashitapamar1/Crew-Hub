const crypto = require('crypto')
const bcrypt = require('bcrypt')
const prisma = require('../config/db')
const { generateToken } = require('../utils/jwt')
const sendEmail = require('../utils/sendEmail')

function sanitizeUser(user) {
  const { password, ...safeUser } = user
  return safeUser
}

async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const token = generateToken({ id: user.id, role: user.role })

  res.status(200).json({
    success: true,
    token,
    user: sanitizeUser(user),
  })
}

function logout(req, res) {
  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

async function getMe(req, res) {
  res.status(200).json({ success: true, user: sanitizeUser(req.user) })
}

async function updateProfile(req, res) {
  const { name, phone, profilePicture } = req.body

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(profilePicture !== undefined && { profilePicture }),
    },
  })

  res.status(200).json({ success: true, user: sanitizeUser(updated) })
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  res.status(200).json({ success: true, message: 'Password changed successfully' })
}

async function forgotPassword(req, res) {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success so we don't reveal whether an email is registered.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent',
    })
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

  await prisma.passwordResetToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  })

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`
  await sendEmail({
    to: user.email,
    subject: 'Crew Hub - Password Reset',
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  })

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent',
  })
}

async function resetPassword(req, res) {
  const { token } = req.params
  const { newPassword } = req.body

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: hashedToken } })
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } })
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })

  res.status(200).json({ success: true, message: 'Password reset successfully' })
}

module.exports = {
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
}
