import { describe, expect, it } from 'bun:test'
import type { Field } from 'payload'
import { slugField } from '../../src/fields/slug-field.js'
import {
  createSlugifyServerFunctionHandler,
  handleSlugifyServerFunction,
} from '../../src/server/slugify-server-function-handler.js'
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

  it('resolves promised config in the server function handler', async () => {
    const row = slugField({ source: 'title' })
    const handler = createSlugifyServerFunctionHandler(Promise.resolve(mockConfig))
    const result = await handler({
      collection: 'pages',
      fieldPath: 'slug',
      valueToSlugify: 'Hello World',
      data: { title: 'Hello World' },
      req: createReq([row]),
    })

    expect(result).toBe('hello-world')
  })
})
