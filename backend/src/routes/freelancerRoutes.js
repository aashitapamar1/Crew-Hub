const express = require('express')
const {
  listFreelancers,
  createFreelancer,
  getFreelancer,
  updateFreelancer,
  archiveFreelancer,
} = require('../controllers/freelancerController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN'))

router.get('/', listFreelancers)
router.post('/', createFreelancer)
router.get('/:id', getFreelancer)
router.put('/:id', updateFreelancer)
router.patch('/:id/archive', archiveFreelancer)

module.exports = router
