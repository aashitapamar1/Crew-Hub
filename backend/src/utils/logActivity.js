const prisma = require('../config/db')

function logActivity({ action, entity, entityId, actorId }) {
  return prisma.activity.create({
    data: { action, entity, entityId, actorId },
  })
}

module.exports = logActivity
