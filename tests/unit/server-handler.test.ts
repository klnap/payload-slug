import { describe, expect, it } from 'bun:test'
import type { Field } from 'payload'
import { slugField } from '../../src/fields/slug-field.js'
import { handleSlugifyServerFunction, slugifyEndpoint } from '../../src/server/slugify-endpoint.js'
import { collectFields } from '../field-tree.js'

const mockConfig = {
  collections: [],
  globals: [],
} as never

const createReq = (fields: Field[], locale?: string) =>
  ({
    user: { id: '1' },
    locale,
    payload: {
      config: mockConfig,
      collections: { pages: { config: { fields, access: { read: () => true } } } },
    },
  }) as never

describe('handleSlugifyServerFunction', () => {
  it('rejects unauthenticated requests', async () => {
    await expect(
      handleSlugifyServerFunction(
        mockConfig,
        {
          collection: 'pages',
          fieldPath: 'slug',
          valueToSlugify: 'Title',
          data: {},
        },
        {
          user: undefined,
          payload: {
            config: mockConfig,
            collections: {},
          },
        },
      ),
    ).rejects.toThrow()
  })

  it('invokes configured custom slugify for schema path', async () => {
    const row = slugField({
      source: 'title',
      slugify: ({ valueToSlugify }) => `custom-${String(valueToSlugify)}`,
    })
    const slugFieldConfig = collectFields(row).find(
      (f) => 'name' in f && f.name === 'slug',
    ) as Field

    const req = {
      user: { id: '1' },
      payload: {
        config: mockConfig,
        collections: {
          pages: {
            config: {
              fields: [row],
              access: { read: () => true },
            },
          },
        },
      },
    }

    const result = await handleSlugifyServerFunction(
      mockConfig,
      {
        collection: 'pages',
        fieldPath: 'slug',
        valueToSlugify: 'Hello',
        data: { title: 'Hello' },
      },
      req as never,
    )

    expect(result).toBe('custom-Hello')
    expect(slugFieldConfig?.custom?.slugify).toBeDefined()
  })

  it('generates a default slug using the request locale', async () => {
    const row = slugField({ source: 'title', localized: true })
    const result = await handleSlugifyServerFunction(
      mockConfig,
      {
        collection: 'pages',
        fieldPath: 'slug',
        valueToSlugify: 'Übung',
        data: { title: 'Übung' },
      },
      createReq([row], 'de'),
    )

    expect(result).toBe('uebung')
  })

  it('rejects an unknown collection', async () => {
    await expect(
      handleSlugifyServerFunction(
        mockConfig,
        {
          collection: 'missing',
          fieldPath: 'slug',
          valueToSlugify: 'Title',
          data: {},
        },
        createReq([]),
      ),
    ).rejects.toThrow('Unknown collection: missing')
  })

  it('rejects an unknown slug field', async () => {
    await expect(
      handleSlugifyServerFunction(
        mockConfig,
        {
          collection: 'pages',
          fieldPath: 'missing',
          valueToSlugify: 'Title',
          data: {},
        },
        createReq([]),
      ),
    ).rejects.toThrow('Unknown slug field: pages.missing')
  })

  it('serves the slug as JSON through the endpoint handler', async () => {
    const row = slugField({ source: 'title' })
    const req = {
      ...(createReq([row]) as object),
      json: async () => ({
        collection: 'pages',
        fieldPath: 'slug',
        valueToSlugify: 'Hello World',
        data: {},
      }),
    }
    const response = await slugifyEndpoint.handler(req as never)
    expect(await response.json()).toEqual({ slug: 'hello-world' })
  })

  it('answers 403 for an anonymous endpoint call', async () => {
    const req = { user: null, payload: { config: mockConfig }, json: async () => ({}) }
    const response = await slugifyEndpoint.handler(req as never)
    expect(response.status).toBe(403)
  })
})
