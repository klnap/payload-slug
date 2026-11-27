import { describe, expect, test } from "bun:test";
import type { Config } from "payload";
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

const englishField = {
  modeAuto: "Auto",
  modeManual: "Manual",
  switchToManual: "Switch to Manual",
  switchToAuto: "Switch to Auto",
  generate: "Generate slug from source",
};

describe("slug() plugin", () => {
  test("merges English slug strings into Payload i18n and keeps host keys", () => {
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
      slug: { field: englishField },
    });
  });

  test("merges English slug strings when host omits i18n", () => {
    const result = slug()({ ...baseConfig });
    if (result instanceof Promise) {
      throw new Error("expected sync plugin");
    }
    expect(result.i18n?.translations?.en).toMatchObject({ slug: { field: englishField } });
  });

  test("host translations override package strings for any locale", () => {
    const incoming: Config = {
      ...baseConfig,
      i18n: {
        translations: {
          fr: { slug: { field: { generate: "Générer le slug" } } },
          en: { slug: { field: { generate: "Create slug" } } },
        },
      },
    };

    const result = slug()(incoming);
    if (result instanceof Promise) {
      throw new Error("expected sync plugin");
    }

    expect(result.i18n?.translations?.en).toMatchObject({
      slug: { field: { generate: "Create slug", modeAuto: "Auto" } },
    });
    expect(result.i18n?.translations?.fr).toMatchObject({
      slug: { field: { generate: "Générer le slug" } },
    });
  });
});
