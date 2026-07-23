# System Overview

Venom Atlas is a TypeScript monorepo with a React web app and a Fastify API over ClickHouse.

## Layers

- `packages/domain`: shared scientific domain entities and curated seed data.
- `packages/schemas`: runtime Zod schemas for validation.
- `packages/visualization-contracts`: renderer and selection contracts.
- `apps/api`: Fastify routes, repository layer, ClickHouse access, migration/seed runners.
- `apps/web`: route-driven atlas UI with Vega, SVG diagrams, and molecular adapter boundaries.

## Product Story

Each route is independently useful but linked through one narrative:
organism -> venom mixture -> featured molecule -> mechanism -> physiology -> geography.

## Reliability

- API route params and key responses are validated.
- DB rows are adapted into domain objects before UI consumption.
- Visualization libraries consume renderer contracts, not DB rows.
