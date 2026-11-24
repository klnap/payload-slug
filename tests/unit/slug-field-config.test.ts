import { describe, expect, it } from 'bun:test'
import type { Field } from 'payload'
import { slugField } from '../../src/fields/slug-field.js'
import { collectFields, slugFieldOutputHasLayoutAdmin } from '../field-tree.js'

describe('slugField config', () => {
  it('returns a row with slug and slugMode', () => {
    const field = slugField({ source: 'title' })
    expect(field.type).toBe('row')
    const names = collectFields(field).map((f) => ('name' in f ? f.name : undefined))
    expect(names).toContain('slug')
    expect(names).toContain('slugMode')
  })

  it('does not impose admin.position or layout metadata on any nested field', () => {
    const field = slugField({ source: 'title', slugify: () => 'x' })
    expect(slugFieldOutputHasLayoutAdmin(field)).toBe(false)
  })

  it('wires custom slugify on slug field only', () => {
    const field = slugField({
      source: 'title',
      slugify: () => 'custom',
    })
    const slug = collectFields(field).find((f) => 'name' in f && f.name === 'slug') as Field
    expect(typeof slug.custom?.slugify).toBe('function')
  })

  it('registers the public admin field with serializable clientProps', () => {
    const field = slugField({ source: 'meta.title', slugify: () => 'x' })
    const slug = collectFields(field).find((f) => 'name' in f && f.name === 'slug') as Field
    expect(slug.admin?.components?.Field).toEqual({
      path: '@klnap/payload-slug/admin/SlugField',
      clientProps: {
        source: 'meta.title',
        usesCustomSlugify: true,
        slugLocalized: false,
      },
    })
  })

  it('passes slugLocalized when slug field is localized', () => {
    const field = slugField({ source: 'title', localized: true })
    const slug = collectFields(field).find((f) => 'name' in f && f.name === 'slug') as Field
    const components = slug.admin?.components?.Field as {
      clientProps?: Record<string, unknown>
    }
    expect(components?.clientProps?.slugLocalized).toBe(true)
  })
})
