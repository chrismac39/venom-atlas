# Venom Atlas

Venom Atlas is a static-first scientific atlas for poisonous, venomous, and toxin-producing organisms, toxin pathways, molecular representations, and evidence provenance.

**One organism, the full toxin story.** The approved product structure is **Organism, Geography, Chemistry, Effects**, with sources available throughout. “Full” includes documented uncertainty and gaps, not implied completeness.

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
- `content-source/toxic-materials`
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

Selected primary target: **GitHub Pages** (Milestone 0, 2026-09-08).

- Both root deployment (`/`) and project deployment (`/venom-atlas/`) must work.
- Base-path configuration exists; complete route/asset portability and deployment verification remain release gates, not proven capabilities.
- GitHub Pages workflow/setup and production verification are planned in [Milestone 6 of the active roadmap](docs/quality/venomatlas-product-audit-and-action-plan.md#milestone-6--static-host-release-gates-and-maintainability).
- The [Cloudflare Pages deployment guide](docs/deployment/cloudflare-pages.md) is retained as an alternative, not the selected deployment path.


## Legacy infrastructure

Historical Fastify/ClickHouse/Docker code is archived under `legacy/`.
It is not part of the active production path.

## Current limitations

- Milestone 1A's strict scientific gate reports unsupported Solenopsin A claims and dangling geography evidence references; see the [validation report](docs/quality/milestone-1a-validation.md). These remain publication blockers.
- Production molecular rendering was observed in a spot check; development reliability and unsupported analytical controls still need work.
- Geography includes sampled observations, terrestrial distribution infrastructure, and marine evidence cells; source precision, introduced-range evidence, and payload size remain gaps. Occurrences are not complete biological ranges.
- Organism photographs still require verified redistribution licensing before publication.

## Roadmap

The [product audit and action plan](docs/quality/venomatlas-product-audit-and-action-plan.md) is the **sole active product roadmap**. Milestone 0 is approved; later implementation is authorized separately. Older roadmaps and migration checklists are historical context, not competing work queues.

- **First references:** Fire Ant for integration; Golden Poison Frog/Batrachotoxin for chemistry. A specifically identified botulinum protein/clinical reference follows rather than blocking the first slice.
- **Expansion freeze:** retain the existing 15 organisms, but add no new organisms until the reference slices meet the roadmap's depth, evidence, reliability, and review criteria and the owner explicitly reopens expansion. Corrections to existing content remain allowed.
- **First-release focus:** evidence integrity, dependable chemistry, source-linked effects, bounded geography improvements, four-section composition, licensed media, and static-host release gates.
- **Deferred:** 3D anatomy, global range perfection, SQLite exploration, and broad comparative rankings. The existing optional explorer infrastructure is not a first-release deliverable.
