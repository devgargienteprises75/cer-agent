const TARGET_SAMPLE_RATE = 16000

export async function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support microphone recording.')
  }

  return navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  })
}

export async function startPcmCapture(stream, socket) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('This browser does not support microphone recording.')
  }

  const audioContext = new AudioContextClass()
  try {
    await audioContext.resume()
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0)
      for (let channel = 0; channel < event.outputBuffer.numberOfChannels; channel += 1) {
        event.outputBuffer.getChannelData(channel).fill(0)
      }

      // Deepgram Nova receives raw signed 16-bit PCM at 16 kHz.
      const ratio = audioContext.sampleRate / TARGET_SAMPLE_RATE
      const outputLength = Math.floor(input.length / ratio)
      const pcm = new Int16Array(outputLength)

      for (let index = 0; index < outputLength; index += 1) {
        const start = Math.floor(index * ratio)
        const end = Math.max(start + 1, Math.floor((index + 1) * ratio))
        let sum = 0
        for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1) {
          sum += input[sourceIndex] ?? 0
        }
        const sample = Math.max(-1, Math.min(1, sum / (end - start)))
        pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      }

      if (pcm.length && socket.readyState === WebSocket.OPEN) {
        socket.send(pcm.buffer)
      }
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    return () => {
      processor.disconnect()
      source.disconnect()
      void audioContext.close()
    }
  } catch (error) {
    void audioContext.close()
    throw error
  }
}
