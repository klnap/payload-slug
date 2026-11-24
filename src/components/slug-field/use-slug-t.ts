'use client'

import { useTranslation } from '@payloadcms/ui'

import { type SlugFieldTranslationKey, slugFieldKey } from '../../i18n/t-slug.js'
import { slugFieldTranslations } from '../../i18n/translations.js'

type Suffix = keyof (typeof slugFieldTranslations)['en']['slug']['field']

/** Returns the translated label, or the English copy when the `slug()` plugin is not registered. */
export const useSlugTranslation = () => {
  const { t } = useTranslation<Record<string, unknown>, SlugFieldTranslationKey>()
  return (suffix: Suffix): string => {
    const key = slugFieldKey(suffix)
    const translated = t(key)
    return translated === key ? slugFieldTranslations.en.slug.field[suffix] : translated
  }
}
