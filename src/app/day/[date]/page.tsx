import { getTimeline } from '@/lib/api'
import { DayTimeline } from '@/components/timeline/day-timeline'
import type { Metadata } from 'next'

interface DayPageProps {
  params: Promise<{ date: string }>
}

export async function generateMetadata({ params }: DayPageProps): Promise<Metadata> {
  const { date } = await params
  return { title: `${date} — Day View` }
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params

  let events
  try {
    events = await getTimeline(date)
  } catch {
    events = []
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <DayTimeline date={date} events={events} />
    </div>
  )
}
