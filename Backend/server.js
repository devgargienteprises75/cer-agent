import 'dotenv/config'
import { createServer } from 'http'
import app from "./src/app.js";
import { attachTranscriptionWebSocket } from "./src/service/transcribe.js";
import connectToDb from './src/config/db.js';

const PORT = 8000;
const server = createServer(app)

attachTranscriptionWebSocket(server)
connectToDb();

server.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))
