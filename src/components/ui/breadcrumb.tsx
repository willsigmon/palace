import Link from 'next/link'

interface BreadcrumbItem {
  readonly label: string
  readonly href?: string
}

interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30">
                <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-sub truncate max-w-[200px]' : 'text-muted/50'}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted/50 transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
