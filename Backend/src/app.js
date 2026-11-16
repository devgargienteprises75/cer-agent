import express from 'express'
import router from './routes/audio.routes.js';

const app = express();
app.use(express.json())

app.use("/api/audio", router)

app.get("/api/healthz", (req, res) => {
    res.status(200). json({
        message: "Server is Healthy."
    })
})

export default app;