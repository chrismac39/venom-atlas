# Venom Atlas

Venom Atlas is a static-first scientific atlas for venom biology, toxin pathways, molecular representations, and evidence provenance.

## Public-site architecture

The production site is generated as static HTML with Astro and deployed to static hosting.

Flow:

Authored scientific content
-> build-time validation
-> static Astro pages
-> page JSON artifacts
-> optional browser SQLite explorer data

No production backend server, production database, or Docker runtime is required.

## Technology stack

- Monorepo: pnpm workspaces
- Static site: Astro
- Interactive islands: React
- Visualizations: Vega, Vega-Lite, 3Dmol.js adapter boundary, scaffolded Mol* adapter
- Shared contracts: `packages/domain`, `packages/schemas`, `packages/visualization-contracts`
- Testing: Vitest + Playwright

## Repository structure

- `apps/web`: Astro site and React islands
- `content-source`: canonical authored scientific content (YAML)
- `scripts`: validation and artifact generation
- `legacy`: archived API/ClickHouse/local-dev infrastructure
- `docs`: architecture, ADRs, sourcing, migration, deployment

## Local development

```bash
pnpm install
pnpm dev
```

Dev URL:

- http://localhost:5173

## Content authoring

Canonical records live in:

- `content-source/organisms`
- `content-source/venoms`
- `content-source/toxins`
- `content-source/mechanisms`
- `content-source/physiology`
- `content-source/geography`
- `content-source/citations`
- `content-source/media`

## Validation requirements

Run:

```bash
pnpm validate
```

Validation checks include:

- missing citations
- missing related entities
- route collisions
- missing referenced files
- image attribution coverage
- structure and geometry publishability rules

## Build and preview

```bash
pnpm build
pnpm preview
```

Output directory:

- `apps/web/dist`

## Tests

```bash
pnpm test
pnpm test:e2e
```

## Citation and evidence policy

- Evidence confidence is preserved and rendered explicitly.
- Provisional and placeholder claims stay labeled as provisional.
- No fabricated citation, molecular structure, or geography data is introduced.

## Media licensing policy

- Public image redistribution must be verified before publication use.
- Unverified media remains blocked or shown through explicit placeholder states.
- Audit file: `docs/sources/media-license-audit.md`

## Molecular provenance policy

- Molecular renderers are display layers, not evidence.
- Structure provenance and verification metadata are required for publishable structures.
- Placeholder structures remain explicitly marked as placeholder.

## Deployment

Primary target: Cloudflare Pages static hosting.

See:

- `docs/deployment/cloudflare-pages.md`

GitHub Pages portability is supported via base-path configuration.

## Legacy infrastructure

Historical Fastify/ClickHouse/Docker code is archived under `legacy/`.
It is not part of the active production path.

## Current limitations

- Solenopsin A structure records remain placeholder-level.
- Geographic range geometry remains placeholder-level.
- Several media assets still require verified redistribution licensing metadata.

## Roadmap

- Additional organisms and toxins
- Improved source audits
- Optional browser-side exploration features built on generated static artifacts
