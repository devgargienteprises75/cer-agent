import 'dotenv/config'
import { AssemblyAI } from './assemblyai'
import { WebSocketServer } from 'ws';
import { DeepgramClient } from '@deepgram/sdk'

const wss = new WebSocketServer({ port: 8080 });
const deepgram = new DeepgramClient();

wss.on("connection", async (clientWs) => {
    console.log(`Client connected`);

    // 1. Open live WebSocket connection to Deepgram
    const dgConnection = await deepgram.listen.v1.connect({
        model: 'nova-3',
        language: "hi",
        smart_format: "true",     
        interim_results: "true",  
        endpointing: "300", 
    })

    // 2. Listen for Deepgram connection open
    dgConnection.on("open", () => {
        console.log("Connected to Deepgram Websocket");
    })

    // 3. Receive live transcript from Deepgram & Forward to client
    dgConnection.on("message", (data) => {
        if (data.type === "Results") {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript) {
            clientWs.send(
            JSON.stringify({
                text: transcript,
                isFinal: data.is_final, // true = finalized sentence, false = partial live guess
            })
            );
        }
        }
    });

    // 4. Keep the connection alive during silent pauses
    const keepAliveInterval = setInterval(() => {
        dgConnection.sendKeepAlive();
    }, 8000);

    // 5. Connect & wait until Deepgram socket is ready
    dgConnection.connect();
    await dgConnection.waitForOpen();

    // 6. Forward raw binary audio chunks from client directly to Deepgram
    clientWs.on("message", (audioChunk) => {
        dgConnection.sendMedia(audioChunk);
    });

    // 7. Clean up on disconnect
    clientWs.on("close", () => {
        console.log("Client disconnected");
        clearInterval(keepAliveInterval);
        dgConnection.close();
    });

    dgConnection.on("error", (err) => console.error("Deepgram Error:", err));
})
