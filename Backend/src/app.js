import express from 'express'
import multer from 'multer'
import router from './routes/audio.routes.js';

const app = express();
app.use(express.json())

app.use("/api/audio", router)

app.get("/api/healthz", (req, res) => {
    res.status(200). json({
        message: "Server is Healthy."
    })
})

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'Image must be 10 MB or smaller'
            : 'Only one image file is allowed in the "image" field'
        return res.status(400).json({ message })
    }

    if (error.status === 400) {
        return res.status(400).json({ message: error.message })
    }

    console.error('Unhandled request error:', error.message)
    return res.status(500).json({ message: 'Internal server error' })
})

export default app;
