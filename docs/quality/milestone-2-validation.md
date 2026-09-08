# Milestone 2 validation

Date: 2026-09-08

## Scope completed

- Added a reusable claim assertion contract in `@venom-atlas/schemas` and matching domain types.
- Migrated one computed chemical property: Solenopsin A molecular weight from PubChem CID 107941.
- Migrated one AI-summarized human clinical assertion: possible systemic allergic reaction after imported fire ant stings.
- Kept source version dates separate from retrieval, generation, and automated check timestamps.
- Added explicit applicability, source section locators, import/generation method versions, validation status, and optional conflict or missing-data representations.
- Added a checksum-verified PubChem cache and bounded importer that rejects multiple results, CID/InChIKey mismatches, and modified cache payloads.
- Added one shared React claim/source disclosure rendered by both the React atlas and an Astro toxin route.
- Added assertion status and claim IDs to the build-time readiness report.
- Made failed or quarantined assertions and non-public assertion citations block automated section readiness without introducing a human approval gate.
- Added explicit compound-occurrence records so one molecular identity can be associated with multiple organisms and materials.
- Added distinct identity contracts for compound groups, stereoisomers, salts, protonation states, protein isoforms/serotypes, and mixtures.
- Added cache-first DOI, PMID, and accession metadata import with identifier normalization, duplicate detection, provider pacing, payload checksums, and authored-content diffs.
- Generalized the bounded PubChem importer across approved identity/property fields while retaining exact CID and InChIKey checks.
- Added bounded cached AI extraction that treats retrieved text as untrusted data, validates model output, records source/model/prompt checksums, and quarantines failures.
- Added a manifest-driven offline ingestion pipeline with deterministic impact reports and publication gated by extraction, validation, and four-section readiness.
- Added source-page backlinks to stable claim anchors.
- Added a separate scheduled source-health workflow for redirects, missing pages, throttling, timeouts, staleness, and Crossref update/retraction relations.

## Verification

- `pnpm --filter @venom-atlas/schemas test`: 3 passed.
- Milestone 2 focused web suites: 153 tests passed across 9 files.
- `pnpm typecheck`: all workspace typechecks passed.
- `pnpm validate`: passed.
- `pnpm research:pubchem -- --cid=107941 --inchi-key=AYJGABFBAYKWDX-IRXDYDNUSA-N --subject=solenopsin-a`: rebuilt five property/identity assertions from the checked-in cache without a network request.
- `pnpm research:citation-metadata -- --pmid=29261949 --offline`: verified the NCBI cache and emitted an authored-content review diff without a network request.
- `pnpm research:extract`: rebuilt and validated the cached clinical assertion without a live AI service.
- `pnpm research:ingest`: passed discovery, cache, extraction, summary, and validation stages, then correctly blocked publication on dossier readiness.
- `pnpm build`: passed; 129 HTML routes and staged publication artifacts validated.
- Browser checks at `/sources/ncbi-fire-ant-bites` and the linked Fire Ant claim anchor passed at desktop and 390 by 844; the mobile source page had no horizontal overflow.

## Readiness result

The Fire Ant dossier has two passed assertions, one in Chemistry and one in Medical Effects. The organism remains unpublished because of pre-existing media, geography, chemistry-source, and unresolved-target citation blockers. `pnpm report:readiness` reports those blockers separately from assertion status.

## Operational boundaries

- Ordinary validation and builds remain offline and never invoke metadata providers or an AI service.
- `pnpm research:source-health` is an explicit networked maintenance command and also runs in the scheduled `source-health.yml` workflow.
- Importers and extractors emit reviewable candidates; they do not silently rewrite authored YAML.
- No ingestion credentials or raw provider secrets are stored in public artifacts.
