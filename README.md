# `@klnap/payload-slug`

A Payload CMS field that generates URL-friendly slugs from top-level or nested source paths and enforces uniqueness, with optional persisted Auto/Manual control.

```ts
import type { CollectionConfig } from "payload";
import { slugField } from "@klnap/payload-slug";

export const Articles: CollectionConfig = {
  slug: "articles",
  fields: [{ name: "title", type: "text", required: true }, slugField({ source: "title" })],
};
```

## Why?

An article title often needs a readable URL, but a title can change after publication. This field fills an empty slug from its source, then preserves the saved slug unless editors change it. Nested source paths and optional Auto/Manual mode cover more workflows without tying generation to draft or publish state.

Payload also provides a built-in `slugField`. Use that field when its `useAsSlug` and generation lifecycle fit your collection. Use this package when you need document-root dot paths, stable-by-default slugs, or persisted Auto/Manual control.

## Features

- Generate a slug in the admin as an article title changes.
- Preserve a saved slug by default; opt into regenerating it on every save.
- Read nested source fields such as `seo.title`.
- Use synchronous or asynchronous custom slugification on saves and admin previews.
- Localize slugs and apply locale-aware rules in the default slugifier.
- Enforce required, indexed, unique slugs through Payload field configuration.

## Installation

```bash
bun add @klnap/payload-slug
```

```bash
npm install @klnap/payload-slug
```

The Payload application must provide the peer dependencies listed under [Compatibility](#compatibility).

## Usage

### Add slugs to an articles collection

Add `slug()` to the existing Payload config to register field translations and the admin preview endpoint. The endpoint is used for custom slugifiers.

```ts
import { buildConfig } from "payload";
import { slug, slugField } from "@klnap/payload-slug";

export default buildConfig({
  // Keep your existing secret, database, and other config.
  plugins: [slug()],
  collections: [
    {
      slug: "articles",
      fields: [{ name: "title", type: "text", required: true }, slugField({ source: "title" })],
    },
  ],
});
```

Payload generates the admin import map at startup and during hot reload. Run `payload generate:importmap` manually when needed.

### Read a nested article source

`source` is a dot-separated path from the document root. It can point into named groups; it does not traverse arrays.

```ts
{
  slug: "articles",
  fields: [
    {
      name: "seo",
      type: "group",
      fields: [{ name: "title", type: "text" }],
    },
    slugField({ source: "seo.title" }),
  ],
}
```

### Customize article slugs

`slugify` receives the source value, current document data, and Payload request. It can return a string or `undefined`, synchronously or asynchronously.

```ts
import { generateSlug, slugField } from "@klnap/payload-slug";

slugField({
  source: "title",
  slugify: ({ valueToSlugify }) => {
    if (typeof valueToSlugify !== "string") return undefined;
    const normalized = generateSlug(valueToSlugify);
    return normalized ? `article-${normalized}` : undefined;
  },
});
```

On save, Payload runs the configured function. With `slug()` registered, the admin preview runs that same function through a Payload endpoint. The preview requires a signed-in user with read access to the collection. Its `data` argument comes from the current form, so treat it as user-controlled input.

### Localize article slugs

Configure Payload localization, mark the source title as localized, and set `localized: true` on the slug field. The default slugifier uses the active request locale for localized slugs.

```ts
localization: {
  locales: ["en", "de"],
  defaultLocale: "en",
},
collections: [
  {
    slug: "articles",
    fields: [
      { name: "title", type: "text", localized: true },
      slugField({ source: "title", localized: true }),
    ],
  },
],
```

When `modeToggle` is enabled, `slugMode` is localized with `slug`.

### Let editors choose Auto or Manual

Set `modeToggle: true` to persist the editor's choice in a hidden `slugMode` field. New documents default to `"auto"`.

```ts
slugField({ source: "title", modeToggle: true });
```

Auto mode regenerates the slug from the source on every save, including published documents. Manual mode preserves the editor's slug and normalizes it on save. Auto mode can change a published URL when its source changes; add an access or hook rule if that is not acceptable.

### Generate an article slug directly

Use the exported helper outside a field when you need the package's default normalization rules.

```ts
import { generateSlug } from "@klnap/payload-slug";

generateSlug("A Guide to Payload"); // "a-guide-to-payload"
generateSlug("Äpfel und Öl", { locale: "de" });
```

## Configuration

`slugField(options)` returns a required, indexed, unique text field named `slug`. With `modeToggle: true`, it returns a row containing `slugMode` and `slug`.

| Option       | Type              | Default            | Behavior                                                                                         |
| ------------ | ----------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `source`     | `string`          | Required           | Absolute path from the document root. Dot-separated object paths work; array traversal does not. |
| `slugify`    | `SlugifyFunction` | Built-in slugifier | Custom synchronous or asynchronous slug generation for saves and admin previews.                 |
| `localized`  | `boolean`         | `false`            | Localizes `slug` and, when enabled, `slugMode`. The default slugifier uses the active locale.    |
| `modeToggle` | `boolean`         | `false`            | Adds the persisted Auto/Manual mode described above.                                             |

Without `modeToggle`, the admin follows the source while the slug is empty or still holds a value generated by the component. Once an editor enters a slug, source changes do not replace it. On save, submitted slugs are normalized; an update that omits the slug keeps the stored value. If a new document has no usable source yet, the server assigns a temporary `draft-<id>` slug, using `data.id` when available or a random UUID otherwise.

The default slugifier uses [`slugify`](https://github.com/simov/slugify) with lowercase, strict, trimmed output. It does not add a collision suffix: duplicate values fail the unique constraint. A manually submitted slug that normalizes to an empty string is rejected.

### Public API

| Export                                                                | Purpose                                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `slugField(options)`                                                  | Payload field factory.                                                        |
| `slug()`                                                              | Plugin that registers translations and the custom-slugifier preview endpoint. |
| `generateSlug(source, options?)`                                      | Default slugifier; accepts an optional `{ locale?: string }` option.          |
| `slugFieldTranslations`                                               | English, Polish, and German field translations.                               |
| `GenerateSlugOptions`, `SlugFieldArgs`, `SlugifyFunction`, `SlugMode` | Public TypeScript types.                                                      |

`@klnap/payload-slug/admin/SlugField` is the admin field export used by Payload's import map. Applications should configure `slugField()` rather than importing this component directly.

`SlugifyFunction` receives `{ valueToSlugify, data, req }`. `valueToSlugify` is `unknown`, `data` is the current document data, and `req` is a Payload request. The function returns `string | undefined` or a promise of either value.

## Compatibility

| Requirement                 | Supported range                                   | Verified                            |
| --------------------------- | ------------------------------------------------- | ----------------------------------- |
| `payload`, `@payloadcms/ui` | `>=3.94.1 <4`                                     | `3.94.1` and `3.94.2`               |
| `react`, `react-dom`        | `~19.0.9 \|\| ~19.1.10 \|\| ~19.2.9 \|\| ^19.3.1` | `19.3.1`                            |
| Node.js                     | `^22.23.5 \|\| ^24.22.3 \|\| >=26.13.1`           | `22.23.5`, `24.22.3`, and `26.13.1` |

The package is ESM-only. The admin field imports CSS, so the application bundler must support CSS imports from dependencies. Custom slugifier previews support collections, not globals. Source paths do not traverse arrays.

## Documentation

- [Payload localization](https://payloadcms.com/docs/configuration/localization)
- [Payload text and slug fields](https://payloadcms.com/docs/fields/text)
- [Payload field hooks](https://payloadcms.com/docs/hooks/fields)
- [Payload custom components and import maps](https://payloadcms.com/docs/custom-components/overview#component-paths)
- [Security policy](https://github.com/klnap/payload-slug/blob/main/SECURITY.md)
- [Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
