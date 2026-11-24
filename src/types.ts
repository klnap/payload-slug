import type { PayloadRequest } from 'payload'

export type SlugMode = 'auto' | 'manual'

export type SlugifyFunction = (args: {
  valueToSlugify: unknown
  data: Record<string, unknown>
  req: PayloadRequest
}) => string | undefined | Promise<string | undefined>

export type SlugFieldArgs = {
  autoFrom: string
  slugify?: SlugifyFunction
  /** Applied to `slug` and `slugMode` when the host needs localized slugs. */
  localized?: boolean
}

/** Serializable props passed to the admin field component. Not part of the public API. */
export type SlugFieldClientProps = {
  autoFrom: string
  usesCustomSlugify: boolean
  /** Mirrors `slugField({ localized })` — drives locale-aware default slugify in admin. */
  slugLocalized: boolean
}
