/** Payload `t()` keys for slug admin UI (`slug:field:*` → `translations.slug.field`). */
const SLUG_FIELD_I18N_NS = 'slug:field'

export type SlugFieldTranslationKey = `${typeof SLUG_FIELD_I18N_NS}:${string}`

export const slugFieldKey = (suffix: string): SlugFieldTranslationKey =>
  `${SLUG_FIELD_I18N_NS}:${suffix}`
