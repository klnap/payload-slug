import { expect, it } from "bun:test";

import * as root from "../src/exports/index.js";

it("root entry exposes exactly the documented runtime API", () => {
  expect(Object.keys(root).sort()).toEqual(["generateSlug", "slug", "slugField"]);
});
