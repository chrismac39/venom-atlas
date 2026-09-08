# Native Range Sourcing

Native geography is a source-to-map transformation, not an inference from occurrence density.

## Geographic precision

Every source claim is assessed at the precision the source actually supports:

- `admin1`: states, provinces, or equivalent units are named directly.
- `country`: a country-wide claim is made, such as Australia-wide.
- `macroregion`: a named region such as Western Europe is used.
- `occurrence_only`: records show presence but do not establish native status.

Only the first three levels may produce native administrative shading. Occurrence records remain a
separate evidence layer unless an explicit native claim covers their ADM1 region.

## Scope expansion

Geography source YAML may use `nativeAdmin1RegionIds` for directly supported units or `nativeScopes`
for broader source claims:

```yaml
distribution:
  nativeScopes:
    - type: country
      id: AUS
      evidenceIds:
        - ev-example-native-range
      confidence: high
```

Country and macroregion membership is resolved through `scripts/geography-scope-registry.ts`. The
builder expands the scope to local geoBoundaries ADM1 features and records the derivation as
`source_native_scope_to_admin1`. This makes the expansion visible without claiming that the source
named every individual ADM1.

Unknown scopes and scopes matching no local ADM1 features fail the data build.

## Evidence rules

Every native claim must point to a citation-backed geographic evidence record. Medical, toxicology,
taxonomy, or habitat sources should not be reused as native-range evidence unless they explicitly make
the geographic claim. Historical, introduced, uncertain, and occurrence-only claims must remain
separate from native shading.