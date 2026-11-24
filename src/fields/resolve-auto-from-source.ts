import { resolveDocumentPath } from './resolve-document-path.js'

const hasResolvableValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

export const resolveAutoFromSource = (
  source: string,
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown> | null,
): unknown => {
  const fromIncoming = resolveDocumentPath(data, source)
  if (hasResolvableValue(fromIncoming)) {
    return fromIncoming
  }

  if (originalDoc) {
    return resolveDocumentPath(originalDoc, source)
  }

  return undefined
}
