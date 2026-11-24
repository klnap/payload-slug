/**
 * Resolves an absolute document field path from the root of `data`.
 * `source` is always document-absolute, not relative to slug placement.
 */
export const resolveDocumentPath = (
  data: Record<string, unknown> | null | undefined,
  fieldPath: string,
): unknown => {
  if (!data || !fieldPath) return undefined

  const segments = fieldPath.split('.').filter(Boolean)
  let current: unknown = data

  for (const segment of segments) {
    if (current == null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}
