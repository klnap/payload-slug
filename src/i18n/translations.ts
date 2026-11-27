const fieldEn = {
  modeAuto: "Auto",
  modeManual: "Manual",
  switchToManual: "Switch to Manual",
  switchToAuto: "Switch to Auto",
  generate: "Generate slug from source",
};

/**
 * Package-owned English admin strings. Not exported from the package root.
 * Hosts override any key in their own `config.i18n.translations` for each locale.
 */
export const englishSlugFieldTranslations = {
  en: { slug: { field: fieldEn } },
} as const;
