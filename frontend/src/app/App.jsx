import TranscriptionPage from '../presentation/pages/TranscriptionPage'
import { startPcmCapture, requestMicrophone } from '../infrastructure/browserAudio'
import { createTranscriptionSocket } from '../infrastructure/transcriptionSocket'

const audio = { requestMicrophone, startPcmCapture }

export default function App() {
  return <TranscriptionPage createSocket={createTranscriptionSocket} audio={audio} />
}
