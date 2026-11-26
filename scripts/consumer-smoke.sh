#!/usr/bin/env bash
# Installs the packed tarball into an isolated project and verifies its public API with Payload.
# Usage: scripts/consumer-smoke.sh <path-to-tarball>
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tarball="$(realpath "$1")"
payload_version="${PAYLOAD_VERSION:-3.94.1}"
if [[ -n "${CONSUMER_DIR:-}" ]]; then
  work="$CONSUMER_DIR"
  mkdir -p "$work"
else
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT
fi

node --input-type=module - "$tarball" "$repo" <<'NODE'
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const [tarball, repo] = process.argv.slice(2);
const sourceManifest = JSON.parse(readFileSync(path.join(repo, "package.json"), "utf8"));
const files = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
  .trim()
  .split("\n")
  .sort();
const manifest = JSON.parse(
  execFileSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" }),
);
const distFiles = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else distFiles.push(`package/${path.relative(repo, file).split(path.sep).join("/")}`);
  }
};

walk(path.join(repo, "dist"));
const expectedFiles = [
  "package/CHANGELOG.md",
  "package/LICENSE",
  "package/README.md",
  "package/package.json",
  ...distFiles,
].sort();
if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
  throw new Error(`Tarball contents differ from the allowlist.\nExpected:\n${expectedFiles.join("\n")}\nActual:\n${files.join("\n")}`);
}
if (manifest.name !== sourceManifest.name || manifest.version !== sourceManifest.version) {
  throw new Error("Tarball name or version does not match package.json.");
}
if (manifest.repository?.url !== sourceManifest.repository?.url) {
  throw new Error("Tarball repository does not match package.json.");
}
if (manifest.publishConfig?.registry !== "https://registry.npmjs.org/") {
  throw new Error("Tarball must publish to the public npm registry.");
}
for (const entry of Object.values(manifest.exports ?? {})) {
  for (const target of Object.values(entry)) {
    if (!files.includes(`package/${target.slice(2)}`)) {
      throw new Error(`Export target is missing from the tarball: ${target}`);
    }
  }
}
if (Object.keys(manifest.exports ?? {}).sort().join() !== ".,./admin/SlugField") {
  throw new Error("Unexpected public exports.");
}
console.log(`Verified ${manifest.name}@${manifest.version} tarball contents.`);
NODE

npm install --prefix "$work" --ignore-scripts --no-audit --no-fund \
  "$tarball" "payload@$payload_version" "@payloadcms/ui@$payload_version" "@payloadcms/db-sqlite@$payload_version" \
  react@19.3.1 react-dom@19.3.1 graphql@16 next@16.4.5 typescript@7.0.2 >/dev/null

cat > "$work/consumer.mts" <<'TS'
import type { Field } from "payload";
import {
  generateSlug,
  slug,
  slugField,
  type SlugFieldArgs,
  type SlugifyFunction,
} from "@klnap/payload-slug";

type AdminSlugField = typeof import("@klnap/payload-slug/admin/SlugField").default;
const customSlugify: SlugifyFunction = ({ valueToSlugify }) =>
  typeof valueToSlugify === "string" ? valueToSlugify : undefined;
const args: SlugFieldArgs = { source: "title", localized: true, slugify: customSlugify };
const field: Field = slugField(args);
const generatedSlug: string = generateSlug("Hello World");
const plugin = slug();
declare const adminField: AdminSlugField;

// @ts-expect-error The source field name must be a string.
slugField({ source: 123 });

void [field, generatedSlug, plugin, adminField];
TS

cat > "$work/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": []
  },
  "include": ["consumer.mts"]
}
JSON

"$work/node_modules/.bin/tsc" --project "$work/tsconfig.json"

cat > "$work/smoke.mjs" <<'JS'
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { generateSlug, slug, slugField } from "@klnap/payload-slug";
import { buildConfig, getPayload } from "payload";
import assert from "node:assert/strict";

import.meta.resolve("@klnap/payload-slug/admin/SlugField");
assert.equal(generateSlug("Hello World"), "hello-world");
const config = await buildConfig({
  secret: "s",
  plugins: [slug()],
  db: sqliteAdapter({ client: { url: "file:./smoke.db" }, push: true }),
  collections: [{ slug: "pages", fields: [{ name: "title", type: "text" }, slugField({ source: "title" })] }],
});
assert.ok(config.endpoints.some((endpoint) => endpoint.path === "/payload-slug/slugify"));
const payload = await getPayload({ config });
const doc = await payload.create({ collection: "pages", data: { title: "Smoke Test" } });
assert.equal(doc.slug, "smoke-test");
await payload.destroy();
console.log("consumer smoke OK");
process.exit(0);
JS

cat > "$work/runtime-smoke.mjs" <<'JS'
import assert from "node:assert/strict";
import { generateSlug, slugField } from "@klnap/payload-slug";

assert.equal(generateSlug("Hello World"), "hello-world");
assert.equal(slugField({ source: "title" }).name, "slug");
import.meta.resolve("@klnap/payload-slug/admin/SlugField");
JS

(cd "$work" && node smoke.mjs)
