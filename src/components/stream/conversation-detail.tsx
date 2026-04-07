'use client'

import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react'
import type { ConversationDetail as ConversationDetailType, ConversationListItem, Memory, TranscriptSegment } from '@/types/api'
import { calcDuration } from '@/lib/format'
import { correctSpeakerName, getEnrichment, type SpeakerSuggestionsResponse } from '@/lib/api'
import { reprocessConversationTranscript } from '@/lib/marlin'
import { useToast } from '@/components/ui/toast'
import { useAppStore } from '@/stores/app-store'
import { ConversationDetailHeader } from './conversation-detail-header'
import { ConversationDetailSummary } from './conversation-detail-summary'
import { ConversationDetailSpeakers } from './conversation-detail-speakers'
import { ConversationDetailTranscript } from './conversation-detail-transcript'
import { ConversationDetailRelated } from './conversation-detail-related'
import { mergeConsecutive, SPEAKER_PALETTE, type MergedTranscriptSegment } from './conversation-detail-helpers'

interface ConversationDetailProps {
  readonly detail: ConversationDetailType
  readonly relatedConversations?: readonly ConversationListItem[]
  readonly relatedMemories?: readonly Memory[]
  readonly speakerSuggestions?: SpeakerSuggestionsResponse | null
}

export function ConversationDetail({
  detail,
  relatedConversations = [],
  relatedMemories = [],
  speakerSuggestions,
}: ConversationDetailProps) {
  const { session, segments, speakerNames } = detail
  const title = session.title ?? 'Untitled Conversation'
  const duration = calcDuration(session.startedAt, session.finishedAt)
  const [topicInfo, setTopicInfo] = useState<string | null>(null)
  const [topicLoading, setTopicLoading] = useState(false)
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const [editingSpeaker, setEditingSpeaker] = useState<number | null>(null)
  const [speakerEditValue, setSpeakerEditValue] = useState('')
  const [speakerOverrides, setSpeakerOverrides] = useState<Record<string, string>>({})
  const [reprocessing, setReprocessing] = useState(false)
  const [notes, setNotes] = useState('')
  const { addToast } = useToast()

  const setActiveCategory = useAppStore((store) => store.setActiveCategory)
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesStorageKey = `palace-note-${session.id}`

  useEffect(() => {
    setActiveCategory(session.category ?? null)
    return () => setActiveCategory(null)
  }, [session.category, setActiveCategory])

  useEffect(() => {
    const stored = localStorage.getItem(notesStorageKey)
    if (stored !== null) {
      setNotes(stored)
    }
  }, [notesStorageKey])

  const saveNotes = useCallback((value: string) => {
    localStorage.setItem(notesStorageKey, value)
    addToast('Notes saved', 'info')
  }, [notesStorageKey, addToast])

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
    if (notesDebounceRef.current) {
      clearTimeout(notesDebounceRef.current)
    }
    notesDebounceRef.current = setTimeout(() => saveNotes(value), 1000)
  }, [saveNotes])

  const handleNotesBlur = useCallback(() => {
    if (notesDebounceRef.current) {
      clearTimeout(notesDebounceRef.current)
    }
    saveNotes(notes)
  }, [notes, saveNotes])

  const handleStartEditingSpeaker = useCallback((speakerId: number, name: string) => {
    setEditingSpeaker(speakerId)
    setSpeakerEditValue(name)
  }, [])

  const handleCancelEditingSpeaker = useCallback(() => {
    setEditingSpeaker(null)
  }, [])

  const saveSpeakerName = useCallback(async (speakerId: number, newName: string) => {
    const trimmedName = newName.trim()
    if (!trimmedName) {
      return
    }

    try {
      await correctSpeakerName({
        conversationId: session.id,
        speakerId,
        correctName: trimmedName,
      })
      setSpeakerOverrides((previous) => ({ ...previous, [String(speakerId)]: trimmedName }))
      addToast(`Speaker updated to "${trimmedName}"`, 'info')
    } catch {
      addToast('Failed to update speaker', 'error')
    }

    setEditingSpeaker(null)
  }, [addToast, session.id])

  const getSpeakerName = useCallback((segment: TranscriptSegment | MergedTranscriptSegment): string => {
    if (speakerOverrides[String(segment.speaker)]) return speakerOverrides[String(segment.speaker)]
    if (segment.speakerName) return segment.speakerName
    if (speakerNames[String(segment.speaker)]) return speakerNames[String(segment.speaker)]
    if (segment.isUser) return 'You'
    return segment.speakerLabel ?? `Speaker ${segment.speaker}`
  }, [speakerNames, speakerOverrides])

  const reprocessConversation = useCallback(async () => {
    setReprocessing(true)
    try {
      const transcript = segments
        .map((segment) => `${getSpeakerName(segment)}: ${segment.text}`)
        .join('\n')

      const data = await reprocessConversationTranscript({
        transcript: `Re-analyze this conversation and identify speakers, key topics, and action items:

${transcript.slice(0, 4000)}`,
        sessionId: `reprocess-${session.id}`,
      })
      addToast('Re-processed with local AI', 'info')
      setTopicInfo(data.response)
    } catch {
      addToast('Failed to re-process — is Marlin running?', 'error')
    }
    setReprocessing(false)
  }, [addToast, getSpeakerName, segments, session.id])

  const lookUpTopic = useCallback(async () => {
    if (!session.title) {
      return
    }
    setTopicLoading(true)
    try {
      const result = await getEnrichment(session.title, 'thing')
      setTopicInfo(result.content)
    } catch {
      setTopicInfo('Could not look up this topic.')
    } finally {
      setTopicLoading(false)
    }
  }, [session.title])

  const wordCount = segments.reduce((count, segment) => count + segment.text.split(/\s+/).filter(Boolean).length, 0)
  const { speakerIndexMap, speakerLegend } = useMemo(() => {
    const map = new Map<number, number>()
    let nextSpeakerIndex = 1

    for (const segment of segments) {
      if (segment.isUser) {
        map.set(segment.speaker, 0)
      } else if (!map.has(segment.speaker)) {
        map.set(segment.speaker, nextSpeakerIndex)
        nextSpeakerIndex += 1
      }
    }

    return {
      speakerIndexMap: map,
      speakerLegend: Array.from(map.entries()),
    }
  }, [segments])
  const uniqueSpeakers = speakerLegend.length
  const readMinutes = Math.max(1, Math.round(wordCount / 200))
  const mergedSegments = mergeConsecutive(segments)
  const searchTerm = transcriptSearch.trim().toLowerCase()
  const matchCount = searchTerm
    ? mergedSegments.reduce((count, segment) => {
        const text = segment.text.toLowerCase()
        let matches = 0
        let position = 0
        while ((position = text.indexOf(searchTerm, position)) !== -1) {
          matches += 1
          position += searchTerm.length
        }
        return count + matches
      }, 0)
    : 0

  const getSpeakerStyle = useCallback((speaker: number) => {
    const index = speakerIndexMap.get(speaker) ?? 0
    return SPEAKER_PALETTE[index % SPEAKER_PALETTE.length]!
  }, [speakerIndexMap])

  const handleCopyTranscript = useCallback(async () => {
    const text = segments
      .map((segment) => `${getSpeakerName(segment)}: ${segment.text}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      addToast('Transcript copied to clipboard')
    } catch {
      addToast('Failed to copy', 'error')
    }
  }, [addToast, getSpeakerName, segments])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      addToast('Link copied')
    } catch {
      addToast('Failed to copy link', 'error')
    }
  }, [addToast])

  const highlightText = useCallback((text: string): ReactNode => {
    if (!searchTerm) return text

    const parts: ReactNode[] = []
    const lower = text.toLowerCase()
    let last = 0
    let position = 0
    let key = 0

    while ((position = lower.indexOf(searchTerm, last)) !== -1) {
      if (position > last) {
        parts.push(text.slice(last, position))
      }
      parts.push(
        <mark key={key++} className="bg-accent/30 text-text rounded-sm px-0.5">
          {text.slice(position, position + searchTerm.length)}
        </mark>,
      )
      last = position + searchTerm.length
    }

    if (last < text.length) {
      parts.push(text.slice(last))
    }

    return <>{parts}</>
  }, [searchTerm])

  return (
    <article>
      <ConversationDetailHeader
        session={session}
        title={title}
        duration={duration}
        wordCount={wordCount}
        uniqueSpeakers={uniqueSpeakers}
        readMinutes={readMinutes}
        speakerSuggestions={speakerSuggestions}
        onShare={handleShare}
      />

      <ConversationDetailSummary
        session={session}
        topicInfo={topicInfo}
        topicLoading={topicLoading}
        onLookUpTopic={lookUpTopic}
      />

      <ConversationDetailSpeakers
        speakerLegend={speakerLegend}
        segments={segments}
        uniqueSpeakers={uniqueSpeakers}
        editingSpeaker={editingSpeaker}
        speakerEditValue={speakerEditValue}
        reprocessing={reprocessing}
        getSpeakerName={getSpeakerName}
        getSpeakerStyle={getSpeakerStyle}
        onStartEditing={handleStartEditingSpeaker}
        onSpeakerEditChange={setSpeakerEditValue}
        onSaveSpeaker={saveSpeakerName}
        onCancelEditing={handleCancelEditingSpeaker}
        onReprocess={reprocessConversation}
      />

      <ConversationDetailTranscript
        segmentsCount={segments.length}
        mergedSegments={mergedSegments}
        transcriptSearch={transcriptSearch}
        searchTerm={searchTerm}
        matchCount={matchCount}
        onSearchChange={setTranscriptSearch}
        onCopyTranscript={handleCopyTranscript}
        highlightText={highlightText}
        getSpeakerStyle={getSpeakerStyle}
        getSpeakerName={getSpeakerName}
      />

      <ConversationDetailRelated
        notes={notes}
        relatedMemories={relatedMemories}
        relatedConversations={relatedConversations}
        onNotesChange={handleNotesChange}
        onNotesBlur={handleNotesBlur}
      />
    </article>
  )
}
