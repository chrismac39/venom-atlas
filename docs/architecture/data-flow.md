# Data Flow

1. Curated YAML under `content-source/*` is the canonical scientific content.
2. `apps/web/src/lib/content.ts` parses records with Zod and maps them to domain models.
3. `scripts/validate-*.ts` verifies references, citations, media, and structures before a production build.
4. Astro generates canonical HTML routes at build time.
5. `buildAtlasMonopageOrganisms()` creates one serializable atlas view model per organism.
6. `/` renders only the organism chooser; `/atlas/[slug]` receives one organism view model.
7. React islands progressively hydrate interactive maps, charts, and molecular viewers.

## Geography completeness principle

Every organism must expose a geography layer on its monopage. The minimum supported tier is
occurrence evidence: reusable-license, source-linked point records rendered as documented
presence, never as a complete native or introduced range. Higher tiers may add source-backed
regional presence or curated range geometry when the evidence and asset metadata support them.
An organism without higher-tier geography still receives the occurrence map and its limitations
are stated plainly in the UI.

The public site has no production API or ClickHouse dependency. The superseded service implementation is retained under `legacy/*` for historical reference.
