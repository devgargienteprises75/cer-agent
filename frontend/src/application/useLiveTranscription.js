import { useCallback, useEffect, useRef, useState } from 'react'
import { appendTranscript, combineTranscript } from '../domain/transcript'

export function useLiveTranscription({ createSocket, audio }) {
  const [phase, setPhase] = useState('idle')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [notice, setNotice] = useState('')

  const socketRef = useRef(null)
  const streamRef = useRef(null)
  const stopAudioRef = useRef(null)
  const timerRef = useRef(null)
  const noticeTimerRef = useRef(null)
  const mountedRef = useRef(true)

  const transcript = combineTranscript(finalTranscript, interimTranscript)
  
  const stopCapture = useCallback((message = 'Recording stopped') => {
    clearInterval(timerRef.current)
    timerRef.current = null
    stopAudioRef.current?.()
    stopAudioRef.current = null

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    const socket = socketRef.current
    socketRef.current = null
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()

    if (mountedRef.current) {
      setPhase('idle')
      setInterimTranscript('')
      setNotice(message)
    }
  }, [])

  const startCapture = useCallback(async () => {
    setNotice('')
    setPhase('connecting')

    try {
      const stream = await audio.requestMicrophone()
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream

      const socket = createSocket()
      socketRef.current = socket

      socket.onopen = async () => {
        if (socketRef.current !== socket) return
        try {
          stopAudioRef.current = await audio.startPcmCapture(stream, socket)
        } catch (error) {
          console.error('Audio capture setup failed:', error)
          stopCapture(error.message || 'Could not start audio capture in this browser.')
          return
        }

        if (!mountedRef.current || socketRef.current !== socket) {
          stopAudioRef.current?.()
          stopAudioRef.current = null
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
            setFinalTranscript((current) => appendTranscript(current, text))
            setInterimTranscript('')
          } else setInterimTranscript(text)
        } catch {
          setNotice('Received an unreadable response from the transcription server.')
        }
      }

      socket.onerror = () => stopCapture('Could not connect. Check that the transcription server is running.')
      socket.onclose = () => {
        if (socketRef.current === socket) stopCapture('The transcription server closed the connection.')
      }
    } catch (error) {
      console.error('Microphone setup failed:', error)
      stopCapture(error?.name === 'NotAllowedError'
        ? 'Allow microphone access in your browser to start.'
        : error.message || 'Could not access the microphone.')
    }
  }, [audio, createSocket, stopCapture])

  const clearTranscript = useCallback(() => {
    setFinalTranscript('')
    setInterimTranscript('')
    setNotice('Transcript cleared.')
  }, [])

  const copyTranscript = useCallback(async () => {
    if (!transcript) return
    try {
      await navigator.clipboard.writeText(transcript)
      setNotice('Transcript copied to clipboard.')
      clearTimeout(noticeTimerRef.current)
      noticeTimerRef.current = setTimeout(() => setNotice(''), 2200)
    } catch {
      setNotice('Clipboard access is unavailable in this browser.')
    }
  }, [transcript])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearInterval(timerRef.current)
      clearTimeout(noticeTimerRef.current)
      stopAudioRef.current?.()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (socketRef.current?.readyState < WebSocket.CLOSING) socketRef.current.close()
    }
  }, [])

  return {
    phase,
    transcript,
    finalTranscript,
    interimTranscript,
    elapsed,
    notice,
    startCapture,
    stopCapture,
    copyTranscript,
    clearTranscript,
  }
}
