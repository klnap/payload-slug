import { describe, expect, it } from 'bun:test'

import { readFormFieldValue } from './read-form-field-value.js'

describe('readFormFieldValue', () => {
  it('reads top-level and nested paths', () => {
    const fields = {
      title: { value: 'Hello' },
      meta: { value: { title: 'Nested' } },
    }

    expect(readFormFieldValue(fields, 'title')).toBe('Hello')
    expect(readFormFieldValue(fields, 'meta.title')).toBe('Nested')
    expect(readFormFieldValue(fields, 'missing')).toBeUndefined()
  })
})
