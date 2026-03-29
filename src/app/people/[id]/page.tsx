import { getPerson } from '@/lib/api'
import type { PersonDetailResponse } from '@/lib/api'
import { PersonProfile } from '@/components/people/person-profile'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PersonPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const data = await getPerson(id)
    return { title: data.person.display_name ?? data.person.name }
  } catch {
    return { title: 'Person' }
  }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params

  let data: PersonDetailResponse
  try {
    data = await getPerson(id)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-[var(--space-page)] py-8">
      <PersonProfile data={data} />
    </div>
  )
}
