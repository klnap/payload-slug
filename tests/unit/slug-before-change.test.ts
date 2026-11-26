import { describe, expect, it } from "bun:test";
import { type Field, ValidationError } from "payload";
import { slugField } from "../../src/fields/slug-field.js";
import { collectFields } from "../field-tree.js";

type BeforeChangeHook = (args: {
  value: unknown;
  data?: Record<string, unknown>;
  originalDoc?: Record<string, unknown>;
  siblingData?: Record<string, unknown>;
  previousSiblingDoc?: Record<string, unknown>;
  operation: "create" | "update";
  req: Record<string, unknown>;
}) => Promise<unknown>;

const getSlugBeforeChange = (args: Parameters<typeof slugField>[0]): BeforeChangeHook => {
  const row = slugField({ modeToggle: true, ...args });
  const slug = collectFields(row).find((f) => "name" in f && f.name === "slug") as Field & {
    hooks?: { beforeChange?: BeforeChangeHook[] };
  };
  const hook = slug.hooks?.beforeChange?.[0];
  if (!hook) {
    throw new Error("missing beforeChange");
  }
  return hook as BeforeChangeHook;
};

const req = {
  t: (key: string) => key,
};

describe("slug.beforeChange", () => {
  it("returns value unchanged in manual mode", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    const result = await beforeChange({
      value: "my-custom-slug",
      operation: "update",
      siblingData: { slugMode: "manual" },
      data: { title: "New Title" },
      req,
    });
    expect(result).toBe("my-custom-slug");
  });

  it("slugifies a manual value", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    const result = await beforeChange({
      value: "Hello World",
      operation: "update",
      siblingData: { slugMode: "manual" },
      data: { title: "New Title" },
      req,
    });
    expect(result).toBe("hello-world");
  });

  it("rejects a manual value that slugifies to empty instead of storing it raw", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    await expect(
      beforeChange({
        value: "../..",
        operation: "update",
        siblingData: { slugMode: "manual" },
        data: { title: "New Title" },
        req,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("generates slug from source on create", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    const result = await beforeChange({
      value: "",
      operation: "create",
      siblingData: { slugMode: "auto" },
      data: { title: "Hello World" },
      req,
    });
    expect(result).toBe("hello-world");
  });

  it("uses a draft placeholder on create when auto slug cannot be generated yet", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    const result = await beforeChange({
      value: "",
      operation: "create",
      siblingData: { slugMode: "auto" },
      data: { title: "" },
      req,
    });
    expect(result).toMatch(/^draft-/);
  });

  it("keeps a submitted slug on create when auto source is unavailable", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    const result = await beforeChange({
      value: "submitted-slug",
      operation: "create",
      siblingData: { slugMode: "auto" },
      data: { title: "" },
      req,
    });
    expect(result).toBe("submitted-slug");
  });

  it("preserves slug on update when source cannot be resolved", async () => {
    const beforeChange = getSlugBeforeChange({ source: "title" });
    const result = await beforeChange({
      value: "existing-slug",
      operation: "update",
      siblingData: { slugMode: "auto" },
      data: {},
      originalDoc: { slug: "existing-slug", title: "" },
      req,
    });
    expect(result).toBe("existing-slug");
  });

  it("uses custom slugify when configured", async () => {
    const beforeChange = getSlugBeforeChange({
      source: "title",
      slugify: ({ valueToSlugify }) => `x-${String(valueToSlugify)}`,
    });
    const result = await beforeChange({
      value: "",
      operation: "create",
      siblingData: { slugMode: "auto" },
      data: { title: "Hi" },
      req,
    });
    expect(result).toBe("x-Hi");
  });

  it("resolves nested source from document root", async () => {
    const beforeChange = getSlugBeforeChange({ source: "meta.title" });
    const result = await beforeChange({
      value: "",
      operation: "create",
      siblingData: { slugMode: "auto" },
      data: { meta: { title: "Nested" } },
      req,
    });
    expect(result).toBe("nested");
  });
});

describe("slug.beforeChange without modeToggle", () => {
  const plain = () => getSlugBeforeChange({ source: "title", modeToggle: false });

  it("fills an empty slug from the source", async () => {
    const result = await plain()({
      value: "",
      operation: "create",
      data: { title: "Hello World" },
      req,
    });
    expect(result).toBe("hello-world");
  });

  it("keeps and normalizes a submitted slug when the source changes", async () => {
    const result = await plain()({
      value: "My Slug",
      operation: "update",
      data: { title: "Other" },
      originalDoc: { title: "Hello", slug: "my-slug" },
      req,
    });
    expect(result).toBe("my-slug");
  });

  it("keeps the stored slug when the update does not include one", async () => {
    const result = await plain()({
      value: undefined,
      operation: "update",
      data: { title: "Other" },
      originalDoc: { title: "Hello", slug: "stored" },
      req,
    });
    expect(result).toBe("stored");
  });

  it("regenerates when the editor clears the slug", async () => {
    const result = await plain()({
      value: "",
      operation: "update",
      data: { title: "Fresh Title" },
      originalDoc: { title: "Hello", slug: "stored" },
      req,
    });
    expect(result).toBe("fresh-title");
  });

  it("rejects a slug that normalizes to empty", async () => {
    await expect(
      plain()({ value: "!!!", operation: "create", data: { title: "x" }, req }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("uses a draft placeholder on create without a source", async () => {
    const result = await plain()({ value: undefined, operation: "create", data: {}, req });
    expect(String(result)).toMatch(/^draft-/);
  });
});
