const nodemailer = require('nodemailer')

async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[email skipped, no EMAIL_USER/EMAIL_PASS set] To: ${to} | Subject: ${subject}\n${html}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  })
}

module.exports = sendEmail
