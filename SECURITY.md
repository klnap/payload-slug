# Security policy

## Supported versions

Only the latest published version receives fixes.

## Reporting a vulnerability

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/klnap/payload-slug/security/advisories/new). Do not open a public issue. Expect an acknowledgement within a few days.

## Scope

The package runs inside your Payload server and admin. Relevant reports include slug handling that bypasses access control, the server function exposing data, and release or supply-chain weaknesses. The package has a GitHub Actions npm Trusted Publisher, and the `0.1.1` publish produced provenance. The new Changesets release path still needs a successful OIDC run.
