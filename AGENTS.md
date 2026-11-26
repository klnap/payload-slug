# Package Development and Release Policy

This file is the standing operating policy for work in this repository. Follow it in future
sessions. `MAINTAINING.md` remains authoritative for package-specific engineering, quality gates,
release workflow details, and recovery procedures; preserve those requirements.

## Ownership and working model

- Complete the authorized package development and release lifecycle without repeated permission
  requests for routine operations.
- Use GitHub Flow: start from current `origin/main`, use short-lived task branches, Conventional
  Commits, pull requests, and squash merges.
- Reuse an existing branch or pull request when continuing its work. Preserve unrelated changes.
- You may commit, push, create and update pull requests, approve eligible Actions runs, merge verified
  pull requests, manage Changesets, and complete GitHub Actions npm Trusted Publishing.
- Never force-push, indiscriminately reset the worktree, bypass repository protections, or publish
  from a local machine.

## Implementation lifecycle

For a completed implementation that warrants a release:

1. Inspect repository state and existing work; implement the requested scope.
2. Run focused tests, independent review, and package validation. Update relevant documentation.
3. Add a Changeset for consumer-visible changes, using SemVer and actual consumer impact.
4. Commit and push the task branch; create or update its pull request.
5. Wait for required checks, resolve material findings, and merge using the configured strategy.
6. Monitor main-branch CI and the Changesets workflow.
7. Inspect the generated Release PR, including its full diff, version bump, changelog, and scope.
8. Approve eligible pending workflow runs; wait for all required checks; merge the verified Release PR.
9. Monitor artifact verification and npm Trusted Publishing.
10. Independently verify the exact package version in npm, its dist-tag and provenance where supported,
    the Git tag, and the GitHub Release.
11. Do not report success until npm registry verification passes. Then synchronize local `main` and
    safely clean up completed branches.

Do not stop at an intermediate PR or workflow when the next authorized step is available.
Stop only for a genuine blocker: missing permissions or interactive authentication, unresolved
security issues or failing required checks, conflicting user changes, unexpected release scope,
a necessary architectural decision, or a platform restriction that would require bypassing security.

## Release rules

- Use Changesets as the only versioning and release-management mechanism. Never bump versions or
  create release tags manually.
- Inspect pending Changesets before release. Keep the full release scope within the requested work.
- Do not create releases for repository-only changes. Do not overwrite published versions or move tags.
- Preserve the build-once, verify, publish architecture and use GitHub Actions Trusted Publishing.
- Never introduce long-lived npm publishing tokens.
- Use `~/code/packages/npm-package-template` as the source of truth for shared engineering and release
  infrastructure.

## Scope overrides

Explicit instructions for the active task override this default lifecycle. Respect requests for
local-only work, push-only, no merge, no release, or no publication.

Research, investigation, design discussions, and unfinished implementations do not trigger releases
automatically. Do not manufacture blockers, repeat successful checks unnecessarily, or refactor beyond
the requested scope.
