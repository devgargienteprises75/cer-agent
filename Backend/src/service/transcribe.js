import 'dotenv/config'
import { DeepgramClient } from '@deepgram/sdk'
import { WebSocket, WebSocketServer } from 'ws'

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY })

export function attachTranscriptionWebSocket(server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', async (clientWs) => {
    console.log('Transcription client connected')

    let dgConnection
    let keepAliveInterval

    try {
      dgConnection = await deepgram.listen.v1.connect({
        model: 'nova-3',
        language: 'hi',
        encoding: 'linear16',
        sample_rate: 16000,
        smart_format: 'true',
        interim_results: 'true',
        endpointing: '300',
      })

      dgConnection.on('message', (data) => {
        if (data.type === 'Error') {
          console.error('Deepgram response error:', data)
          if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, 'Deepgram rejected the audio stream')
          return
        }
        if (data.type !== 'Results' || clientWs.readyState !== WebSocket.OPEN) return

        const transcript = data.channel?.alternatives?.[0]?.transcript

        if (transcript) {
          console.log(data.is_final ? `[FINAL] ${transcript}` : `[LIVE] ${transcript}`)
          clientWs.send(JSON.stringify({ text: transcript, isFinal: data.is_final }))
        }
      })

      dgConnection.on('error', (error) => {
        console.error('Deepgram error:', error)
        if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, 'Transcription service error')
      })

      dgConnection.on('close', (event) => {
        console.warn('Deepgram WebSocket closed:', event?.code ?? 'unknown', event?.reason ?? '')
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1011, 'Transcription service disconnected')
        }
      })

      dgConnection.connect()
      await dgConnection.waitForOpen()

      if (clientWs.readyState !== WebSocket.OPEN) {
        dgConnection.close()
        return
      }

      console.log('Connected to Deepgram WebSocket')
      keepAliveInterval = setInterval(() => {
        if (dgConnection.readyState !== WebSocket.OPEN) return
        try {
          dgConnection.sendKeepAlive({ type: 'KeepAlive' })
        } catch (error) {
          console.warn('Could not send Deepgram keepalive:', error.message)
        }
      }, 8000)

      let audioChunkCount = 0
      clientWs.on('message', (audioChunk, isBinary) => {
        if (!isBinary) {
          console.warn('Ignoring a non-binary message from the transcription client')
          return
        }
        if (dgConnection.readyState !== WebSocket.OPEN) {
          console.warn('Dropping audio chunk because Deepgram is not open')
          return
        }
        try {
          dgConnection.sendMedia(audioChunk)
          audioChunkCount += 1
          if (audioChunkCount === 1) {
            console.log(`First PCM audio chunk sent to Deepgram (${audioChunk.byteLength} bytes)`)
          }
        } catch (error) {
          // The connection can close between checking readyState and sending.
          console.warn('Could not forward audio to Deepgram:', error.message)
        }
      })

      clientWs.on('close', () => {
        console.log('Transcription client disconnected')
        clearInterval(keepAliveInterval)
        dgConnection.close()
      })
    } catch (error) {
      console.error('Could not start Deepgram transcription:', error)
      clearInterval(keepAliveInterval)
      dgConnection?.close()
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, 'Could not start transcription')
    }
  })

  return wss
}
