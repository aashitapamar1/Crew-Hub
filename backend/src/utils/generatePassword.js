const crypto = require('crypto')

function generateTempPassword() {
  return crypto.randomBytes(6).toString('base64url') + 'A1!'
}

module.exports = generateTempPassword
