import type { Config, Plugin } from "payload";
import { deepMergeSimple } from "payload/shared";
import { slugFieldTranslations } from "../i18n/translations.js";
import { slugifyEndpoint } from "../server/slugify-endpoint.js";

/** Registers admin translations and the slugify endpoint used by the admin preview. */
export function slug(): Plugin {
  return (incoming: Config): Config => {
    const i18n = {
      ...incoming.i18n,
      translations: deepMergeSimple(slugFieldTranslations, incoming.i18n?.translations ?? {}),
    };

    return {
      ...incoming,
      endpoints: [...(incoming.endpoints ?? []), slugifyEndpoint],
      i18n,
    };
  };
}
