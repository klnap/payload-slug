# Contributing

Bug reports and focused pull requests are welcome. Open an issue first for new features, because the package scope is deliberately small.

## Setup

Requires Bun `1.4.5` and Node `^22.23.5 || ^24.22.3 || >=26.13.1`.

```sh
bun install --frozen-lockfile
bun run check
```

Before opening a pull request, test the packed package with the consumer smoke test:

```sh
npm pack --ignore-scripts
scripts/consumer-smoke.sh klnap-payload-slug-<version>.tgz
```

Tests include a Payload integration test against a temporary SQLite database. Behavior changes need a test.

## Changes

Use Conventional Commits for pull request titles. Add a changeset for consumer-visible changes:

```sh
bun run changeset
```

Use patch for compatible fixes and additions, minor for breaking changes while this package is below `1.0.0`, and major from `1.0.0` onward. Documentation-only, test-only, and internal maintenance changes do not need a changeset unless they affect published files or behavior.

## Releases

Maintainers only. See [MAINTAINING.md](./MAINTAINING.md).
