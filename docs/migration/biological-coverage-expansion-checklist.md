# Biological Coverage Expansion Checklist

Use this checklist to expand the catalog from five organisms to at least fifteen while preserving the static-first data flow.

## Completion gate

- [x] Add at least ten new organism dossiers.
- [x] Reach at least fifteen organisms in `getAllOrganisms()`.
- [x] Represent multiple biological kingdoms.
- [x] Preserve all existing routes in regression coverage.
- [x] Ensure every organism reaches YAML validation, static generation, search, and the user-facing catalog.
- [ ] Avoid unsupported geography, media, structure, lethality, treatment, or range claims.

## Domain contract

- [x] Add `toxin_producing` as a backward-compatible strategy.
- [x] Add `production` as an exposure route.
- [x] Update the domain types, content schema, bundle type, and atlas view-model type.
- [x] Update all strategy and route labels so bacterial production is not described as venom delivery.
- [x] Document any terminology change that remains necessary.

## Organism breadth

- [x] Bacteria: *Clostridium botulinum*.
- [x] Fungi: *Amanita phalloides*.
- [x] Plants from distinct families: *Datura stramonium* and *Ricinus communis*.
- [x] Spider: *Latrodectus hasselti*.
- [x] Scorpion: *Androctonus australis*.
- [x] Cone snail: *Conus geographus*.
- [x] Jellyfish: *Chironex fleckeri*.
- [x] Annelid: *Eunice aphroditois*.
- [x] Additional animal: *Heloderma suspectum*.
- [x] Give each dossier a stable ID, slug, taxonomy, overview, natural history, strategy, mechanism summary, habitats, ecological roles, evidence, and citation IDs.

## Scientific records

- [x] Add citation records for all fifteen organism dossiers.
- [x] Add botulinum toxic-material, toxin, and exposure-mechanism records.
- [x] Add toxic-material records for the new organisms where scientifically meaningful.
- [x] Add the evidence-backed ricin toxin record for *Ricinus communis*.
- [x] Add the evidence-backed amatoxin group record for *Amanita phalloides*.
- [ ] Add toxin, mechanism, and physiology records only at evidence-supported causal scope.
- [ ] Add molecular entities and structures only with valid source metadata and committed assets.
- [ ] Keep *C. botulinum*, botulinum neurotoxin, and botulism as distinct concepts.

## Geography and media

- [x] Omit geography for new organisms where no suitable source-backed asset exists.
- [x] Omit unverified media and structures.
- [ ] Add geography only as occurrence evidence, not as complete native or introduced range boundaries.
- [ ] Validate every occurrence coordinate, license, and source URL.
- [ ] Confirm missing geography remains an honest `coverage.geography: missing` state.

## Static completeness

- [x] Verify every organism produces one atlas view model.
- [x] Make malformed organism, material, and toxin relationships fail validation instead of silently dropping organisms.
- [x] Validate duplicate IDs and slugs.
- [x] Validate toxic-material and toxin ownership links.
- [x] Assert static JSON and search output contain every organism.
- [ ] Confirm non-Animalia taxonomy does not affect inclusion.

## Catalog and UX

- [x] Add normalized facets for kingdom, major group, toxic strategy, material kind, and module availability.
- [x] Add search by scientific name, common name, slug, taxonomy, strategy, material, and toxin.
- [x] Add filtering by kingdom and toxic strategy.
- [x] Keep interactive catalog state in a hook and host component; keep routes thin.
- [x] Preserve the lightweight chooser on `/`.
- [ ] Render honest empty states for missing geography, chemistry, physiology, media, and structures.
- [ ] Preserve `/venom` only for `materialKind: venom`.

## Focused tests

- [x] Test a non-animal organism reaches atlas data.
- [x] Test an organism without geography remains in output.
- [x] Test `coverage.geography: missing`.
- [x] Test fifteen organisms and multiple kingdoms.
- [x] Test catalog search and kingdom/strategy filtering.
- [x] Test *C. botulinum* is not displayed as venomous.
- [ ] Test botulinum evidence scope.
- [x] Test all five baseline organisms and routes remain intact.
- [x] Test atlas, JSON, and search organism sets agree.

## Validation commands

- [x] `pnpm validate`
- [x] `pnpm build:data`
- [x] `pnpm --filter @venom-atlas/web typecheck`
- [x] `pnpm --filter @venom-atlas/web test`
- [ ] `pnpm --filter @venom-atlas/web test:e2e`
- [x] `pnpm --filter @venom-atlas/web build`
- [x] `pnpm lint`
- [x] `git diff --check`

## Final report

- [x] Record the final organism matrix by kingdom, major group, strategy, material, citations, geography, chemistry, mechanism, physiology, and media.
- [x] List deferred categories and unsupported visualizations.
- [x] List schema and terminology changes.
- [x] Confirm no organism was omitted from static or search output.
