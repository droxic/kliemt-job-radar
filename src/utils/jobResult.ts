/**
 * Field resolution for Job Radar job results.
 *
 * `result_payload` is the raw row the Azure function returns — untyped, and its
 * keys vary between provider versions. Every consumer must therefore read it
 * through the same fallback chains rather than indexing it directly. The API
 * keeps a matching copy in `kliemt-api/src/job-radar/job-result.helpers.ts`
 * for the PDF export; keep the two in sync.
 */

export type JobRadarPayload = Record<string, unknown>

export function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function pickString(
  record: JobRadarPayload | undefined,
  keys: string[],
): string | null {
  if (!record) return null

  for (const key of keys) {
    const value = toNonEmptyString(record[key])
    if (value) {
      return value
    }
  }

  return null
}

export function pickNumber(
  record: JobRadarPayload | undefined,
  keys: string[],
): number | null {
  if (!record) return null

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const normalized = value
        .trim()
        .replace('%', '')
        .replace(',', '.')
        .replace(/[^0-9.+-]/g, '')
      const parsed = Number(normalized)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

export const PAYLOAD_KEYS = {
  title: ['job_title', 'role'],
  employer: ['employer_name', 'company_name', 'company'],
  location: ['job_location', 'location'],
  description: ['job_description', 'description', 'summary'],
  url: [
    'job_apply_link',
    'apply_link',
    'apply_url',
    'listing_url',
    'job_url',
    'url',
    'link',
    'href',
  ],
  rank: ['final_rank'],
}

/** Payload keys already surfaced in the details modal's own fields. */
export const lessRelevantPayloadKeys = new Set([
  ...PAYLOAD_KEYS.description,
  ...PAYLOAD_KEYS.url,
  ...PAYLOAD_KEYS.location,
  'final_rank',
  'title_relevance_score',
  'relevance_score',
  'match_score',
  'score',
  'rating',
  'match_rating',
])

// Traffic-light relevance from the Job Radar `final_rank` (1 = most relevant).
export type RelevanceLevel = 'high' | 'medium' | 'low'

export const relevanceLabels: Record<RelevanceLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function relevanceLevel(
  rank: number | null | undefined,
): RelevanceLevel | null {
  if (rank == null) return null
  if (rank <= 1) return 'high'
  if (rank === 2) return 'medium'
  return 'low'
}

export function displayLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function truncate(text: string | null | undefined, max = 90): string {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function buildTitle(parts: Array<string | null | undefined>): string | null {
  const existing = parts.filter((part): part is string => Boolean(part && part.trim()))
  if (!existing.length) return null
  return existing.join(' • ')
}

/** The flattened columns a run result or curated match carries. */
export interface JobResultColumns {
  role: string | null
  company_name: string | null
  location: string | null
  listing_url: string | null
  score: number | null
  result_payload?: JobRadarPayload
}

/**
 * Resolves a job to display fields, preferring the payload's richer values and
 * falling back to the stored columns.
 */
export function getJobTitle(row: JobResultColumns, fallback: string): string {
  const payload = row.result_payload
  const title = buildTitle([
    pickString(payload, PAYLOAD_KEYS.title) ?? row.role,
    pickString(payload, PAYLOAD_KEYS.employer) ?? row.company_name,
    pickString(payload, PAYLOAD_KEYS.location) ?? row.location,
  ])

  return title ?? fallback
}

export function getJobSummary(row: JobResultColumns): string | null {
  return pickString(row.result_payload, PAYLOAD_KEYS.description)
}

export function getJobUrl(row: JobResultColumns): string | null {
  return row.listing_url ?? pickString(row.result_payload, PAYLOAD_KEYS.url)
}

/**
 * `score` is a MySQL DECIMAL, which TypeORM hands back as a string, so it is
 * coerced here rather than trusted to be the number the type claims.
 */
export function getJobScore(row: JobResultColumns): number | null {
  const fromColumn = pickNumber({ score: row.score }, ['score'])
  return fromColumn ?? pickNumber(row.result_payload, PAYLOAD_KEYS.rank)
}

export function getJobLocation(row: JobResultColumns): string | null {
  return row.location ?? pickString(row.result_payload, PAYLOAD_KEYS.location)
}
