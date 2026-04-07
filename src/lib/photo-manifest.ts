const AVAILABLE_PHOTO_SLUGS: ReadonlySet<string> = new Set([
  'amanda-blemker',
  'annie-blemker',
  'ashley-helms',
  'austin-hale',
  'austin-oller',
  'barbara-sigmon',
  'becky-helms',
  'becky-johnson',
  'bennett-johnson',
  'bethany-sigmon',
  'caleb-gonder',
  'cam-sigmon',
  'carter-cifelli',
  'carter-helms',
  'cassie-sigmon',
  'clay-johnson',
  'courtney-bryson',
  'david-blemker',
  'david-helms',
  'denice-johnson',
  'don-sigmon',
  'ed-sigmon',
  'gretchen-blemker',
  'hadley-johnson',
  'imogene-sigmon',
  'jacob-johnson',
  'jeff-gonder',
  'jeremy-chasak',
  'joyce-chasak',
  'kenny-sigmon',
  'mike-blemker',
  'nancy-gonder',
  'pam-blemker',
  'phillip-johnson',
  'rachael-blemker',
  'sarah-blemker',
  'shannon-chasak',
  'susan-johnson',
  'tiffany-johnson',
  'tommy-chasak',
  'travis-johnson',
  'will-sigmon',
  'william-sigmon',
])

export function normalizePhotoSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function hasPhotoForName(name: string): boolean {
  return AVAILABLE_PHOTO_SLUGS.has(normalizePhotoSlug(name))
}

export function getPhotoPathForName(name: string): string | null {
  const slug = normalizePhotoSlug(name)
  return AVAILABLE_PHOTO_SLUGS.has(slug) ? `/photos/${slug}.jpg` : null
}
