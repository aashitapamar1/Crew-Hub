const express = require('express')
const { listFiles, uploadFile, deleteFile } = require('../controllers/fileController')
const { protect, authorize } = require('../middlewares/authMiddleware')
const upload = require('../middlewares/uploadMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', listFiles)
router.post('/', authorize('ADMIN', 'FREELANCER'), upload.single('file'), uploadFile)
router.delete('/:id', authorize('ADMIN'), deleteFile)

module.exports = router
