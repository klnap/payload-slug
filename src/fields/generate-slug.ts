import slugify from "slugify";

export type GenerateSlugOptions = {
  /** Locale code for the `slugify` package's locale-specific rules (for example `de`). */
  locale?: string;
};

/** Default slug generation via the [`slugify`](https://www.npmjs.com/package/slugify) package. */
export const generateSlug = (source: string, options: GenerateSlugOptions = {}): string =>
  slugify(source, { lower: true, locale: options.locale, strict: true, trim: true });

export const generateSlugFromValue = (
  valueToSlugify: unknown,
  options: { localized?: boolean; locale?: unknown } = {},
): string | undefined => {
  if (typeof valueToSlugify !== "string" || !valueToSlugify.trim()) {
    return undefined;
  }

  // Locale rules apply only to localized slugs; otherwise output must not depend on the admin locale.
  const locale =
    options.localized === true && typeof options.locale === "string" ? options.locale : undefined;
  return generateSlug(valueToSlugify, { locale });
};
