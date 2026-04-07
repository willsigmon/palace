import { getRuntimeConfig, resolveRuntimeUrl } from '@/lib/runtime-config'

export interface MarlinTimings {
  readonly stt: number
  readonly llm: number
  readonly tts: number
  readonly total: number
}

export interface VoiceResultPayload {
  readonly transcript: string
  readonly response: string
  readonly model: string
  readonly audioBase64: string
  readonly timings: MarlinTimings
}

interface RawVoiceResponse {
  readonly transcript: string
  readonly response: string
  readonly model: string
  readonly audio: string
  readonly timings: MarlinTimings
  readonly error?: string
}

interface RawChatResponse {
  readonly response: string
  readonly model: string
  readonly error?: string
}

function marlinUrl(path: string): string {
  return resolveRuntimeUrl(getRuntimeConfig().marlinBaseUrl, path)
}

async function parseMarlinResponse<T extends { error?: string }>(response: Response, path: string): Promise<T> {
  const data = (await response.json()) as T
  if (!response.ok) {
    throw new Error(data.error || `Marlin request failed for ${path} (${response.status})`)
  }
  if (data.error) {
    throw new Error(data.error)
  }
  return data
}

export async function sendVoiceToMarlin(input: {
  readonly blob: Blob
  readonly sessionId: string
  readonly voice: string
}): Promise<VoiceResultPayload> {
  const formData = new FormData()
  formData.append('audio', input.blob, 'recording.webm')
  formData.append('session_id', input.sessionId)
  formData.append('voice', input.voice)

  const response = await fetch(marlinUrl('/api/voice'), {
    method: 'POST',
    body: formData,
  })

  const data = await parseMarlinResponse<RawVoiceResponse>(response, '/api/voice')
  if (!data.transcript) {
    throw new Error('No speech detected')
  }

  return {
    transcript: data.transcript,
    response: data.response,
    model: data.model,
    audioBase64: data.audio,
    timings: data.timings,
  }
}

export async function reprocessConversationTranscript(input: {
  readonly transcript: string
  readonly sessionId: string
}): Promise<RawChatResponse> {
  const formData = new FormData()
  formData.append('message', input.transcript)
  formData.append('session_id', input.sessionId)

  const response = await fetch(marlinUrl('/api/chat'), {
    method: 'POST',
    body: formData,
  })

  return parseMarlinResponse<RawChatResponse>(response, '/api/chat')
}

export async function getMarlinHealth(): Promise<boolean> {
  const response = await fetch(marlinUrl('/health'))
  return response.ok
}
