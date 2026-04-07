'use client'

interface ExampleQuestionListProps {
  readonly questions: readonly string[]
  readonly voiceMode: boolean
  readonly onSelect: (question: string) => void
}

export function ExampleQuestionList({ questions, voiceMode, onSelect }: ExampleQuestionListProps) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted/40">
        {voiceMode ? 'Try saying' : 'Try asking'}
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            className="rounded-full border border-border/30 bg-surface/20 px-3.5 py-2 text-[12px] text-sub/60 transition-all hover:border-accent/30 hover:text-accent active:scale-95"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
