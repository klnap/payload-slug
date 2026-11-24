import { describe, expect, it } from 'bun:test'

import { slugModePathFromSlugPath } from './slug-mode-path.js'

describe('slugModePathFromSlugPath', () => {
  it('maps sibling slugMode for root slug', () => {
    expect(slugModePathFromSlugPath('slug')).toBe('slugMode')
  })
})
