import { idb } from '../idb'
import { uid } from '../util'

/** Voice recordings are stored only on this device (IndexedDB), never uploaded. */
export const recordingSupported = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

export async function startRecording(maxSeconds = 120) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported?.(m))
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }))
    }
  })
  rec.start()
  const limit = setTimeout(() => rec.state === 'recording' && rec.stop(), maxSeconds * 1000)
  return {
    async stop() {
      clearTimeout(limit)
      if (rec.state === 'recording') rec.stop()
      return done
    },
  }
}

export async function saveRecording(blob: Blob, key = uid()) {
  await idb.set('blobs', key, blob)
  return key
}
export async function recordingUrl(key: string) {
  const b = await idb.get<Blob>('blobs', key)
  return b ? URL.createObjectURL(b) : null
}
export const deleteRecording = (key: string) => idb.del('blobs', key)
