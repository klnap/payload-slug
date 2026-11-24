import { describe, expect, it } from 'bun:test'

import * as admin from '../src/exports/admin/SlugField.js'
import * as root from '../src/exports/index.js'
import * as server from '../src/exports/server/index.js'

describe('public exports', () => {
  it('root entry exposes exactly the documented runtime API', () => {
    expect(Object.keys(root).sort()).toEqual([
      'generateSlug',
      'slug',
      'slugField',
      'slugFieldTranslations',
    ])
  })

  it('admin entry default-exports the field component', () => {
    expect(typeof admin.default).toBe('function')
  })

  it('server entry exposes only createSlugServerFunctions', () => {
    expect(Object.keys(server)).toEqual(['createSlugServerFunctions'])
  })
})
