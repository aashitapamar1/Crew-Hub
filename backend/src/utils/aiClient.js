const axios = require('axios')

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 5000,
})

module.exports = aiClient
