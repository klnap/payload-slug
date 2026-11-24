# Changelog

## [0.1.0] - 2026-11-24

First public release.

- `slugField({ source, slugify?, localized? })` adds a `slug` field and a persisted `slugMode` (`auto` or `manual`).
- Auto mode generates the slug on the server from `source` on every save. Manual mode normalizes the submitted slug and rejects input that normalizes to empty.
- Admin component with live Auto preview and an Auto/Manual toggle.
- `slug()` plugin registers admin translations (en, pl, de). The field works without it and falls back to English; the plugin is required only for a custom `slugify`.
- Optional custom `slugify`, previewed in the admin through an endpoint that `slug()` registers.
