const express = require('express')
const {
  listTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController')
const { protect, authorize } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect, authorize('ADMIN', 'FREELANCER'))

router.get('/', listTasks)
router.post('/', authorize('ADMIN'), createTask)
router.get('/:id', getTask)
router.put('/:id', authorize('ADMIN'), updateTask)
router.patch('/:id/status', updateTaskStatus)
router.delete('/:id', authorize('ADMIN'), deleteTask)

module.exports = router
