import 'dotenv/config'
import { createServer } from 'http'
import app from "./src/app.js";
import { attachTranscriptionWebSocket } from "./src/service/transcribe.js";

const PORT = 8000;
const server = createServer(app)

attachTranscriptionWebSocket(server)

server.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))
