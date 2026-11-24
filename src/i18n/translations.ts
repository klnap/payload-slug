const fieldEn = {
  modeAuto: 'Auto',
  modeManual: 'Manual',
  switchToManual: 'Switch to Manual',
  switchToAuto: 'Switch to Auto',
}

const fieldPl = {
  modeAuto: 'Auto',
  modeManual: 'Manual',
  switchToManual: 'Przełącz na Manual',
  switchToAuto: 'Przełącz na Auto',
}

const fieldDe = {
  modeAuto: 'Auto',
  modeManual: 'Manual',
  switchToManual: 'Zu Manual wechseln',
  switchToAuto: 'Zu Auto wechseln',
}

/**
 * Merge into host `config.i18n.translations` (e.g. `deepMergeSimple(host, slugFieldTranslations)`).
 * Override keys under `slug.field` per locale in the host config.
 */
export const slugFieldTranslations = {
  en: { slug: { field: fieldEn } },
  pl: { slug: { field: fieldPl } },
  de: { slug: { field: fieldDe } },
} as const
