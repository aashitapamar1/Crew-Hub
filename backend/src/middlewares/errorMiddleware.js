function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

function errorHandler(err, req, res, next) {
  console.error(err)

  if (err.name === 'MulterError' || err.message === 'Unsupported file type') {
    return res.status(400).json({ success: false, message: err.message })
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
}

module.exports = { notFound, errorHandler }
