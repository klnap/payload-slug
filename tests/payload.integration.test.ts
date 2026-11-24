import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig, getPayload, type Payload } from 'payload'

import { slug, slugField } from '../src/exports/index.js'

const dir = mkdtempSync(join(tmpdir(), 'payload-slug-'))
let payload: Payload

beforeAll(async () => {
  const config = await buildConfig({
    secret: 'test-secret',
    plugins: [slug()],
    db: sqliteAdapter({ client: { url: `file:${join(dir, 'db.sqlite')}` }, push: true }),
    typescript: { autoGenerate: false },
    collections: [
      {
        slug: 'pages',
        versions: { drafts: true },
        fields: [{ name: 'title', type: 'text' }, slugField({ autoFrom: 'title' })],
      },
    ],
  })
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload.destroy()
  rmSync(dir, { recursive: true, force: true })
})

const create = (data: Record<string, unknown>, draft = false) =>
  payload.create({ collection: 'pages', data: data as never, draft })

describe('slugField with Payload and a real database', () => {
  it('generates the slug from the source on create and regenerates in auto mode', async () => {
    const doc = await create({ title: 'Hello World' })
    expect(doc.slug).toBe('hello-world')
    expect(doc.slugMode).toBe('auto')
    const updated = await payload.update({
      collection: 'pages',
      id: doc.id,
      data: { title: 'New Title' },
    })
    expect(updated.slug).toBe('new-title')
  })

  it('keeps and normalizes a manual slug when the source changes', async () => {
    const doc = await create({ title: 'Manual Doc', slugMode: 'manual', slug: 'My Custom Slug' })
    expect(doc.slug).toBe('my-custom-slug')
    const updated = await payload.update({
      collection: 'pages',
      id: doc.id,
      data: { title: 'Other' },
    })
    expect(updated.slug).toBe('my-custom-slug')
  })

  it('rejects a manual slug that normalizes to empty', async () => {
    await expect(create({ title: 'x', slugMode: 'manual', slug: '!!!' })).rejects.toThrow()
  })

  it('fails on a duplicate slug through the unique constraint', async () => {
    await create({ title: 'Duplicate' })
    await expect(create({ title: 'Duplicate' })).rejects.toThrow()
  })

  it('gives a draft without a source a unique placeholder', async () => {
    const a = await create({}, true)
    const b = await create({}, true)
    expect(a.slug).toMatch(/^draft-/)
    expect(b.slug).not.toBe(a.slug)
  })
})
