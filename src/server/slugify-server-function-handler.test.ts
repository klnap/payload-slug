import { describe, expect, it } from 'bun:test'
import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload'
import { Forbidden } from 'payload'

import { handleSlugifyServerFunction } from './slugify-server-function-handler.js'

const config = {} as SanitizedConfig

const buildCollection = (read: () => boolean) =>
  ({
    slug: 'posts',
    fields: [{ name: 'title', type: 'text' }],
    access: { read: () => read() },
  }) as unknown as SanitizedCollectionConfig

const buildReq = (collectionConfig: SanitizedCollectionConfig) => ({
  user: { id: 'user-1' },
  locale: 'en',
  payload: {
    config,
    collections: { posts: { config: collectionConfig } },
  },
})

const args = {
  collection: 'posts',
  fieldPath: 'title',
  valueToSlugify: 'Hello World',
  data: {},
}

describe('handleSlugifyServerFunction collection access', () => {
  it('rejects with 403 when the caller cannot read the collection', async () => {
    const req = buildReq(buildCollection(() => false))

    const error = await handleSlugifyServerFunction(config, args, req).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Forbidden)
    expect((error as Forbidden).status).toBe(403)
  })

  it('returns the slug when the caller can read the collection', async () => {
    const req = buildReq(buildCollection(() => true))

    await expect(handleSlugifyServerFunction(config, args, req)).resolves.toBe('hello-world')
  })
})
