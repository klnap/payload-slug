# Maintaining

Shared package infrastructure follows the read-only reference at
[`klnap/npm-package-template`](https://github.com/klnap/npm-package-template). This package keeps its
Payload-specific exports, CSS asset, integration tests, and supported Node.js floors.

## Development and quality gates

Use Bun `1.4.5` and the Node.js range declared in `package.json`.

```sh
bun install --frozen-lockfile
bun run check
npm pack --ignore-scripts
scripts/consumer-smoke.sh klnap-payload-slug-<version>.tgz
```

`bun run check` runs formatting, lint, typechecking, Knip, unit and integration tests, the build,
publint, and Are the Types Wrong. The packed consumer test checks the published file allowlist,
TypeScript inference and errors, ESM imports, the admin export, and a real Payload/SQLite operation
on the minimum and latest supported Payload 3.x versions. CI also runs the packed runtime smoke test
on each declared Node.js minimum.

The project typecheck sets `skipLibCheck` because Payload 3.94.1 transitively includes incompatible
Next.js and Bun ambient declarations and references the untyped `minimist` package. The isolated
consumer fixture still checks this package's declarations and public API.

## Package contract

- Preserve the package name, release history, ESM-only exports, CSS side effect, Payload peers, and
  actual tested Node.js range.
- `dist`, `README.md`, `CHANGELOG.md`, and `LICENSE` are the published file allowlist.
- Keep the exact npm registry in `publishConfig`; do not add workspace or local path dependencies.
- Build output includes JavaScript, declarations, source maps, and the admin stylesheet.

## Changesets release lifecycle

Add a changeset for consumer-visible changes. Do not add one for repository-only maintenance. Use
patch for compatible changes, minor for breaking changes before `1.0.0`, and major from `1.0.0`.

```text
Pull request and CI
→ squash merge to main
→ automated Changesets Release PR
→ maintainer approves its workflow run and merges it
→ build, pack, and verify the tarball
→ npm Trusted Publishing
→ vX.Y.Z tag and GitHub Release
```

The release workflow uses Changesets' `select-mode`, `version`, `pack`, and `publish` actions. The
version job opens the Release PR with a job-scoped `GITHUB_TOKEN`. The unprivileged pack job runs
`bun run check`, packs once, and verifies the publish-plan integrity, package identity, source commit,
file allowlist, TypeScript consumer, and Payload runtime. The publish job receives npm OIDC
permission and publishes that same tarball without rebuilding it. Changesets creates the version
tag; the workflow verifies the tag points to the packed source commit before creating the GitHub
Release.

Release runs serialize without canceling an active publication. Do not publish a new version for
repository-only changes or move an existing tag.

### Recovering a partial release

- Build or verification failure: fix the cause, then rerun the workflow on `main`.
- OIDC failure: verify the npm Trusted Publisher and `npm` environment bindings, then rerun.
- An npm version already exists: verify its integrity and provenance; never overwrite it.
- npm succeeds but tag or GitHub Release creation fails: verify the npm package first. Compare the
  tag target with the source SHA from the pack job. Do not move an existing tag. Create only missing
  release metadata after confirming the published version came from that commit.

After a successful release, verify `npm view @klnap/payload-slug@<version> dist.integrity` and the
provenance on npm. Do not claim Trusted Publishing works until a successful OIDC publication proves
it.

## npm Trusted Publishing

Configure npm with repository `klnap/payload-slug`, workflow `.github/workflows/release.yml`, and
environment `npm`. Allow direct `npm publish`; this workflow does not use staged publishing or
`npm dist-tag`. No `NPM_TOKEN` or other long-lived publication credential belongs in GitHub.

The `npm` environment allows deployments only from `main`. Keep OIDC permission scoped to the
`publish` job.

## GitHub and dependency settings

Repository settings are external to this checkout. The active `main` ruleset requires pull requests,
strict `verify` and `security` checks, resolved review conversations, and linear history. It allows
no required approvals for the solo maintainer and blocks branch deletion and force-pushes. The
active `v*` tag ruleset blocks updates and deletion.

GitHub Actions keeps read-only default token permissions and can create the Changesets Release PR.
Full-SHA action pinning, secret-scanning push protection, Dependabot alerts, private vulnerability
reporting, CodeQL, and immutable releases are enabled. Renovate applies `renovate.json`; it delays
ordinary updates by three days, pins action digests, and leaves security and runtime dependency
updates for review.

The package also retains its `security` required check, which runs `bun audit` and zizmor. Keep this
check until the repository's required status checks are deliberately updated.

## Extraction history

This repository is standalone. Do not restore monorepo workspace references, local aliases, private
package dependencies, or host-repository assumptions.
