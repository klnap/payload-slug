import type { Config, Plugin } from 'payload'
import { deepMergeSimple } from 'payload/shared'

import { slugFieldTranslations } from '../i18n/translations.js'

/** Merges slug field admin copy into `config.i18n`. Use in `plugins: [slug()]`. */
export function slug(): Plugin {
  return (incoming: Config): Config => {
    const i18n = {
      ...incoming.i18n,
      translations: deepMergeSimple(slugFieldTranslations, incoming.i18n?.translations ?? {}),
    }

    return {
      ...incoming,
      i18n,
    }
  }
}
