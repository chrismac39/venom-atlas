# ADR-005: Static-first Astro architecture for public hosting

## Status
Accepted

## Date
2026-07-24

## Decision
Adopt Astro static site generation as the primary production architecture and remove runtime dependency on Fastify and ClickHouse for canonical page delivery.

## Context
The existing architecture was optimized for local API and ClickHouse-backed development. Public deployment goals now prioritize low operational cost, static hosting compatibility, deterministic build output, and source/provenance transparency.

## Architecture
- Astro in `apps/web` provides file-based static route generation.
- Canonical scientific content resides in `content-source/*` and is validated at build time.
- Domain and schema packages remain shared and store-neutral.
- React is used as islands only for interactive components.
- Legacy API/ClickHouse infrastructure is archived under `legacy/*`.

## Consequences
### Positive
- No required production server, VM, Docker runtime, or secrets.
- Canonical nested routes resolve as generated HTML on static hosts.
- Reduced runtime failure surface and hosting cost.
- Build pipeline can fail fast on sourcing/provenance defects.

### Tradeoffs
- Content changes require rebuild/deploy cycles.
- Interactive querying capabilities move to optional browser-side features.
- Legacy API integration tests are no longer part of active CI.

## Supersedes
- `ADR-002-clickhouse.md` is superseded for production architecture.
- `ADR-002` remains preserved as historical context for prior architecture and local experimentation.