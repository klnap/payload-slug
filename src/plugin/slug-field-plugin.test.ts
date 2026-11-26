import { describe, expect, test } from "bun:test";
import type { Config } from "payload";
import { slugFieldTranslations } from "../i18n/translations.js";
import { slug } from "./slug-field-plugin.js";

const baseConfig: Config = {
  collections: [],
  secret: "slug-plugin-test",
  db: {
    defaultIDType: "text",
    init: () => {
      throw new Error("This plugin test must not initialize a database");
    },
  },
};

describe("slug() plugin", () => {
  test("merges slug translations into Payload i18n (host overrides)", () => {
    const hostTranslations = { en: { custom: { key: "host" } } };
    const incoming: Config = {
      ...baseConfig,
      i18n: { translations: hostTranslations },
    };

    const result = slug()(incoming);
    if (result instanceof Promise) {
      throw new Error("expected sync plugin");
    }

    expect(result.i18n?.translations).not.toBe(hostTranslations);
    expect(result.i18n?.translations?.en).toMatchObject({
      custom: hostTranslations.en.custom,
      slug: slugFieldTranslations.en.slug,
    });
  });

  test("merges translations when host omits i18n", () => {
    const incoming = { ...baseConfig };
    const result = slug()(incoming);
    if (result instanceof Promise) {
      throw new Error("expected sync plugin");
    }
    expect(result.i18n?.translations?.en).toMatchObject({ slug: slugFieldTranslations.en.slug });
  });
});
