# Changelog

## 0.2.4

### Patch Changes

- e07f247: Point README screenshots at the v0.2.3 tag so they render on npm and GitHub and always show the documented state. No runtime change.

## 0.2.3

### Patch Changes

- 45e5cf3: Document the Auto and Manual slug sequence with screenshots from a Payload Admin fixture. No runtime change.

## 0.2.2

### Patch Changes

- 87b09ec: Ignore local Claude Code settings in the repository. No published package or runtime change.

## 0.2.1

### Patch Changes

- 5d78602: Rewrite the README "Why?" section to explain when to use this field instead of the built-in slug field.

## 0.2.0

### Minor Changes

- bafde24: Ship English-only admin strings. Remove the `slugFieldTranslations` export; override labels for any locale through `i18n.translations` in the Payload config.

## 0.1.2

### Patch Changes

- b56dc63: Cancel pending automatic slug updates when the editor changes the slug or disables the field.

## [0.1.1] - 2026-11-25

Released through GitHub Actions with npm provenance. The code is unchanged from 0.1.0.

## [0.1.0] - 2026-11-24

First public release.

- `slugField({ source, slugify?, localized?, modeToggle? })` adds a unique `slug` field. It is filled from `source` while empty, in the admin and on the server; a submitted slug is normalized and kept.
- `modeToggle: true` adds a persisted `slugMode` (`auto` or `manual`) and an Auto/Manual toggle. Auto regenerates the slug from `source` on every save.
- Slugs that normalize to empty are rejected.
- Admin component computes the slug client-side as you type, with a generate icon inside the input.
- `slug()` plugin registers admin translations (en, pl, de). The field works without it and falls back to English; the plugin is required only for a custom `slugify`.
- Optional custom `slugify`, previewed in the admin through an endpoint that `slug()` registers.
