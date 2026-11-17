export function appendTranscript(current, text) {
  if (!text) return current
  return current ? `${current} ${text}` : text
}

export function combineTranscript(finalTranscript, interimTranscript) {
  return [finalTranscript, interimTranscript].filter(Boolean).join(' ')
}

export function countWords(text) {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}
