import type { PayloadRequest } from "payload";

export type SlugMode = "auto" | "manual";

export type SlugifyFunction = (args: {
  valueToSlugify: unknown;
  data: Record<string, unknown>;
  req: PayloadRequest;
}) => string | undefined | Promise<string | undefined>;

export type SlugFieldArgs = {
  source: string;
  slugify?: SlugifyFunction;
  /** Applied to `slug` (and `slugMode`) when the host needs localized slugs. */
  localized?: boolean;
  /**
   * Adds a persisted Auto/Manual mode (`slugMode`). Auto regenerates the slug from `source` on
   * every save; Manual keeps the editor's slug. Off by default: the slug is a plain field that is
   * filled from `source` while it is empty.
   */
  modeToggle?: boolean;
};

/** Serializable props passed to the admin field component. Not part of the public API. */
export type SlugFieldClientProps = {
  source: string;
  usesCustomSlugify: boolean;
  /** Mirrors `slugField({ localized })` — drives locale-aware default slugify in admin. */
  slugLocalized: boolean;
  modeToggle: boolean;
};
