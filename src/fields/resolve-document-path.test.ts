import { describe, expect, it } from "bun:test";

import { resolveDocumentPath } from "./resolve-document-path.js";

describe("resolveDocumentPath", () => {
  it("resolves absolute paths from document root", () => {
    const data = { title: "Page", meta: { title: "Nested" } };
    expect(resolveDocumentPath(data, "title")).toBe("Page");
    expect(resolveDocumentPath(data, "meta.title")).toBe("Nested");
  });

  it("does not treat paths as relative to slug parent", () => {
    const data = { settings: { title: "Inner" }, title: "Root" };
    expect(resolveDocumentPath(data, "title")).toBe("Root");
  });
});
