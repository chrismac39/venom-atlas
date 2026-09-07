# Rebuild Geography Map From Scratch

## Progress

Use `[x]` for work verified in the repository and `[ ]` for work that remains open.

- [x] Core map rebuild completed with local OpenLayers and local administrative GeoJSON.
- [x] The map now uses evidence-oriented ADM1 records instead of treating sparse observations as complete range boundaries.
- [ ] The full quality bar is not complete: curated source geometry remains, and marine map support is still future work.

The previous geography map was not trustworthy because of projection and geometry distortions. That rebuild has now been completed with a local OpenLayers implementation. Keep this document as the implementation checklist and follow-up work log rather than restarting the replacement.

## Product Goal

Build a simple, reliable OpenLayers map embed that answers this question quickly:

> For a given species, which sub-national regions are native, and which are introduced?

- [x] The map uses sub-national administrative regions wherever practical:

- [x] US states
- [x] Canadian provinces and territories
- [x] States/provinces/regions in other countries
- [x] Equivalent first-level administrative units

The map is not intended to show a mathematically modeled global range boundary. It is a compact evidence-oriented distribution viewer.

## Non-Negotiable Requirements

1. [x] OpenLayers is the only active map renderer.
2. [x] The old SVG map renderer and generated occurrence SVG assets were removed from the active map path.
3. [x] No fallback SVG map, hand-written SVG projection, or custom canvas projection is used by the active map.
4. [x] The map does not use remote tile servers or runtime network-dependent basemaps.
5. [x] Map geometry comes from local GeoJSON assets.
6. [x] The map uses the stable Web Mercator projection (`EPSG:3857`).
7. [x] Sub-national polygons are the primary distribution representation.
8. [x] The map uses clearly distinct styles for:
  - [x] Native distribution
  - [x] Introduced distribution
  - [x] Uncertain or disputed distribution, when supported by the data
9. [x] The map supports pan and explicit `+/-` zoom controls.
10. [x] Scroll-wheel zoom is focus-gated:
    - [x] Initially, scrolling over the map continues scrolling the page.
    - [x] Clicking inside the map activates scroll-wheel zoom.
    - [x] Clicking outside the map deactivates scroll-wheel zoom and returns wheel control to the page.
    - [x] The active/inactive state is visible to the user.
11. [x] Layer controls are explicit map interaction controls and remain available alongside the map.
12. [x] An accessible textual/list representation is preserved below the map; the map is not the only way to learn the distribution.
13. [x] Loading, error, and no-record states are handled for species without sub-national distribution records.

## Data Model

- [x] Create a small local, database-style distribution registry. It is generated as JSON and structured as records rather than embedded map drawing instructions.

Suggested shape:

```ts
interface DistributionRecord {
  speciesId: string;
  regionId: string;
  countryCode: string;
  adminLevel: 1;
  regionName: string;
  distributionStatus: 'native' | 'introduced' | 'uncertain' | 'recorded_presence';
  evidenceIds: string[];
  note?: string;
}
```

Keep region geometry separate from species records:

```ts
interface AdministrativeRegion {
  regionId: string;
  countryCode: string;
  regionName: string;
  adminLevel: 1;
  geometryAssetId: string;
}
```

The application should join distribution records to local administrative GeoJSON at load time or during a deterministic build step. Do not duplicate polygon coordinates inside each species record.

- [x] Start with a representative dataset for the existing species.
- [x] Keep the schema extensible to additional species and countries.
- [x] Keep `recorded_presence`, `native`, `introduced`, and `uncertain` evidence semantics separate.
- [x] Do not fill every ADM1 in a country from a country-level statement alone.
- [ ] Add a real curated source polygon for at least one species to exercise the Tier 3 path.

## Geometry Requirements

Use a known-good local administrative-boundary dataset with valid GeoJSON polygons or multipolygons. Before integrating it into the UI:

- [x] Validate the global and national GeoJSON structures during asset generation/validation.
- [x] Use longitude/latitude source coordinates in `EPSG:4326` and let OpenLayers project them to `EPSG:3857`.
- [x] Replace the distorted world-atlas path with geoBoundaries ADM1 and ADM0 assets.
- [x] Do not generate SVGs from the active geometry path.
- [x] Do not manually project coordinates.
- [x] Add explicit artifact-segment and antimeridian validation to the geography asset checks; antimeridian-spanning segments are rejected for the initial dataset.
- [x] Add source/license/geometry metadata validation for curated range assets.

- [x] Remove the unsuitable world-atlas map path and replace it with the local geoBoundaries administrative assets.

## Interaction Requirements

- [x] Implement focus-gated wheel zoom with OpenLayers interactions:

- [x] Construct the map with `MouseWheelZoom` disabled.
- [x] Add `MouseWheelZoom` when the map container receives a click.
- [x] Remove `MouseWheelZoom` when the user clicks outside the map.
- [x] Avoid recreating the map instance during activation changes.
- [x] Do not attach a global wheel handler that prevents normal page scrolling.
- [x] Keep pan and zoom buttons available regardless of wheel-zoom activation state.
- [x] Add automated browser coverage for the complete activation/deactivation sequence.

- [x] The interaction works on the dedicated geography route and in the shared geography panel embedded in the atlas.

## Architecture

Follow the repository's thin-page architecture:

- [x] Route files remain thin.
- [x] Orchestration/data loading belongs in the appropriate hook or existing data layer.
- [x] The OpenLayers host/component owns map rendering and map interactions.
- [x] The map implementation remains isolated from unrelated visualization components.

Use the existing design system and evidence terminology. Do not introduce a new decorative map treatment. The map should prioritize legibility, regional comparison, and quick scanning.

## Reset Procedure

1. [x] Inspect the map-related files, generated assets, package dependencies, and references.
2. [x] Delete the current SVG renderer, custom projection logic, stale SVG assets, and unnecessary basemap path.
3. [x] Remove the obsolete map dependency path after the replacement was working.
4. [x] Add the OpenLayers implementation and local administrative region data.
5. [x] Add focused tests for:
  - [x] Local GeoJSON feature collection and curated source metadata validation
  - [x] Distribution registry parsing/validation against a complete fixture
  - [x] Native versus introduced, uncertain, and recorded-presence classification
  - [x] Missing/empty species distributions
  - [x] Focus-gated wheel zoom behavior where test infrastructure permits
6. [x] Typecheck and build the web app.
7. [x] Start the dev server and validate the actual geography route.
8. [x] Capture and inspect desktop and mobile screenshots of the actual geography route.
9. [x] Inspect the rendered map for geometry distortion, world-spanning lines, incorrect fills, map overflow, and control overlap.
10. [x] Test the core interaction sequence manually:
    - [x] Scroll page while pointer is over an unfocused map: page scrolls.
    - [x] Click map, then scroll: map zooms.
    - [x] Click outside map, then scroll: page scrolls again.
    - [x] Toggle native/introduced layers.
    - [x] Pan and use `+/-` controls.

## Acceptance Criteria

The work is complete only when:

- [x] No active source or generated map path references the old SVG renderer.
- [x] The map is rendered by OpenLayers from local vector data.
- [x] The visible geometry is sub-national and does not show projection artifacts or world-spanning distortion lines.
- [x] Native, introduced, uncertain, recorded-presence, and confirmed-occurrence layers are visually distinguishable and togglable where data exists.
- [x] Wheel zoom is inactive until the user clicks into the map and deactivates after clicking away.
- [x] The textual evidence/list fallback remains present.
- [x] Empty and loading/error states are handled.
- [x] `pnpm --filter @venom-atlas/web typecheck` passes.
- [x] `pnpm --filter @venom-atlas/web build` passes.
- [x] Browser validation has been performed on the actual geography route, not only through unit tests.
- [x] Geography-specific automated tests pass: registry semantics, registry fixtures, local GeoJSON contracts, view-state behavior, focus-gated zoom, and the neutral no-evidence state are covered.
- [x] Global geometry loading is optimized by using the authoritative ADM0 asset initially and deferring detailed ADM1 loading until regional zoom.

When reporting back, list the deleted legacy map files, the new data model/assets, the interaction behavior, and the exact validation performed.
