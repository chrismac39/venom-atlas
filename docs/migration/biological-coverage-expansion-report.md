# Biological Coverage Expansion Report

Generated from the curated content and `buildAtlasMonopageOrganisms()` output after the fifteen-organism expansion.

## Organism Matrix

| Organism | Kingdom / major group | Strategy | Material | Geography | Chemistry | Mechanism | Physiology | Media |
|---|---|---|---|---|---|---|---|---|
| *Amanita phalloides* | Fungi / Basidiomycota | Poisonous | Poison | Missing | Available: amatoxins | Missing | Missing | Missing |
| *Androctonus australis* | Animalia / Arthropoda | Venomous | Venom | Missing | Missing | Missing | Missing | Missing |
| *Chironex fleckeri* | Animalia / Cnidaria | Venomous | Venom | Missing | Missing | Missing | Missing | Missing |
| *Clostridium botulinum* | Bacteria / Bacillota | Toxin-producing | Isolated toxin | Missing | Available: botulinum neurotoxin | Available | Missing | Missing |
| *Conus geographus* | Animalia / Mollusca | Venomous | Venom | Missing | Missing | Missing | Missing | Missing |
| *Datura stramonium* | Plantae / Tracheophyta | Poisonous | Poison | Missing | Missing | Missing | Missing | Missing |
| *Eunice aphroditois* | Animalia / Annelida | Venomous | Secretion | Missing | Missing | Missing | Missing | Missing |
| *Heloderma suspectum* | Animalia / Chordata | Venomous | Venom | Missing | Missing | Missing | Missing | Missing |
| *Latrodectus hasselti* | Animalia / Arthropoda | Venomous | Venom | Missing | Missing | Missing | Missing | Missing |
| *Ornithorhynchus anatinus* | Animalia / Chordata | Venomous | Missing | Available | Missing | Missing | Missing | Missing |
| *Oxyuranus microlepidotus* | Animalia / Chordata | Venomous | Missing | Available | Missing | Missing | Missing | Missing |
| *Phyllobates terribilis* | Animalia / Chordata | Poisonous | Poison | Available | Available: batrachotoxin | Missing | Missing | Missing |
| *Ricinus communis* | Plantae / Tracheophyta | Poisonous | Poison | Missing | Available: ricin | Missing | Missing | Missing |
| *Solenopsis invicta* | Animalia / Arthropoda | Venomous | Venom | Available | Available: solenopsin A | Available | Available | Missing |
| *Synanceia verrucosa* | Animalia / Chordata | Venomous | Missing | Available | Missing | Missing | Missing | Missing |

## Record Coverage

- All fifteen organism dossiers have stable identifiers, taxonomy, strategy, delivery summary, habitats, ecological roles, evidence, and citation IDs.
- All fifteen organisms have toxic-material records where the current evidence supports a meaningful material record; missing material states remain explicit for the baseline dossiers without curated material records.
- Individual toxin records currently cover batrachotoxin, botulinum neurotoxin, solenopsin A, ricin, and amatoxin-associated compounds.
- Botulinum production is represented separately from venom delivery, and botulism remains distinct from both the bacterium and botulinum neurotoxin.
- Geography remains occurrence evidence or an explicit missing state; no complete native or introduced range boundary is claimed for the expanded organisms.

## Deferred Work

- Additional toxin, mechanism, and physiology records require organism-specific evidence before being added.
- Molecular structures remain absent unless source metadata, licensing, and committed assets are available.
- Full catalog E2E coverage now passes for search and kingdom/strategy filtering, but two existing geography E2E expectations remain unresolved: the occurrence-map image assertion and the `native regions` checkbox assertion.
- Final full-suite E2E and any geography expectation updates should be completed before treating the expansion as release-complete.
