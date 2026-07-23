# Venom Atlas

Venom Atlas is an interactive scientific atlas for venomous and poisonous organisms, linking organism biology to venom composition, molecular views, mechanisms, physiology, and geography.

## Project purpose

This repository scaffolds a TypeScript-first, evidence-aware visualization architecture where scientific claims are provenance-linked and uncertainty is explicit.

## Screenshots

Screenshot placeholders will be added after UI stabilization.

## Current sample case

- Scientific name: _Solenopsis invicta_
- Common name: Red imported fire ant
- Featured compound: Solenopsin A

## Architecture summary

- Monorepo: pnpm workspaces
- Web: React + Vite + React Router + Vega/Vega-Lite + 3Dmol.js adapter boundary
- API: Fastify + Zod + repository layer
- DB: ClickHouse via `@clickhouse/client`
- Shared contracts: domain, schemas, visualization-contracts packages

## Prerequisites

- Node.js 20+
- pnpm (via Corepack)
- Docker Desktop

## Installation

```bash
pnpm install
```

## Docker startup

```bash
pnpm db:up
```

## Migrate and seed

```bash
pnpm db:migrate
pnpm db:seed
```

## Run web and API

```bash
pnpm dev
```

Or separately:

```bash
pnpm dev:api
pnpm dev:web
```

## Tests

```bash
pnpm test
pnpm test:e2e
```

## Lint, typecheck, build

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Molecular renderer explanation

- 3Dmol.js is implemented for small-molecule rendering where verified structure files exist.
- Mol* is currently scaffolded as an adapter boundary for future peptide/protein/complex support.
- Renderers are display engines, not sources of scientific truth.

## Scientific source policy

- Claims are linked to citation/evidence records where possible.
- Uncertain values are `null` and rendered as "Data not yet sourced."
- No fabricated percentages, molecular coordinates, maps, or medical incidence values.

## Current limitations

- Solenopsin A formula, molecular weight, and verified structure assets are not yet sourced.
- Geographic range geometry files are intentionally pending.
- Placeholder media assets are unverified and non-production.

## Next vertical slices

- Tetrodotoxin and blue-ringed octopus
- Cone snail peptide toxin
- Snake peptide/protein toxin
- Spider toxin with well-characterized ion-channel target
