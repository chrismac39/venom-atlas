# Visualization Boundaries

## Rule

Renderers consume contracts and adapted domain objects, never raw ClickHouse rows.

## Boundaries

- Vega/Vega-Lite: receives chart specs built from typed chart adapters.
- 3Dmol.js/Mol*: receives `MoleculeRenderModel` from molecular adapter layer.
- SVG anatomy/mechanism: receives typed highlight/step contracts.
- Map panel: receives typed geographic layer entities and geometry metadata.

## Why it matters

- Prevents coupling UI logic to storage details.
- Allows renderer replacement without domain rewrite.
- Keeps provenance and evidence assessment visible across views.
