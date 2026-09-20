const express = require('express')
const {
  listClients,
  createClient,
  getClient,
  updateClient,
  archiveClient,
} = require('../controllers/clientController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN'))

router.get('/', listClients)
router.post('/', createClient)
router.get('/:id', getClient)
router.put('/:id', updateClient)
router.patch('/:id/archive', archiveClient)

module.exports = router
