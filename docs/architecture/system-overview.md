# System Overview

Venom Atlas is a static-first TypeScript monorepo built with Astro and focused React islands.

## Layers

- `content-source`: canonical, evidence-linked scientific content.
- `packages/domain`: shared scientific domain entities.
- `packages/schemas`: runtime Zod schemas for validation.
- `packages/visualization-contracts`: renderer and selection contracts.
- `apps/web`: statically generated routes with Vega, SVG, map, and molecular-rendering islands.
- `scripts`: build-time content, citation, media, and structure validation.
- `legacy`: superseded Fastify, ClickHouse, and SPA implementations.

## Product Story

Each route is independently useful but linked through one narrative:
organism -> venom mixture -> featured molecule -> mechanism -> physiology -> geography.

## Reliability

- YAML records and cross-record references are validated before deployment.
- Content records are adapted into route-specific view models before UI consumption.
- Visualization libraries consume renderer contracts, not DB rows.

## UI Route Architecture

- Astro route files perform build-time loading and bind data to presentation components.
- Interactive orchestration lives in feature hooks, not route files.
- Organism identity is encoded in `/atlas/[slug]`; query state is reserved for subordinate selections.
