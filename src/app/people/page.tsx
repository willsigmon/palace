import { Suspense } from 'react'
import { getPeople } from '@/lib/api'
import { PeopleDirectory } from '@/components/people/people-directory'

export const metadata = {
  title: 'People',
}

export default async function PeoplePage() {
  let people
  try {
    people = await getPeople({ limit: 100 })
  } catch {
    people = []
  }

  return (
    <div className="mx-auto max-w-4xl px-[var(--space-page)] py-8">
      <Suspense>
        <PeopleDirectory initialPeople={people} />
      </Suspense>
    </div>
  )
}
