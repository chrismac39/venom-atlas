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

- [ ] Perform a native-range source check for every organism before deciding that native geography is
  unavailable. Use this source ladder in order: primary literature, IUCN or government agency, museum or
  university collection, taxonomic database, then a well-cited Wikipedia distribution section as a fallback.
  Record the source check even when it concludes that native status is uncertain.
- [ ] Do not stop at GBIF. Occurrence records establish documented presence, not native status; use a
  distribution or range statement from the source check to support native claims.
- [ ] Store native-country and curated-range provenance in geography source YAML and link it to existing
  citations or evidence records. Add a citation when the source check finds a source that is not already
  represented; Wikipedia is acceptable when its cited range statement is the best available source.
- [ ] Classify source geographic precision as `admin1`, `country`, `macroregion`, or `occurrence_only`, and
  record `occurrence_only` plus an uncertainty note when the source check cannot support a native claim.
- [ ] Use the geography scope registry for source claims such as Australia-wide or Western Europe, and
  preserve a distinct `source_native_scope_to_admin1` derivation after expansion.
- [ ] Fail generation when a scope identifier or country code matches no local ADM1 features.
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
range remains intentionally unknown or uncertain, including the sources checked and why they did not support
a native claim. Do not leave the decision implicit or fill the gap with a generic occurrence-derived claim.
