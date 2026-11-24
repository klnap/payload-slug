# Maintaining

This repository is the reference layout for the other `@klnap` Payload packages. Items marked **Required** apply to every package; the rest are decisions specific to this one.

## Repository layout (required)

- `src/` (ESM TypeScript, relative `.js` imports), `tests/`, `scripts/`, `.github/`
- `package.json`, `bun.lock` (committed), `tsconfig.json`, `tsconfig.build.json`, `biome.json`, `knip.json`
- `README.md`, `CHANGELOG.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `MAINTAINING.md`
- No monorepo references: no `workspace:` ranges, path aliases, shared configs, or private packages. Build with plain `tsc`; no bundler unless a real consumer needs one.

## Package metadata (required)

- Name `@klnap/<name>`, `license`, `author`, `repository` (`git+https://...git`), `homepage`, `bugs`, keywords, `publishConfig.access: public`.
- `type: module`, explicit `exports` with `types` first, `files` allowlist (`dist`, `README.md`, `CHANGELOG.md`, `LICENSE`).
- `sideEffects` only when true (this package: CSS).
- Peers state the Payload range actually tested. Dev dependencies pin exact versions.
- Version stays `0.1.0` until the first publish.

## Quality gates (required)

`bun run lint`, `typecheck`, `knip`, `test`, `build`, `check:package` (publint + Are The Types Wrong), then the tarball smoke test (`scripts/consumer-smoke.sh`): install the packed tarball into an empty project with real Payload and run it. At least one test runs Payload against a real database.

## CI and security (required)

- Actions pinned to commit SHAs with a version comment. Top-level `permissions: {}`; each job requests only what it needs.
- `persist-credentials: false`; no caching in release jobs; `bun install --frozen-lockfile`.
- `zizmor` and `bun audit` run in CI. Dependabot covers `github-actions` and `bun`. Validate workflows with `actionlint`.
- Enable secret scanning, push protection, Dependabot alerts, private vulnerability reporting and CodeQL default setup.

## Release (required)

1. Update `package.json` version and `CHANGELOG.md` (`## [x.y.z] - YYYY-MM-DD`) in a `chore: release x.y.z` commit on `main`.
2. Push a `vX.Y.Z` tag. `release.yml` then runs three jobs:
   - `validate` (read-only): tag equals version, commit is on `main`, all gates, packs the tarball, records its SHA-256, smoke-tests that tarball.
   - `publish` (`environment: npm`, only job with `id-token: write`): checks the SHA-256, then `npm publish <tarball> --provenance`. It skips a version that already exists, so re-running a failed release cannot overwrite it.
   - `github-release`: compares the tarball with npm's `dist.integrity`, then creates the GitHub Release from the changelog.
3. Verify independently: `npm view @klnap/<name>@x.y.z dist.integrity`, `npm audit signatures` in a fresh install, and the provenance badge on npmjs.com.

Recover a failed release by re-running failed jobs. Never move or reuse a published tag.

## npm Trusted Publishing bootstrap (required)

`npm trust` needs an existing package and an account with 2FA. Trusted publisher fields: repository `klnap/<name>`, workflow `release.yml`, environment `npm`, **allow `npm publish`**. Requires npm `>=11.15` and Node `>=22.14`; Node 24 ships a suitable npm.

1. `npm login` (interactive, 2FA).
2. Create the package without publishing a public version: `npm stage publish` from the packed tarball creates a `0.0.0-stage` placeholder and holds the real version for approval.
3. `npm trust github @klnap/<name> --repo klnap/<name> --file release.yml --env npm --allow-publish`
4. Reject the staged version on npmjs.com (Staged Packages tab), then push the release tag so CI publishes it with provenance.
5. After one successful OIDC publish: revoke automation tokens and, on the package settings page, require 2FA and disallow tokens.

Do not report Trusted Publishing as verified before a CI publish has succeeded.

## GitHub settings (required)

Public repo, default branch `main`, squash/rebase merges only, delete branch on merge. Changes reach `main` through pull requests, including release commits. Ruleset on `main`: required `verify` and `security` checks, no force-push, no deletion, no required approvals (solo maintainer). Ruleset on `v*` tags: no update or deletion. Environment `npm`, limited to `v*` tags.

## Extracting from a monorepo (required)

1. Inventory monorepo coupling and client references (grep for the client name; it never appears in a public repo).
2. Start a clean history; never publish monorepo history.
3. Audit the public API against current Payload behavior; delete code the package does not need.
4. Publish and verify the registry package, then switch the consumer to the exact registry version, refresh the lockfile, run the consumer's checks, and only then delete the workspace copy.
