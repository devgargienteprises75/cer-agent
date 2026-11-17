export function createTranscriptionSocket() {
  const configuredUrl = import.meta.env.VITE_TRANSCRIBE_WS_URL
  if (configuredUrl) return new WebSocket(configuredUrl)

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${protocol}//${window.location.hostname}:8000`
  return new WebSocket(url)
}
