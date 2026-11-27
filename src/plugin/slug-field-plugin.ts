import type { Config, Plugin } from "payload";
import { deepMergeSimple } from "payload/shared";
import { englishSlugFieldTranslations } from "../i18n/translations.js";
import { slugifyEndpoint } from "../server/slugify-endpoint.js";

/** Registers English admin strings, host overrides win, and the slugify endpoint for the admin preview. */
export function slug(): Plugin {
  return (incoming: Config): Config => {
    const i18n = {
      ...incoming.i18n,
      translations: deepMergeSimple(
        englishSlugFieldTranslations,
        incoming.i18n?.translations ?? {},
      ),
    };

    return {
      ...incoming,
      endpoints: [...(incoming.endpoints ?? []), slugifyEndpoint],
      i18n,
    };
  };
}
