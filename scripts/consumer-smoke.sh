#!/usr/bin/env bash
# Installs the packed tarball into an empty project and runs Payload against it.
# Usage: scripts/consumer-smoke.sh <path-to-tarball>
set -euo pipefail
tarball="$(realpath "$1")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"
cat > package.json <<'JSON'
{ "name": "consumer-smoke", "private": true, "type": "module" }
JSON
npm install --no-audit --no-fund \
  "$tarball" payload@3.94.1 @payloadcms/ui@3.94.1 @payloadcms/db-sqlite@3.94.1 \
  react@19.3.1 react-dom@19.3.1 graphql@16 next@16.4.5 >/dev/null
cat > smoke.mjs <<'JS'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { slug, slugField, generateSlug } from '@klnap/payload-slug'
import { createSlugServerFunctions } from '@klnap/payload-slug/server'
import { buildConfig, getPayload } from 'payload'
import assert from 'node:assert/strict'

// The admin component imports CSS, so Node can only resolve it; bundlers load it.
import.meta.resolve('@klnap/payload-slug/admin/SlugField')
assert.equal(generateSlug('Hello World'), 'hello-world')
const config = await buildConfig({
  secret: 's',
  plugins: [slug()],
  db: sqliteAdapter({ client: { url: 'file:./smoke.db' }, push: true }),
  collections: [{ slug: 'pages', fields: [{ name: 'title', type: 'text' }, slugField({ source: 'title' })] }],
})
assert.equal(typeof createSlugServerFunctions(config)['@klnap/payload-slug/slugify'], 'function')
const payload = await getPayload({ config })
const doc = await payload.create({ collection: 'pages', data: { title: 'Smoke Test' } })
assert.equal(doc.slug, 'smoke-test')
await payload.destroy()
console.log('consumer smoke OK')
process.exit(0)
JS
node smoke.mjs
