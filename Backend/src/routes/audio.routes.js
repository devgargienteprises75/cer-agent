import { Router } from 'express'
import multer from 'multer';
import { uploadDataController } from '../controllers/audio.controller.js';

const router = Router()

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (!allowedImageTypes.has(file.mimetype)) {
            const error = new Error('Upload a JPEG, PNG, WebP, or GIF image')
            error.status = 400
            return callback(error)
        }

        callback(null, true)
    }
})

router.post("/upload-data", upload.single('image'), uploadDataController)

export default router;
