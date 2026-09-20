const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { cloudinary, isConfigured } = require('../config/cloudinary')

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

function storeFile(buffer, originalName) {
  if (isConfigured) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'crew-hub' },
        (err, result) => {
          if (err) return reject(err)
          resolve({ url: result.secure_url })
        },
      )
      stream.end(buffer)
    })
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
  const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
  fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer)
  return Promise.resolve({ url: `/uploads/${safeName}` })
}

module.exports = storeFile
