# Milestone 0A: generated/public artifact boundary

## Implemented

- Astro dev/build uses a separate allowlist-only publication directory, never the raw public directory. Web-only builds regenerate static JSON, search JSON, SQLite, and the species-filtered geography registry. A missing gate API or failed regeneration aborts rather than falling back to drafts.
- Generated record directories are replaced to remove formerly published records. Raw geography, molecular structures, and authored interaction annotation inputs remain available to offline jobs. They are not served unless explicitly relevant to the filtered public graph.
- Vite filesystem serving denies raw public inputs, authored content, old build output, and temporary fixture output. Source edits block requests while regeneration occurs; failed regeneration keeps serving blocked until a successful retry.
- Build startup cleans old output before evaluating the gate. Build completion verifies exact downloadable asset membership and bytes. Preview regenerates current artifacts and refuses a stale or draft-containing build.
- Registry generation filters both authored geographic claims and occurrence files by the public organism roster. Staging copies only graph-referenced assets, verified structures and referenced verified images, plus the two neutral map boundary layers when geography is relevant.
- Search and supporting links use the summary, chemistry, and medical-effects canonical anchors. Supporting return links honor the project base path.
- The root explains an empty public roster. A canonical-only sitemap uses the public route inventory and excludes aliases, redirects, and 404. Set `PUBLIC_SITE_URL` to the deployment origin; without it the XML intentionally contains no URLs rather than publishing an invented origin or localhost. `PUBLIC_BASE_PATH` is applied to sitemap URLs.
- Renderer browser tests use an explicitly separate Astro fixture site, output directory, and four offline structure/image assets. No production publication bypass or environment toggle was added. The renderer's real WebGL, pixel, camera, keyboard, resize, retry, failure, and SVG clipping assertions remain in place.

## Commands

- `pnpm build:public-data`: regenerate, stage, and verify public artifacts.
- `pnpm validate:public-data`: verify generated/staged output against the current public graph.
- `pnpm --filter @venom-atlas/web build`: performs the same regeneration automatically before the static build.
- `pnpm --filter @venom-atlas/web test:publication:e2e`: isolated dev HTTP checks; set `PUBLICATION_TEST_MODE=production` for a fresh build and preview. Also supports a `PUBLIC_BASE_PATH` test run.
- `pnpm --filter @venom-atlas/web test:molecular:e2e`: isolated renderer fixture checks; set `MOLECULAR_TEST_MODE=production` to build and preview that fixture site.

## Validation on 2026-09-08

- Publication allowlist/staging/sitemap and Astro lifecycle unit tests: **15 passed**.
- Renderer browser suite, development fixture site: **10 passed**.
- Renderer browser suite, built fixture site: **10 passed**.
- Targeted ESLint and whitespace validation: passed.
- Real artifact regeneration and publication HTTP tests: **blocked pending the content-owner API**. At verification time `getPublicContentRecords` was not yet exported from the content loader. `build:public-data` failed closed before running the generators. Checked-in generated downloads therefore still require regeneration after that API lands.
- Astro config synchronization succeeds on Windows. Type checking is blocked by the same missing public graph export in the new HTTP test; no gate fallback was added to hide the integration error.

## Integration and remaining risks

- The content owner must provide the gated selectors, filtered public graph, source relevance, and public route inventory. This plumbing consumes those APIs and does not independently decide scientific readiness.
- Run public-data generation, web build, and publication HTTP tests in dev, production, and project-base modes after the content API lands. The tests exercise raw public and Vite `/@fs` bypass URLs, draft supporting/source routes, downloadable data, registry membership, sitemap, and empty-root behavior.
- Existing biological coverage/content audit/main UI tests that assert publication of current drafts still need reconciliation by their owners. Renderer coverage is independent of those draft publication assumptions.
- Asset staging is deliberately restrictive: new asset categories or reference fields need an explicit allowlist update. Missing approved files fail the build instead of silently publishing broken links.
- These integrations currently validate the standard application build directory. A custom Astro output directory requires matching validator path support.
- The user-owned audit document, content loader, atlas data builder, island, hook, types, and styles were not edited by this work.