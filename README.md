# `@klnap/payload-slug`

A Payload CMS field that generates URL-friendly slugs from top-level or nested source paths and enforces uniqueness, with optional persisted Auto/Manual control.

```ts
import type { CollectionConfig } from "payload";
import { slugField } from "@klnap/payload-slug";

export const Pages: CollectionConfig = {
  slug: "pages",
  fields: [{ name: "title", type: "text", required: true }, slugField({ source: "title" })],
};
```

Payload generates the admin import map at startup and during hot reload. Run `payload generate:importmap` manually when needed.

## Why?

Payload includes a built-in `slugField` with a `generateSlug` checkbox and generation rules tied to create, update, autosave, and publish state. Its `useAsSlug` option selects a top-level field.

This package offers a different contract: the default slug stays stable once set, `source` can point to nested fields, and `modeToggle` adds a persisted Auto/Manual choice. Use Payload's built-in field when its lifecycle fits your content. Use this package when its source paths or save behavior fit better.

## Features

- Generate a slug in the admin as the source changes, then normalize it again on the server.
- Keep an existing slug stable by default, or opt into a persisted Auto/Manual mode.
- Read source values from nested document objects, such as `hero.title`.
- Use a synchronous or asynchronous custom slugifier for server saves and admin previews.
- Localize the slug and use locale-aware rules in the default slugifier.
- Enforce required, indexed, unique slug values through Payload field configuration.

## Installation

```bash
bun add @klnap/payload-slug
```

```bash
npm install @klnap/payload-slug
```

The Payload application must already provide the peer dependencies listed under [Compatibility](#compatibility).

## Usage

### Nested source fields

`source` is a dot-separated path from the document root. For example, place the slug beside a named Payload group and point it to the group's title:

```ts
{
  name: "hero",
  type: "group",
  fields: [{ name: "title", type: "text" }],
},
slugField({ source: "hero.title" }),
```

### Persisted Auto/Manual mode

Enable `modeToggle` when editors need to choose whether the slug follows the source on every save:

```ts
slugField({ source: "title", modeToggle: true });
```

The field stores the choice in a hidden `slugMode` field. New documents default to `"auto"`. Auto mode regenerates the slug on every save, including published documents; Manual mode keeps the editor's slug and normalizes it on save. Auto mode can change a published URL when its source changes, so add your own access or hook rule if that is not acceptable.

### Custom slugification

Provide a custom `slugify` function to use application-specific rules. Add `slug()` to `buildConfig` to register translations and the authenticated admin-preview endpoint:

```ts
import { generateSlug, slugField } from "@klnap/payload-slug";

export const postSlugField = slugField({
  source: "title",
  slugify: ({ valueToSlugify }) => {
    if (typeof valueToSlugify !== "string") return undefined;
    const normalized = generateSlug(valueToSlugify);
    return normalized ? `post-${normalized}` : undefined;
  },
});
```

Import `slug` from the package, then add this property to your existing `buildConfig` to register translations and the admin-preview endpoint:

```ts
plugins: [slug()],
```

`slugify` runs on the server during saves. With `slug()`, the admin preview calls the same function through a Payload endpoint. The preview requires a signed-in user with read access to the collection. The `data` argument comes from the current form, so treat it as user-controlled input.

### Localized slugs

Set `localized: true` to localize the `slug` field and, when enabled, `slugMode`. The default slugifier uses the active request locale for localized fields:

```ts
slugField({ source: "title", localized: true });
```

## Configuration

`slugField(options)` returns a required, indexed, unique text field named `slug`. With `modeToggle: true`, it returns a row containing `slugMode` and `slug`.

| Option       | Type              | Default            | Behavior                                                                                                |
| ------------ | ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| `source`     | `string`          | Required           | Absolute path from the document root. Dot-separated object paths are supported; array traversal is not. |
| `slugify`    | `SlugifyFunction` | Built-in slugifier | Custom synchronous or asynchronous slug generation for saves and admin previews.                        |
| `localized`  | `boolean`         | `false`            | Localizes `slug` and, when present, `slugMode`. The default slugifier uses the active locale.           |
| `modeToggle` | `boolean`         | `false`            | Adds the persisted Auto/Manual mode described above.                                                    |

Without `modeToggle`, the admin follows the source while the slug is empty or still holds a value generated by the component. Once an editor enters a slug, source changes do not replace it. On save, submitted slugs are normalized; an update that omits the slug keeps the stored value. If a new document has no usable source yet, the server assigns a temporary `draft-<id>` slug, using `data.id` when available or a random UUID otherwise.

The default slugifier uses [`slugify`](https://github.com/simov/slugify) with lowercase, strict, trimmed output. It does not add a collision suffix: duplicate values fail the unique constraint. A manually submitted slug that normalizes to an empty string is rejected.

### Public API

The package root exports:

| Export                                                                | Purpose                                                                     |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `slugField(options)`                                                  | Payload field factory.                                                      |
| `slug()`                                                              | Plugin that registers translations and the custom-slugify preview endpoint. |
| `generateSlug(source, options?)`                                      | Default slugifier; accepts an optional `{ locale?: string }` option.        |
| `slugFieldTranslations`                                               | English, Polish, and German field translations.                             |
| `GenerateSlugOptions`, `SlugFieldArgs`, `SlugifyFunction`, `SlugMode` | Public TypeScript types.                                                    |

`@klnap/payload-slug/admin/SlugField` is the admin field export used by Payload's import map. Applications should configure `slugField()` rather than importing this component directly.

`SlugifyFunction` receives `{ valueToSlugify, data, req }`, where `valueToSlugify` is `unknown`, `data` is the current document data, and `req` is a Payload request. It returns `string | undefined` or a promise of either value.

## Compatibility

| Requirement                 | Supported range                                   | Verified                            |
| --------------------------- | ------------------------------------------------- | ----------------------------------- |
| `payload`, `@payloadcms/ui` | `>=3.94.1 <4`                                     | `3.94.1` and `3.94.2`               |
| `react`, `react-dom`        | `~19.0.9 \|\| ~19.1.10 \|\| ~19.2.9 \|\| ^19.3.1` | `19.3.1`                            |
| Node.js                     | `^22.23.5 \|\| ^24.22.3 \|\| >=26.13.1`           | `22.23.5`, `24.22.3`, and `26.13.1` |

The package is ESM-only. The admin field imports CSS, so the application bundler must support CSS imports from dependencies. Custom slugifier previews support collections, not globals. Source paths do not traverse arrays.

## Documentation

- [Payload text and slug fields](https://payloadcms.com/docs/fields/text)
- [Payload field hooks](https://payloadcms.com/docs/hooks/fields)
- [Payload custom components and import maps](https://payloadcms.com/docs/custom-components/overview#component-paths)
- [Security policy](https://github.com/klnap/payload-slug/blob/main/SECURITY.md)
- [Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
