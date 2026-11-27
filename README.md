# `@klnap/payload-slug`

Slug fields for Payload CMS with live generation, nested source fields, and optional persistent Auto/Manual control.

Generate slugs as editors type. Keep saved slugs stable by default, or synchronize them with their source on every save.

```ts
import { slugField } from "@klnap/payload-slug";
import type { CollectionConfig } from "payload";

export const Articles: CollectionConfig = {
  slug: "articles",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField({ source: "title" }),
  ],
};
```

```text
How to Write Better Documentation
→ how-to-write-better-documentation
```

## Why?

Article titles change, but published URLs often should not. Titles may also live inside nested groups, and editors may need to choose whether a slug stays fixed or keeps following its source. This field previews changes as editors type, preserves a saved slug by default, and can persist an explicit Auto/Manual choice.

Payload's built-in `slugField` already supports source-based generation, locking, and on-demand regeneration. This package adds configurable document-root source paths and optional persisted Auto/Manual behavior.

## Features

- Preview slugs live in the admin and regenerate them on demand.
- Keep saved slugs stable by default; opt into Auto synchronization.
- Read dot-separated paths through nested document objects.
- Localize slugs and, optionally, each locale's Auto/Manual choice.
- Apply custom synchronous or asynchronous slugification.
- Normalize and validate slugs on the server.
- Use Payload's required, indexed, unique field configuration.
- Add English, Polish, and German admin translations with the plugin.

## Installation

```bash
bun add @klnap/payload-slug
```

```bash
npm install @klnap/payload-slug
```

## Usage

### Basic usage

`slugField({ source: 'title' })` adds a required `slug` text field generated from the article title. The field works without registering the `slug()` plugin when you use the built-in slugifier.

Add the plugin when you need its English, Polish, and German admin translations, or when a custom slugifier needs an admin preview. Without the plugin, the field uses English labels.

Payload generates the component import map at startup and during development hot reload. It also generates types automatically during development and builds unless you disable automatic generation. Run `payload generate:importmap` or `payload generate:types` manually only when automatic generation is disabled or you need to refresh them outside those flows.

### Slug behavior

The admin preview is not the persisted value. Payload runs the field hook on save and stores the returned value.

| Situation                 | Admin behavior                                                                         | Save behavior                                       |
| ------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| New article, empty slug   | Follows the title as it changes.                                                       | Generates from the source if no slug was submitted. |
| Editor changes the slug   | Stops following the title. The Generate control can replace it from the current title. | Normalizes the submitted slug.                      |
| Saved slug, title changes | Keeps the slug unchanged.                                                              | Keeps the stored slug when the update omits it.     |

In the default configuration, the admin follows the title only while the slug is empty or still contains a value it generated. A manually edited slug is not overwritten by later title changes. Clearing it resumes live generation.

If a create has no usable source and no submitted slug, the server stores a `draft-<id>` placeholder. It uses a non-empty string `data.id` when available, otherwise a random UUID; localized slugs also append the request locale, or `default` if none is set. This happens on create, not only when Payload marks the document as a draft. In the default configuration, that non-empty placeholder stays stable if a later update omits the slug. Click Generate or clear the field to replace it. Auto mode replaces it when a usable source is saved.

### Nested source fields

`source` is resolved from the document root, regardless of where the slug field is placed.

```ts
fields: [
  {
    name: 'hero',
    type: 'group',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
      },
    ],
  },
  slugField({
    source: 'hero.title',
  }),
],
```

Dot-separated paths traverse named nested objects. A slug can also sit inside a named group and still read `hero.title` from the document root. Rows, collapsibles, and unnamed tabs are layout containers and add no path segment. Paths do not traverse arrays.

### Auto/Manual mode

Enable `modeToggle` when editors need persistent control:

```ts
slugField({
  source: "title",
  modeToggle: true,
});
```

| Mode   | Behavior                                                                        |
| ------ | ------------------------------------------------------------------------------- |
| Auto   | Follows the source in the admin and regenerates from it on every save.          |
| Manual | Keeps the editor's slug unless they change it; submitted values are normalized. |

The default configuration adds no mode field. With `modeToggle: true`, the factory adds a hidden, persisted `slugMode` select field beside `slug`. It accepts `auto` and `manual`, defaults to `auto`, and is stored in the database. The choice persists across editing sessions. Existing documents without a saved mode resolve to Auto on update.

Manual mode preserves editorial control when the source changes. Auto mode can change an article's slug on any save, including a previously published article. When both `localized` and `modeToggle` are enabled, each locale stores its own mode.

### Localization

Payload content localization stores each enabled locale's field values. Configure locales in the Payload config, then localize the article title and slug:

```ts
localization: {
  locales: ['en', 'pl', 'de'],
  defaultLocale: 'en',
},
collections: [
  {
    slug: 'articles',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        localized: true,
      },
      slugField({
        source: 'title',
        localized: true,
        modeToggle: true,
      }),
    ],
  },
],
```

The default slugifier produces these values:

| Locale | Article title                     | Generated slug                      |
| ------ | --------------------------------- | ----------------------------------- |
| en     | How to Write Better Documentation | `how-to-write-better-documentation` |
| pl     | Jak pisać lepszą dokumentację     | `jak-pisac-lepsza-dokumentacje`     |
| de     | Bessere Dokumentation schreiben   | `bessere-dokumentation-schreiben`   |

Each locale can keep its own title, slug, and Auto/Manual choice. Changing a title regenerates its slug in Auto mode; Manual mode keeps that locale's slug. The active Payload locale is passed to the default slugifier when the slug field is localized. Locale-specific transliteration applies when the `slugify` package recognizes that locale code; unknown codes use its default mappings.

Payload's `localization.fallback` setting controls how missing localized values are read. It defaults to `true`; API callers can select or disable fallback with `fallbackLocale`. Fallback affects Payload's returned source value; it does not create a translation. To inspect stored values by locale, request `locale: 'all'` with fallback disabled.

Content localization is separate from admin internationalization. The `slug()` plugin registers this package's admin strings for English, Polish, and German. It does not add translations for every language supported by Payload.

### Custom slugification

Use a custom function for editorial normalization that the default rules do not provide:

```ts
import { generateSlug, slugField } from "@klnap/payload-slug";

slugField({
  source: "title",
  slugify: ({ valueToSlugify }) => {
    if (typeof valueToSlugify !== "string") return undefined;

    return generateSlug(valueToSlugify.replace(/&/g, " and "));
  },
});
```

```text
News & Updates
→ news-and-updates
```

The ampersand function is idempotent: normalizing `news-and-updates` again returns the same value. Custom functions also run on submitted manual slugs, so make them idempotent; a prefix-only function can add its prefix again on a later save.

Register `slug()` in the existing Payload config to enable the custom admin preview:

```ts
import { slug } from '@klnap/payload-slug'

plugins: [slug()],
```

The callback runs on server saves and, with the plugin, for collection previews through `POST /api/payload-slug/slugify`. It receives `{ valueToSlugify, data, req }`; `valueToSlugify` is `unknown`, `data` is the current form data, and `req` is a Payload request. It may return a string or `undefined`, synchronously or asynchronously.

The preview requires a signed-in user with read access to the collection. Treat preview `data` as user-controlled input. Custom functions still run for global saves, but the preview endpoint resolves collections only; global custom slugs have no admin preview.

## Configuration

`slugField(options)` accepts:

| Option       | Type              | Default  | Description                                                   |
| ------------ | ----------------- | -------- | ------------------------------------------------------------- |
| `source`     | `string`          | Required | Document-root source path.                                    |
| `slugify`    | `SlugifyFunction` | Built-in | Custom slugification function.                                |
| `localized`  | `boolean`         | `false`  | Localizes `slug` and `slugMode` when `modeToggle` is enabled. |
| `modeToggle` | `boolean`         | `false`  | Adds persistent Auto/Manual control.                          |

The factory creates `slug` as a required, indexed, unique text field. It adds the hidden, persisted `slugMode` select only when `modeToggle` is enabled.

### Normalization and uniqueness

The default slugifier lowercases, trims, and removes characters outside its URL-safe output. It transliterates common Latin characters, including the Polish and German examples above; it does not transliterate every script, so unsupported characters may be removed. The built-in slugifier does not add numeric collision suffixes.

The factory sets Payload's `unique: true` field option. With the SQLite adapter used in this package's integration tests, duplicate slugs in the same locale fail, while the same slug in different locales is allowed. Other database adapters may implement localized uniqueness differently and are not verified here. Payload's duplicate operation copies the slug, so duplicating an article without changing its slug fails uniqueness.

An explicitly submitted slug that normalizes to an empty string is rejected. On create, when generation has no usable source and the submitted slug is empty, the hook uses the `draft-<id>` placeholder described under [Slug behavior](#slug-behavior).

### Public API

The package root exports:

| Export                  | Signature or purpose                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| `slugField`             | `(args: SlugFieldArgs) => Field`                                           |
| `slug`                  | `() => Plugin`; registers translations and the custom preview endpoint.    |
| `generateSlug`          | `(source: string, options?: GenerateSlugOptions) => string`                |
| `slugFieldTranslations` | English, Polish, and German admin strings.                                 |
| Public types            | `GenerateSlugOptions`, `SlugFieldArgs`, `SlugifyFunction`, and `SlugMode`. |

`GenerateSlugOptions` accepts an optional `{ locale?: string }`. `SlugifyFunction` receives `{ valueToSlugify, data, req }` and may return `string | undefined` or a promise of either value.

## Compatibility

| Requirement                 | Declared range                                    | Verified                                     |
| --------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `payload`, `@payloadcms/ui` | `>=3.94.1 <4`                                     | `3.94.1` and `3.94.2`                        |
| `react`, `react-dom`        | `~19.0.9 \|\| ~19.1.10 \|\| ~19.2.9 \|\| ^19.3.1` | `19.3.1`                                     |
| Node.js                     | `^22.23.5 \|\| ^24.22.3 \|\| >=26.13.1`           | Minimums `22.23.5`, `24.22.3`, and `26.13.1` |

The package is ESM-only. Its admin field imports CSS, so the application bundler must support CSS imports from dependencies. The slug field's server hooks work on collections and globals; custom admin previews support collections only. Localized uniqueness was verified with SQLite, not every Payload adapter.

## Documentation

- [Payload content localization](https://payloadcms.com/docs/configuration/localization)
- [Payload admin internationalization](https://payloadcms.com/docs/configuration/i18n)
- [Payload text and built-in slug fields](https://payloadcms.com/docs/fields/text)
- [Payload custom components and import maps](https://payloadcms.com/docs/custom-components/overview#component-paths)
- [Security policy](https://github.com/klnap/payload-slug/blob/main/SECURITY.md)
- [Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
