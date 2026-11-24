# @klnap/payload-slug

A slug field for [Payload CMS](https://payloadcms.com) 3. By default it is a plain, unique `slug` field that fills itself from another field while it is empty, in the admin as you type and on the server when the slug is missing. Optionally it adds a persisted **Auto/Manual** mode for editors who want a slug that always follows its source.

## Why

Payload ships an experimental `slugField` that decides whether to regenerate a slug from autosave and publish heuristics. This package keeps the common case simple and the other case explicit:

- Default: the slug is yours. It is generated only when empty and never overwritten afterwards.
- `modeToggle: true`: the mode is a stored field (`slugMode`), so behavior never depends on how many versions a document has. Auto follows the source on every save; Manual never changes unless the editor edits it.
- The server is authoritative. Submitted slugs are normalized with the same rules as generated ones, and input that normalizes to nothing is rejected rather than stored.

If you want a slug that stabilizes after publishing, use Payload's native field instead.

### Live in the admin

The slug is computed client-side, so you see its state in the input as you type the source, before saving. With the default slugify there is no server round trip; a custom `slugify` runs through the `slug()` endpoint. A generate icon inside the input, on the right, fills the slug from the source on click. Payload's native `slugField` is locked by default and generates through a server call when you click Generate or save, so the slug does not follow the source while you type.

## Install

```sh
bun add @klnap/payload-slug
```

or

```sh
npm install @klnap/payload-slug
```

## Quick start

```ts
// payload.config.ts
import { slug, slugField } from '@klnap/payload-slug'
import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [slug()], // admin translations (en, pl, de) and the preview endpoint
  collections: [
    {
      slug: 'pages',
      fields: [{ name: 'title', type: 'text' }, slugField({ source: 'title' })],
    },
  ],
})
```

Then run `payload generate:importmap` so the admin field component is registered, and regenerate your types: the field adds `slug` (and `slugMode` with `modeToggle`).

`slug()` registers admin translations and the preview endpoint. It is optional unless you use a custom `slugify`; without it the admin shows English labels.

## Behavior

Default (no `modeToggle`):

| Situation | Result |
| --- | --- |
| Slug empty in the admin | Follows `source` as you type, until you type a slug yourself. |
| Generate icon clicked | Replaces the slug with one generated from `source`. |
| Create or update with an empty slug | Generated from `source` on the server. |
| Slug submitted | Normalized (`My Slug` becomes `my-slug`). Source changes do not touch it. |
| Update that does not include the slug | The stored slug is kept. |
| Slug normalizes to empty (`!!!`) | Validation error. |
| Empty slug and empty source on create | `draft-<uuid>`, so drafts stay unique. |

With `modeToggle: true`, `slug` and `slugMode` are stored and the admin shows an Auto/Manual toggle:

| Mode | Result |
| --- | --- |
| Auto | Generated from `source` on every save, including on published documents. Add an access or hook rule if published URLs must not move. Empty source on update keeps the existing slug. |
| Manual | The submitted slug is normalized and never overwritten by the source. The generate icon fills it from `source` on demand. |

A duplicate slug fails on the database unique constraint. No numeric suffix is appended.

Default normalization uses [`slugify`](https://www.npmjs.com/package/slugify) (`lower`, `strict`). Characters without a transliteration, such as CJK, are dropped. Pass a custom `slugify` for those scripts.

## Options

`slugField(options)`:

| Option | Default | Description |
| --- | --- | --- |
| `source` | required | Path of the source field from the document root, for example `title` or `meta.title`. |
| `slugify` | `slugify` package | `({ valueToSlugify, data, req }) => string \| undefined`. Runs on the server and may be async. |
| `localized` | `false` | Localizes `slug` (and `slugMode`). The default slugify then applies rules for the active locale. |
| `modeToggle` | `false` | Adds the persisted Auto/Manual mode described above. |

The field sets no `admin.position`; place it where you need it. With `modeToggle` it is a `row` containing `slugMode` and `slug`.

### Custom `slugify`

The admin previews generated slugs live. With a custom `slugify`, the preview calls `POST /api/payload-slug/slugify`, an endpoint that `slug()` registers for you, so the `slug()` plugin is required. The endpoint needs a signed-in user with read access to the collection. Without a custom `slugify`, nothing else is needed.

## Exports

| Path | Exports |
| --- | --- |
| `@klnap/payload-slug` | `slugField`, `slug`, `generateSlug`, `slugFieldTranslations`, types `SlugFieldArgs`, `SlugifyFunction`, `SlugMode` |
| `@klnap/payload-slug/admin/SlugField` | Admin component (import map only) |

## Compatibility

Tested against `payload` and `@payloadcms/ui` 3.94.1 with React 19.3 on Node 26. The peer range is `>=3.94.1 <4`; other 3.x versions are untested. ESM only.

## Limitations

- Custom `slugify` preview supports collections, not globals.
- No collision suffixes.
- The admin component imports a small CSS file, so your bundler must handle CSS from `node_modules` (Next.js does).

## License

[MIT](./LICENSE)
