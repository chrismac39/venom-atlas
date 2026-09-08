---
name: "Expand Venom Atlas Geography Features"
description: "Extend evidence-backed occurrence, native-range, regional, and marine geography layers without overstating distribution"
argument-hint: "Optional organism slug or geography feature to focus on"
agent: "agent"
---

Implement geography improvements in the Venom Atlas repository. Work from the existing static-first
pipeline and thin-page architecture. Do not replace OpenLayers, add a runtime basemap, or turn sparse
observations into complete range boundaries.

## Resumable checklist

Use `[x]` only after the repository and focused validation confirm the item.

### Occurrence evidence

- [ ] Confirm every organism has a `confirmed_occurrence` geography range and a generated local
  occurrence GeoJSON asset.
- [ ] Keep GBIF records limited to reusable-license records and preserve source/citation metadata.
- [ ] Keep occurrence points as documented presence, not proof of a complete native or introduced range.
- [ ] Expose concise occurrence hover metadata: no more than approximately three fields, including the
  recorded date when available, with an honest fallback for missing dates.
- [ ] Ensure OpenLayers listeners are typed and cleaned up when the component unmounts.

### Native and administrative geography

- [ ] Try to identify a native country or source-backed range for each organism where authoritative
  evidence supports it; leave the native state absent or uncertain when evidence is insufficient.
- [ ] Store native-country and curated-range provenance in geography source YAML and link it to existing
  citations or evidence records.
- [ ] Generate native ADM1 shading from source-backed country/range evidence even when no GBIF point falls
  in a particular administrative unit.
- [ ] Keep derivations distinct: occurrence aggregation, source-to-ADM1 extrapolation, and curated geometry.
- [ ] Never label all observed occurrences native without explicit source support.
- [ ] Preserve accessible textual evidence and honest loading, empty, and error states.

### Marine geography

- [ ] Identify every `geographyKind: marine` record.
- [ ] Generate a local ISEA3H evidence-cell asset for each marine organism from its occurrence asset.
- [ ] Preserve antimeridian-wrapping marine cells while retaining strict geometry checks for ordinary
  administrative and curated range assets.
- [ ] Make the marine cell layer available through the same map controls for every marine organism.
- [ ] Keep ISEA3H cells as evidence aggregation, not a modeled marine range boundary.

### Pipeline and validation

- [ ] Include occurrence and marine-cell generation in the documented data build path.
- [ ] Run content, citation, media, structure, and geography validation.
- [ ] Run web typecheck and focused tests for hover metadata, native cells without occurrence points, and
  marine-cell coverage.
- [ ] Run the relevant web unit tests, production build, and geography-route browser checks.
- [ ] Inspect desktop and mobile rendering for geometry distortion, tooltip overflow, control overlap, and
  map/page scroll behavior.
- [ ] Keep generated static JSON, search, SQLite, occurrence, registry, and marine assets synchronized.

## Acceptance criteria

The work is complete only when every organism has an occurrence-tier map, every marine organism has an
ISEA3H option, source-backed native shading can include unobserved ADM1 units, occurrence hover metadata
is concise and date-aware, and all focused plus repository validation passes. Report organisms whose native
range remains intentionally unknown or uncertain instead of filling the gap with a generic claim.
