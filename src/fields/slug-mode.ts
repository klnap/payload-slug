import type { SlugMode } from '../types.js'

export const resolveSlugMode = (args: {
  operation?: string
  siblingData?: Record<string, unknown>
  previousSiblingDoc?: Record<string, unknown>
}): SlugMode => {
  const fromSibling = args.siblingData?.slugMode
  if (fromSibling === 'auto' || fromSibling === 'manual') {
    return fromSibling
  }

  if (args.operation === 'create') {
    return 'auto'
  }

  const fromPrevious = args.previousSiblingDoc?.slugMode
  if (fromPrevious === 'auto' || fromPrevious === 'manual') {
    return fromPrevious
  }

  return 'auto'
}
