# @klnap/payload-slug

A slug field for [Payload CMS](https://payloadcms.com) 3 with a persisted **Auto/Manual** mode. In Auto mode the server generates the slug from another field on every save. In Manual mode the editor owns the slug, and the server normalizes it.

## Why

Payload ships an experimental `slugField` that decides whether to regenerate a slug from autosave and publish heuristics. This package makes that decision explicit and visible:

- The mode is a stored field (`slugMode`), so behavior never depends on how many versions a document has.
- Auto always follows the source field. Manual never changes unless the editor edits it.
- The server is authoritative. Manual input is normalized with the same rules as generated slugs, and input that normalizes to nothing is rejected rather than stored.

If you want a slug that stabilizes after publishing, use Payload's native field instead.

## Install

```sh
bun add @klnap/payload-slug
# or: npm install @klnap/payload-slug
```

## Quick start

```ts
// payload.config.ts
import { slug, slugField } from '@klnap/payload-slug'
import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [slug()], // registers admin translations (en, pl, de)
  collections: [
    {
      slug: 'pages',
      fields: [{ name: 'title', type: 'text' }, slugField({ source: 'title' })],
    },
  ],
})
```

Then run `payload generate:importmap` so the admin field component is registered, and regenerate your types: the field adds `slug` and `slugMode`.

`slug()` is optional; without it the admin shows English labels.

## Behavior

| Situation | Result |
| --- | --- |
| Create or update in Auto mode | Slug is generated from `source`. |
| Auto mode, source empty on update | Existing slug is kept. |
| Auto mode, source empty on create | A submitted slug is kept, otherwise `draft-<uuid>` (so drafts stay unique). |
| Manual mode | The submitted slug is normalized (`My Slug` becomes `my-slug`). Source changes do not touch it. |
| Manual slug that normalizes to empty (`!!!`) | Validation error. |
| Duplicate slug | The save fails on the database unique constraint. No numeric suffix is appended. |

Auto mode changes the slug whenever the source changes, including on published documents. Add an access or hook rule if published URLs must not move.

Default normalization uses [`slugify`](https://www.npmjs.com/package/slugify) (`lower`, `strict`). Characters without a transliteration, such as CJK, are dropped. Pass a custom `slugify` for those scripts.

## Options

`slugField(options)`:

| Option | Default | Description |
| --- | --- | --- |
| `source` | required | Path of the source field from the document root, for example `title` or `meta.title`. |
| `slugify` | `slugify` package | `({ valueToSlugify, data, req }) => string \| undefined`. Runs on the server and may be async. |
| `localized` | `false` | Localizes `slug` and `slugMode`. The default slugify then applies rules for the active locale. |

The field is a `row` and sets no `admin.position`; place it where you need it.

### Custom `slugify`

The admin previews Auto slugs live. With a custom `slugify`, the preview calls a Payload server function, so register it in your admin layout:

```tsx
// app/(payload)/layout.tsx
import { createSlugServerFunctions } from '@klnap/payload-slug/server'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import config from '@payload-config'

const serverFunction = async (args) => {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
    serverFunctions: createSlugServerFunctions(config),
  })
}
```

The handler requires a signed-in user with read access to the collection. Without a custom `slugify`, no wiring is needed.

## Exports

| Path | Exports |
| --- | --- |
| `@klnap/payload-slug` | `slugField`, `slug`, `generateSlug`, `slugFieldTranslations`, types `SlugFieldArgs`, `SlugifyFunction`, `SlugMode` |
| `@klnap/payload-slug/server` | `createSlugServerFunctions` |
| `@klnap/payload-slug/admin/SlugField` | Admin component (import map only) |

## Compatibility

Tested against `payload` and `@payloadcms/ui` 3.94.1 with React 19.3 on Node 26. The peer range is `>=3.94.1 <4`; other 3.x versions are untested. ESM only.

## Limitations

- Custom `slugify` preview supports collections, not globals.
- No collision suffixes.
- The admin component imports a small CSS file, so your bundler must handle CSS from `node_modules` (Next.js does).

## License

[MIT](./LICENSE)
