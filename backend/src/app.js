const express = require('express')
const cors = require('cors')
const { notFound, errorHandler } = require('./middlewares/errorMiddleware')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Crew Hub API is running' })
})

app.use(notFound)
app.use(errorHandler)

module.exports = app
