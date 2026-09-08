# Visualization Boundaries

## Rule

Renderers consume contracts and adapted domain objects, never raw ClickHouse rows.

## Boundaries

- Vega/Vega-Lite: receives chart specs built from typed chart adapters.
- 3Dmol.js/Mol*: receives `MoleculeRenderModel` from molecular adapter layer.
- SVG anatomy/mechanism: receives typed highlight/step contracts.
- Map panel: receives typed geographic layer entities and geometry metadata.

## Geography coverage tiers

Map coverage is required for every organism. Renderers should prefer these evidence tiers in
order, while preserving each layer's provenance:

1. Occurrence evidence: validated, source-linked points showing recorded presence.
2. Regional presence: administrative units derived from occurrence intersections or an explicit
	source-backed regional claim.
3. Curated range geometry: native, introduced, or uncertain boundaries only when a source-backed
	geometry asset has valid provenance and licensing.

Occurrence evidence must not be presented as a complete range. Missing higher tiers are expected
and should not suppress the minimum occurrence map.

## Why it matters

- Prevents coupling UI logic to storage details.
- Allows renderer replacement without domain rewrite.
- Keeps provenance and evidence assessment visible across views.
