import { Router } from 'express'
import multer from 'multer';
import path from 'path'
import { uploadAudioController } from '../controllers/audio.controller.js';

const router = Router()

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, `voice-${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage })

router.post("/upload-audio", upload.single('audio'), uploadAudioController)

export default router;