# `@klnap/payload-slug`

A Payload CMS field that generates URL-friendly slugs from top-level or nested source paths and enforces uniqueness, with optional persisted Auto/Manual control.

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
- Normalize generated and submitted slugs on the server.
- Use Payload's required, indexed, unique field configuration.
- Ship English admin strings with the plugin; override any of them in your Payload config.

## Installation

```bash
bun add @klnap/payload-slug
```

```bash
npm install @klnap/payload-slug
```

## Usage

### Basic usage

`slugField({ source: "title" })` defines the required `slug` field and its admin and save behavior. The built-in slugifier works without plugin registration.

`slug()` registers the package's English admin strings and the endpoint used to preview custom slugification in collection fields. Basic fields and their built-in slugifier do not need it.

Import `slug` and add it to the `plugins` array in your existing `buildConfig({...})` configuration:

```ts
import { slug } from "@klnap/payload-slug";

// Add to the plugins array in your existing buildConfig({...}):
plugins: [slug()],
```

To change a label or add another language, set the strings under `i18n.translations` in your Payload config. Your values override the package defaults for the same keys:

```ts
i18n: {
  translations: {
    fr: {
      slug: {
        field: {
          modeAuto: "Auto",
          modeManual: "Manuel",
          switchToManual: "Passer en mode Manuel",
          switchToAuto: "Passer en mode Auto",
          generate: "Générer le slug depuis la source",
        },
      },
    },
  },
},
```

Payload generates the admin import map at startup, during development hot reload, and during builds. It generates types at development startup and during `payload build`. Do not edit these generated files. Run `payload generate:importmap` or `payload generate:types` manually only when `admin.importMap.autoGenerate` or `typescript.autoGenerate` is disabled, or you need generation outside those flows.

### Slug behavior

The admin preview is live feedback; the field hook determines the saved value.

With the default field, an empty slug follows the title as it changes. Typing a slug stops live following; Generate replaces it from the current title. Clearing the admin input resumes live generation. On save, a submitted slug is normalized, a cleared slug is generated from an available source, and an update that omits `slug` preserves the stored value. A non-empty submitted value that normalizes to empty is rejected when `modeToggle` is off or the mode is Manual.

Slugs are required and cannot be saved empty. With `modeToggle`, Auto is read-only; switch to Manual to edit. An explicitly empty Manual slug fails validation. Without `modeToggle` or in Auto mode, an API update with `slug: ""` regenerates from the submitted or stored source when available; if no source is usable on update, the stored slug remains.

If a create has no usable source or submitted slug, the server can store a temporary `draft-<id>` slug. This can happen whether or not Payload marks the document as a draft. Without `modeToggle` or in Manual mode, the placeholder can remain after a later title-only update; regenerate or replace it explicitly. Auto mode replaces it when a usable source becomes available.

### Nested source fields

`source` is resolved from the document root, regardless of where the slug field is placed.

```ts
fields: [
  {
    name: "hero",
    type: "group",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
    ],
  },
  slugField({
    source: "hero.title",
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

| Mode   | Admin behavior                                         | Save behavior                                                                                    |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Auto   | Follows the source; the slug is read-only.             | Generates from an available source; otherwise preserves the submitted or stored value as-is.     |
| Manual | Allows edits and on-demand generation from the source. | Keeps the submitted slug and normalizes it; an explicitly empty value fails required validation. |

The default configuration adds no mode field. With `modeToggle: true`, the factory adds a hidden, persisted `slugMode` select beside `slug`. It accepts `auto` and `manual`, defaults to `auto`, and is stored in the database. Existing documents without a saved mode resolve to Auto.

Manual mode preserves the slug when the source changes. Auto mode may change a published article's URL when its source changes. If the source is empty or unavailable in both the update and stored document, Auto preserves the existing slug. When both `localized` and `modeToggle` are enabled, each locale stores its own mode.

### Localization

Payload content localization stores each enabled locale's field values. Configure locales in the Payload config, then localize the article title and slug:

```ts
localization: {
  locales: ["en", "fr", "de"],
  defaultLocale: "en",
},
collections: [
  {
    slug: "articles",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
        localized: true,
      },
      slugField({
        source: "title",
        localized: true,
        modeToggle: true,
      }),
    ],
  },
],
```

The default slugifier produces these values for the configured locales:

| Locale | Article title                              | Generated slug                               |
| ------ | ------------------------------------------ | -------------------------------------------- |
| en     | How to Write Better Documentation          | `how-to-write-better-documentation`          |
| fr     | Comment écrire une meilleure documentation | `comment-ecrire-une-meilleure-documentation` |
| de     | Bessere Dokumentation schreiben            | `bessere-dokumentation-schreiben`            |

Each locale can keep its own title, slug, and Auto/Manual choice. Changing a title regenerates that locale's slug in Auto mode; Manual mode keeps it. The active Payload locale is passed to the built-in slugifier only when the slug field is localized. Locale-specific transliteration applies when the `slugify` package recognizes the code; unknown codes use its default mappings.

Payload fallback can return another locale's value from a read, but it does not supply that value as a missing localized source to the slug field hook. Auto generation needs a usable source in the update or stored document for that locale; read fallback alone does not provide it. An update in a locale without its own source can therefore fail required slug validation, even when reads use fallback. Updating one locale leaves other locales' stored slugs and modes unchanged. An unlocalized source can be used to generate localized slugs in each locale.

Content localization is separate from admin internationalization. The `slug()` plugin registers only English admin strings. Other admin languages come from your own `i18n.translations`.

### Custom slugification

Custom slugification is for application-specific URL policies, not a universal SEO rule. This example omits selected English articles:

```ts
import { generateSlug, slugField } from "@klnap/payload-slug";

slugField({
  source: "title",
  slugify: ({ valueToSlugify }) => {
    if (typeof valueToSlugify !== "string") return undefined;

    return (
      generateSlug(valueToSlugify)
        .split("-")
        .filter((word) => !["a", "an", "the"].includes(word))
        .join("-") || undefined
    );
  },
});
```

```text
The Future of Web Development → future-of-web-development
A Guide to TypeScript → guide-to-typescript
```

The function is deterministic and idempotent, and returns `undefined` when no slug remains. When `modeToggle` is off or the mode is Manual, custom functions also normalize submitted slugs, so make them idempotent.

The callback runs on saves and, with `slug()` registered, for collection previews through `POST /api/payload-slug/slugify`. It receives `{ valueToSlugify, data, req }`, where `valueToSlugify` is `unknown` and `req` is a Payload request. It may return a string or `undefined`, synchronously or asynchronously.

The preview requires an authenticated user with read access to the collection. Treat preview `data` as user-controlled input. Custom functions run on global saves, but the endpoint supports collection previews only.

## Configuration

`slugField(options)` accepts:

| Option       | Type              | Default  | Description                                          |
| ------------ | ----------------- | -------- | ---------------------------------------------------- |
| `source`     | `string`          | Required | Dot-separated path from the document root.           |
| `slugify`    | `SlugifyFunction` | Built-in | Custom slugification function.                       |
| `localized`  | `boolean`         | `false`  | Localizes `slug` and, with `modeToggle`, `slugMode`. |
| `modeToggle` | `boolean`         | `false`  | Adds persistent Auto/Manual control.                 |

The factory creates `slug` as a required, indexed, unique text field. It adds the hidden, persisted `slugMode` select only when `modeToggle` is enabled.

### Normalization and uniqueness

The default slugifier lowercases, trims, and removes characters outside its URL-safe output. It transliterates common Latin characters, including the French and German examples above; it does not transliterate every script, so unsupported characters may be removed. The built-in slugifier does not add numeric collision suffixes.

The factory sets Payload's `unique: true` field option, which asks the database adapter for a unique index. The repository's integration tests verify that a duplicate slug fails on SQLite. They do not cover PostgreSQL or other adapters, localized unique indexes, or document duplication. In Auto mode, a duplicated document regenerates the same slug from its unchanged source, so the unique check can reject it.

### Public API

The package root exports:

| Export         | Signature or purpose                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `slugField`    | `(args: SlugFieldArgs) => Field`                                           |
| `slug`         | `() => Plugin`; registers English strings and the custom preview endpoint. |
| `generateSlug` | `(source: string, options?: GenerateSlugOptions) => string`                |
| Public types   | `GenerateSlugOptions`, `SlugFieldArgs`, `SlugifyFunction`, and `SlugMode`. |

`GenerateSlugOptions` accepts an optional `{ locale?: string }`. `SlugifyFunction` receives `{ valueToSlugify, data, req }` and may return `string | undefined` or a promise of either value.

## Compatibility

| Requirement                 | Declared range                                    | Verified                                     |
| --------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `payload`, `@payloadcms/ui` | `>=3.94.1 <4`                                     | `3.94.1` and `3.94.2`                        |
| `react`, `react-dom`        | `~19.0.9 \|\| ~19.1.10 \|\| ~19.2.9 \|\| ^19.3.1` | `19.3.1`                                     |
| Node.js                     | `^22.23.5 \|\| ^24.22.3 \|\| >=26.13.1`           | Minimums `22.23.5`, `24.22.3`, and `26.13.1` |

The package is ESM-only. Its admin field imports CSS, so the application bundler must support CSS imports from dependencies. Server hooks work on collections and globals.

## Documentation

- [Payload content localization](https://payloadcms.com/docs/configuration/localization)
- [Payload admin internationalization](https://payloadcms.com/docs/configuration/i18n)
- [Payload text and built-in slug fields](https://payloadcms.com/docs/fields/text)
- [Payload custom components and import maps](https://payloadcms.com/docs/custom-components/overview#component-paths)
- [Security policy](https://github.com/klnap/payload-slug/blob/main/SECURITY.md)
- [Changelog](./CHANGELOG.md)

## License

[MIT](./LICENSE)
