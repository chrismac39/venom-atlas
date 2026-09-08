# Milestone 1B — Molecular rendering validation

**Date:** 2026-09-08. **Scope:** separately authorized molecular rendering reliability work, not source curation or release approval.

## Investigation and outcome

- Verified installed dependencies with `pnpm install --frozen-lockfile`. The locked renderer is **3dmol 2.5.5**, whose package entry is a Webpack UMD/CommonJS bundle. Its version and renderer library are unchanged.
- Started an isolated development server on port 5204 with a new optimizer cache. Before interop changes, Fire Ant rendered a molecule after approaching the deferred Chemistry viewer. The existing development server on port 5199 also rendered. **The audited historical import failure did not reproduce.** Dependency verification plus fresh Vite caches is not a claim that every installed package was deleted and reinstalled.
- Inspected Vite optimizer metadata (`needsInterop: true`), the package entry point, and dynamic import behavior. Explicit optimizer inclusion/interop avoids late discovery of the lazy CommonJS dependency. The adapter accepts named or default module namespaces. These are defensive changes; stale optimization/HMR state remains a possible explanation, not an established root cause.
- A live development hot-update spot check after adapter/hook edits retained a visible molecule, one canvas, ready status, and no displayed error. This is not an exhaustive HMR soak test.

## Implementation

- [Astro configuration](../../apps/web/astro.config.mjs): explicit 3dmol prebundling/interop, with optional isolated test caches. Production remains static and molecular code remains dynamically loaded.
- [Renderer hook](../../apps/web/src/molecular/hooks/useMolecularRenderer.ts): one mount per model/retry, separate serialized option updates, cancellation, isolated mount DOM, late-handle disposal, resize observation, error handling and retry. Controls no longer recreate a WebGL viewer or refetch the same structure.
- [3Dmol adapter](../../apps/web/src/molecular/adapters/ThreeDmolAdapter.ts): checks HTTP status, nonempty parsed atoms and finite coordinates; aborts stale work; implements real camera reset, rotation and zoom; clears scene/DOM on failure or disposal. Disposed control methods do nothing; disposed updates reject through their aborted signal.
- [Viewer](../../apps/web/src/molecular/components/MoleculeViewer.tsx): persistent host and readable text/2D fallback; retry for recoverable loads; page-reload guidance for a cached failed module import. Arrow keys rotate, +/− zoom, Home resets, Tab exits, Escape restores unfocused wheel behavior. An unfocused viewer does not cancel browser scrolling; a focused viewer permits wheel zoom.
- Supported geometric controls are ball-and-stick, stick, space-filling, and SES/SAS/VDW surfaces with element/uniform coloring and opacity. Gaussian, hydrophobicity, electrostatic analysis, fake 3D “2D” mode, and origin-stacked contact labels are not offered. Unsupported analysis requests are rejected rather than silently substituted.
- Illustrative complexes are excluded when the atlas constructs its complex model. The current fictional Solenopsin contacts, annotation fetch and demo viewer are absent from the normal dossier. Demo source fixtures are retained; their evidence classification is unchanged.
- Dedicated toxin routes now expose available real 2D assets rather than an unconditional placeholder notice. Atlas 2D images use a white background in both themes and offer full-size inspection.

## Stereochemistry check and limits

[SVG generation](../../scripts/structure-svg.ts) no longer deletes R/S or “this enantiomer” text, nor regex-crops the result. OpenChemLib handles depiction/cropping with a deterministic SVG ID. Its default atom bounds omit the below-molecule enantiomer label: **40 px of margin** is retained, and actual browser text bounding boxes are checked against the SVG viewport for both published assets.

Regenerated only the Solenopsin A and Batrachotoxin SVGs from their existing local SDFs. Tests establish:

- Removing explicit hydrogens with OpenChemLib retains the canonical identity code of each input, including its encoded stereochemistry.
- Published SVGs exactly match the deterministic renderer output and retain the R/S and enantiomer annotations.
- A pair of opposite-enantiomer fixtures produces different depictions.
- Every text bounding box in both published SVGs is within the visible viewport (not merely present in XML).

This preserves the **input's** meaning. It does not establish that a local SDF matches the toxin's intended exact stereoisomer, PubChem accession, biological mixture, or independently verified chemistry. Those reviews belong to 1C. Additional structures need the same visual-bounds checks; this margin is not a universal guarantee for arbitrary new depictions.

## Checks run

| Check | Result |
| --- | --- |
| `pnpm test` | 96 web tests and 2 schema tests passed; domain/contracts still have no tests. 19 new molecular unit tests. |
| `pnpm lint` | Passed. Existing root ESLint module-type warning remains. |
| `pnpm typecheck` | Passed. Astro reports no diagnostics; existing missing content-directory warning remains. |
| `pnpm --filter @venom-atlas/web build` | Passed; 127 HTML routes compared. Existing 3dmol eval and large-chunk warnings remain. |
| Molecular browser suite — development | 10 passed, isolated server on 5205 and a unique fresh optimizer cache for each run. |
| Molecular browser suite — production | 10 passed, isolated static preview on 5206. |
| Live development hot update | One visible molecule canvas, ready status, no displayed error after edits. |
| `git diff --check` | Passed. |
| `pnpm exec tsx scripts/validate-structures.ts` | Passed independently of the blocked chained content gate. |
| `pnpm validate` | **Expected failure: unchanged 28 issues** — 2 unsupported Solenopsin claims and 26 dangling geography references to 14 assessments. Subsequent chained scientific validators are not reached. |

The browser suite exercises both reference organisms, reload, return from another organism and from Geography, actual non-background molecular pixels, drag and keyboard rotation, real reset, surface controls without repeat structure fetches, viewport resize to 390 px, focus/Tab/Escape, wheel/page-scroll coexistence, failed renderer import, HTTP 503/retry, malformed structure, WebGL unavailable, absent fictional contacts, dedicated toxin rendering, and 2D label clipping. WebGL failure injection covers both HTMLCanvasElement and OffscreenCanvas because this 3dmol version can share an offscreen WebGL2 context.

## Reproduce the bounded checks

- Development: `pnpm --filter @venom-atlas/web test:molecular:e2e`.
- Production: first `pnpm --filter @venom-atlas/web build`, then run the same browser command with environment variable `MOLECULAR_TEST_MODE` set to `production`. Unset it afterward to return to development checks. The checked-in [browser configuration](../../apps/web/playwright.molecular.config.ts) selects isolated ports and refuses to reuse existing servers.
- Unit coverage is in [adapter tests](../../apps/web/tests/molecular-adapter.test.ts), [viewer lifecycle tests](../../apps/web/tests/molecular-viewer.test.tsx), and [SVG tests](../../apps/web/tests/structure-svg.test.ts). Browser assertions are in [the molecular suite](../../apps/web/tests/molecular-rendering.e2e.spec.ts).

## Remaining limits

- Chromium/software WebGL and local Windows checks are not Safari/Firefox, real touch-device, GPU/driver, or exhaustive accessibility qualification. This is not a full-site Playwright run or a project-base-path deployment check.
- 3dmol's public `clear()` removes scene content but does not expose full teardown of its internally bound global listeners. Application fetches/observers/DOM are cleaned up and control changes reuse the viewer; long-lived repeated mount/HMR resource-soak behavior remains an upstream lifecycle limitation. No global event monkeypatch was introduced.
- Browser-cached failed dynamic imports may need a page reload rather than only component retry. HTTP structure failures are verified to recover with Retry.
- No chemistry source evidence, citation support, review status, geography, organism breadth, Mol* implementation, or clinical content was curated here. The full root build remains blocked at scientific validation; web-only build success does not waive that gate.