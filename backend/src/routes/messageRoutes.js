const express = require('express')
const { listMessages, createMessage } = require('../controllers/messageController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', listMessages)
router.post('/', createMessage)

module.exports = router
