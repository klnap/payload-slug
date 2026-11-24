import { describe, expect, it } from 'bun:test'

import { resolveSlugMode } from './slug-mode.js'

describe('resolveSlugMode', () => {
  it('defaults to auto on create', () => {
    expect(resolveSlugMode({ operation: 'create' })).toBe('auto')
  })

  it('uses siblingData when present', () => {
    expect(
      resolveSlugMode({
        operation: 'update',
        siblingData: { slugMode: 'manual' },
        previousSiblingDoc: { slugMode: 'auto' },
      }),
    ).toBe('manual')
  })

  it('falls back to previousSiblingDoc on update', () => {
    expect(
      resolveSlugMode({
        operation: 'update',
        previousSiblingDoc: { slugMode: 'manual' },
      }),
    ).toBe('manual')
  })
})
