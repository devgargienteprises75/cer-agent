import { useEffect, useRef, useState } from 'react'
import './App.css'

const getSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_TRANSCRIBE_WS_URL
  if (configuredUrl) return configuredUrl
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:8000`
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'mic') return <svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8"/></svg>
  if (name === 'stop') return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" stroke="none"/></svg>
  if (name === 'copy') return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
  if (name === 'trash') return <svg {...common}><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/></svg>
  if (name === 'wave') return <svg {...common}><path d="M2 12h2l2-7 4 14 4-16 4 18 3-9h3"/></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>
  return null
}

export default function App() {
  const [phase, setPhase] = useState('idle')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [notice, setNotice] = useState('')
  const socketRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const audioSourceRef = useRef(null)
  const processorRef = useRef(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)

  const stopCapture = (message = 'Recording stopped') => {
    clearInterval(timerRef.current)
    timerRef.current = null
    processorRef.current?.disconnect()
    audioSourceRef.current?.disconnect()
    processorRef.current = null
    audioSourceRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    const socket = socketRef.current
    socketRef.current = null
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
    if (mountedRef.current) {
      setPhase('idle')
      setInterimTranscript('')
      setNotice(message)
    }
  }

  const startCapture = async () => {
    setNotice('')
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
      setNotice('This browser does not support microphone recording.')
      return
    }
    setPhase('connecting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream
      const socket = new WebSocket(getSocketUrl())
      socketRef.current = socket

      socket.onopen = async () => {
        if (socketRef.current !== socket) return
        try {
          const audioContext = new AudioContextClass()
          audioContextRef.current = audioContext
          await audioContext.resume()
          const source = audioContext.createMediaStreamSource(stream)
          const processor = audioContext.createScriptProcessor(4096, 1, 1)
          audioSourceRef.current = source
          processorRef.current = processor
          processor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0)
            for (let channel = 0; channel < event.outputBuffer.numberOfChannels; channel += 1) {
              event.outputBuffer.getChannelData(channel).fill(0)
            }

            // Nova streaming expects raw PCM here. Downsample to 16 kHz and
            // convert the browser's Float32 samples into signed 16-bit PCM.
            const ratio = audioContext.sampleRate / 16000
            const outputLength = Math.floor(input.length / ratio)
            const pcm = new Int16Array(outputLength)
            for (let index = 0; index < outputLength; index += 1) {
              const start = Math.floor(index * ratio)
              const end = Math.max(start + 1, Math.floor((index + 1) * ratio))
              let sum = 0
              for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1) sum += input[sourceIndex] ?? 0
              const sample = Math.max(-1, Math.min(1, sum / (end - start)))
              pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
            }
            if (pcm.length && socket.readyState === WebSocket.OPEN) socket.send(pcm.buffer)
          }
          source.connect(processor)
          processor.connect(audioContext.destination)
        } catch (error) {
          console.error('Audio capture setup failed:', error)
          stopCapture('Could not start audio capture in this browser.')
          return
        }
        setElapsed(0)
        setPhase('recording')
        timerRef.current = setInterval(() => setElapsed((time) => time + 1), 1000)
      }

      socket.onmessage = (event) => {
        try {
          const { text, isFinal } = JSON.parse(event.data)
          if (!text) return
          if (isFinal) {
            setFinalTranscript((current) => current ? `${current} ${text}` : text)
            setInterimTranscript('')
          } else setInterimTranscript(text)
        } catch {
          setNotice('Received an unreadable response from the transcription server.')
        }
      }
      socket.onerror = () => stopCapture('Could not connect. Check that the transcription server is running.')
      socket.onclose = () => {
        if (socketRef.current === socket) {
          if (audioContextRef.current) stopCapture('Connection closed.')
          else {
            socketRef.current = null
            streamRef.current?.getTracks().forEach((track) => track.stop())
            streamRef.current = null
            setPhase('idle')
            setNotice('The transcription server closed the connection.')
          }
        }
      }
    } catch (error) {
      console.error('Microphone setup failed:', error)
      stopCapture(error?.name === 'NotAllowedError' ? 'Allow microphone access in your browser to start.' : 'Could not access the microphone.')
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearInterval(timerRef.current)
      processorRef.current?.disconnect()
      audioSourceRef.current?.disconnect()
      if (audioContextRef.current) void audioContextRef.current.close()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (socketRef.current?.readyState < WebSocket.CLOSING) socketRef.current.close()
    }
  }, [])

  const transcript = [finalTranscript, interimTranscript].filter(Boolean).join(' ')
  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const formattedTime = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  const copyTranscript = async () => {
    if (!transcript) return
    try {
      await navigator.clipboard.writeText(transcript)
      setNotice('Transcript copied to clipboard.')
      setTimeout(() => setNotice(''), 2200)
    } catch {
      setNotice('Clipboard access is unavailable in this browser.')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Vox home"><span className="brand-mark"><Icon name="wave" size={19} /></span><span>vox<span className="brand-dot">.</span></span></a>
        <div className="topbar-meta"><span className="language-tag"><span className="language-dot" /> Hindi <span className="language-divider">/</span> Nova-3</span><span className="topbar-label">LIVE TRANSCRIPTION</span></div>
      </header>

      <main className="workspace" id="home">
        <section className="intro">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR VOICE, IN WORDS</div>
          <h1>Ideas sound better<br /><span>when they’re captured.</span></h1>
          <p>Speak naturally. Your words appear here, as they happen.</p>
        </section>

        <section className={`transcript-card ${phase === 'recording' ? 'is-recording' : ''}`} aria-label="Live transcript">
          <div className="card-header">
            <div className="card-title"><span className={`status-indicator status-${phase}`} /><div><h2>Live transcript</h2><span className="status-label">{phase === 'recording' ? 'Listening now' : phase === 'connecting' ? 'Connecting to microphone' : 'Ready when you are'}</span></div></div>
            <div className="recording-time"><span className="time-dot" />{formattedTime}</div>
          </div>

          <div className={`transcript-body ${transcript ? 'has-text' : ''}`} aria-live="polite" aria-atomic="false">
            {transcript ? <p className="transcript-text">{finalTranscript}{finalTranscript && interimTranscript ? ' ' : ''}<span className="interim-text">{interimTranscript}</span><span className="typing-caret" /></p> : <div className="empty-state"><span className="empty-icon"><Icon name="wave" size={22} /></span><p>Your transcript will appear here</p><span>Press the button below and start speaking in Hindi.</span></div>}
          </div>

          <div className="card-footer"><span>{words} {words === 1 ? 'word' : 'words'}</span><span className="footer-separator" /><span>{transcript.length} characters</span><div className="footer-actions"><button className="text-action" onClick={copyTranscript} disabled={!transcript} aria-label="Copy transcript"><Icon name="copy" size={15} /> <span>Copy</span></button><button className="text-action" onClick={() => { setFinalTranscript(''); setInterimTranscript(''); setNotice('Transcript cleared.') }} disabled={!transcript} aria-label="Clear transcript"><Icon name="trash" size={15} /> <span>Clear</span></button></div></div>
        </section>

        <div className="controls">
          {phase === 'recording' ? <button className="record-button stop-button" onClick={() => stopCapture()}><span className="button-icon"><Icon name="stop" size={15} /></span><span>Stop recording</span></button> : <button className="record-button" onClick={startCapture} disabled={phase === 'connecting'}><span className="button-icon"><Icon name="mic" size={18} /></span><span>{phase === 'connecting' ? 'Connecting…' : 'Start recording'}</span></button>}
          <span className="secure-note"><span className="secure-check"><Icon name="check" size={11} /></span> Microphone access required</span>
        </div>
        <div className={`notice ${notice ? 'notice-visible' : ''}`} role="status">{notice}</div>
      </main>

      <footer className="page-footer"><span>Made for the moments worth remembering.</span><span className="footer-language">हिन्दी · Hindi</span></footer>
    </div>
  )
}
