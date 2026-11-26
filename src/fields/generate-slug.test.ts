import { describe, expect, it } from "bun:test";

import { generateSlug, generateSlugFromValue } from "./generate-slug.js";

describe("generateSlug", () => {
  it("slugifies with default locale", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it.each([
    ["Zażółć gęślą jaźń", "zazolc-gesla-jazn"],
    ["ĄĆĘŁŃÓŚŹŻ", "acelnoszz"],
    ["Ä Ö Ü ß", "a-o-u-ss"],
    ["é e\u0301 東京 😀", "e-e"],
    ["  Hello   World  ", "hello-world"],
    ["a---b ___ c", "a-b-c"],
    ["!!!", ""],
    ["123 456", "123-456"],
    ["already-valid-slug", "already-valid-slug"],
  ])("generates a stable slug for %j", (source, expected) => {
    const slug = generateSlug(source);
    expect(slug).toBe(expected);
    expect(generateSlug(source)).toBe(slug);
    expect(slug).toMatch(/^[a-z0-9]*(?:-[a-z0-9]+)*$/);
  });

  it("does not truncate long input", () => {
    const source = "a".repeat(1000);
    expect(generateSlug(source)).toBe(source);
  });

  it("respects locale option", () => {
    expect(generateSlug("Übung", { locale: "de" })).toBe("uebung");
  });

  it("generateSlugFromValue uses slugify locale rules when localized", () => {
    expect(generateSlugFromValue("Übung", { localized: true, locale: "de" })).toBe("uebung");
    expect(generateSlugFromValue("Übung", { localized: false, locale: "de" })).toBe("ubung");
    expect(generateSlugFromValue("  ", { localized: true, locale: "en" })).toBeUndefined();
  });
});
