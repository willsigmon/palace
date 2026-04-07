export interface ThreadMessage {
  readonly id: string
  readonly mode: 'text' | 'voice'
  readonly question: string
  readonly answer: string
  readonly sources?: {
    readonly conversations: { id: number; title: string; date: string }[]
    readonly memories: number
    readonly people: string[]
  }
  readonly audioBase64?: string
  readonly timings?: { stt: number; llm: number; tts: number; total: number }
  readonly model?: string
}
