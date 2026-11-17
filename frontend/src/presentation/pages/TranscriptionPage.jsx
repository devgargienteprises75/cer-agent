import { countWords, formatDuration } from '../../domain/transcript'
import { useLiveTranscription } from '../../application/useLiveTranscription'
import Icon from '../components/Icon'
import './transcription.css'

export default function TranscriptionPage({ createSocket, audio }) {
  const {
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
  } = useLiveTranscription({ createSocket, audio })

  const words = countWords(transcript)
  const formattedTime = formatDuration(elapsed)

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

          <div className="card-footer"><span>{words} {words === 1 ? 'word' : 'words'}</span><span className="footer-separator" /><span>{transcript.length} characters</span><div className="footer-actions"><button className="text-action" onClick={copyTranscript} disabled={!transcript} aria-label="Copy transcript"><Icon name="copy" size={15} /> <span>Copy</span></button><button className="text-action" onClick={clearTranscript} disabled={!transcript} aria-label="Clear transcript"><Icon name="trash" size={15} /> <span>Clear</span></button></div></div>
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
