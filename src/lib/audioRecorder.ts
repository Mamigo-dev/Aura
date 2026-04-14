/**
 * MediaRecorder wrapper for capturing audio blobs.
 * Works alongside Web Speech API — both can use the same microphone stream.
 */

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let mediaStream: MediaStream | null = null

export async function startAudioRecording(): Promise<void> {
  audioChunks = []

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

  // Prefer webm/opus, fallback to whatever browser supports
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4'

  mediaRecorder = new MediaRecorder(mediaStream, { mimeType })

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data)
    }
  }

  mediaRecorder.start(100) // collect data every 100ms
}

export function stopAudioRecording(): Promise<Blob> {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(new Blob(audioChunks, { type: 'audio/webm' }))
      return
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      // Stop all tracks to release microphone
      mediaStream?.getTracks().forEach((track) => track.stop())
      mediaStream = null
      mediaRecorder = null
      audioChunks = []
      resolve(blob)
    }

    mediaRecorder.stop()
  })
}

export function isRecording(): boolean {
  return mediaRecorder?.state === 'recording'
}
