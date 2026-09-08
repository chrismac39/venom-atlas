---
name: "Expand Venom Atlas Biological Coverage"
description: "Triple the organism catalog with evidence-backed bacteria, fungi, plants, and additional animal categories while preserving the Venom Atlas data and UI contracts"
argument-hint: "Optional focus, for example: prioritize bacterial toxins or add more marine taxa"
agent: "agent"
---

Expand the Venom Atlas organism catalog from the current five organisms to at least fifteen.
Implement the work in the repository; do not only propose a species list.

## Current baseline

The current catalog is:

- *Solenopsis invicta* - insect, venomous
- *Phyllobates terribilis* - amphibian, poisonous
- *Oxyuranus microlepidotus* - reptile, venomous
- *Ornithorhynchus anatinus* - mammal, venomous
- *Synanceia verrucosa* - fish, venomous

All additions must use the existing content-source structure, schemas, validation scripts,
static-data generation, and atlas rendering paths. Inspect those contracts before editing them.

## Required biological breadth

Add at least ten new organism dossiers so the total reaches fifteen or more. The additions must
cover categories that are absent from the current catalog, including all of the following:

- Bacteria: *Clostridium botulinum* as the producer of botulinum neurotoxin.
- Fungi: at least one medically important toxic mushroom, such as *Amanita phalloides*.
- Plants: at least two toxic plants from distinct families, such as *Datura stramonium* and
  *Ricinus communis*.
- Arachnids: at least one spider and one scorpion.
- Mollusks: at least one cone snail, such as *Conus geographus*.
- Cnidarians: at least one medically important jellyfish, such as *Chironex fleckeri*.

Use the remaining additions to broaden animal representation, for example an annelid, another
insect lineage, or a venomous reptile or amphibian not already represented. Prefer organisms with
well-established taxonomy, toxicology, geography, and primary or authoritative sources.

Botulism must be represented accurately: botulism is a disease caused by botulinum neurotoxin,
while *C. botulinum* is the bacterium that produces the toxin. Do not label bacterial toxin
production as venom delivery, and do not force every organism into the existing venomous versus
poisonous distinction. Extend the domain vocabulary only when the existing schema cannot express
an accurate biological distinction, and keep the change backward compatible.

## Data requirements

For every new organism:

- Add a valid organism dossier with scientific name, stable slug/id, common name where applicable,
  taxonomy, overview, natural history, toxic strategy or mechanism, and evidence.
- Add at least one authoritative citation or source record; distinguish primary evidence from
  secondary summaries where the repository supports that distinction.
- Add toxin, toxic-material, mechanism, or physiology records when they are scientifically
  meaningful for that organism. Link records using existing IDs and relationships.
- Include clear evidence confidence and avoid unsupported claims about lethality, treatment,
  geographic extent, or human risk.
- Add geography only when the source supports it. Treat occurrence records as evidence of
  presence, not as complete native or introduced range boundaries.
- Include media only when licensing, attribution, and source metadata satisfy the existing media
  validation rules. Do not add placeholder URLs or unverified images.

For every new organism or batch of organisms, perform a best-effort monopage completeness pass:

- Review every monopage element: identity, taxonomy, overview, natural history, habitats,
  ecological roles, delivery or exposure mechanism, geography, toxic material, composition,
  molecular entities, structures, targets, physiology, media, citations, and related routes.
- Populate each element when authoritative evidence and valid repository assets support it.
- When an element cannot be supported, leave it absent and make the missing state explicit in the
  dossier coverage model or UI; never fill the gap with a generic claim, copied range, placeholder
  structure, unverified media, or an unrelated visualization.
- Add or update focused validation so the new organism is present in static output and its
  populated and intentionally missing monopage elements are exercised.

## Product and architecture requirements

- Preserve the thin route-page architecture and existing host/orchestration boundaries.
- Make organism categories visible and usable in the catalog, search, filters, dossier pages, and
  related visualizations wherever those surfaces currently assume Animalia or venomous animals.
- Ensure organisms without a map, molecular structure, or suitable visualization receive an honest
  empty state rather than fabricated data or a misleading generic visualization.
- Use the existing terminology for venom, poison, toxin, toxic material, mechanism, organism, and
  evidence. Update the terminology documentation only when a new category requires it.
- Keep static-first generation deterministic and ensure all new content is included in generated
  JSON/search artifacts.

## Validation and acceptance criteria

Before finishing:

- Run the repository content, citation, media, structure, and geography validators that apply.
- Run the web typecheck and focused tests, then the production build.
- Add focused tests for at least one non-animal organism, one organism with no geography, category
  filtering/search, and the botulinum toxin distinction if those paths are not already covered.
- Verify the catalog contains at least fifteen organisms and more than one biological kingdom.
- Verify existing five dossiers and existing route behavior remain intact.
- Verify no organism is silently omitted from static output because its taxonomy or toxic strategy
  is outside the original Animalia assumptions.
- Report the final organism matrix by kingdom, phylum or major group, toxic strategy, and available
  visualizations, along with any intentionally deferred categories or schema changes.

Do not mark the expansion complete if the new organisms only exist in a list or fixture. They must
flow through validation, static generation, and the user-facing catalog/dossier experience.
