# ADR-001: Monorepo with pnpm workspaces

## Status

Accepted

## Decision

Use pnpm workspaces for `apps/*` and `packages/*`.

## Rationale

Shared scientific contracts (domain, schemas, visualization contracts) must be consumed by both API and web while remaining version-coherent.

## Consequences

- Easier contract reuse and synchronized type evolution.
- Unified scripts for lint/typecheck/test/build.
