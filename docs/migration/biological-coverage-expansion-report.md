# Biological Coverage Expansion Report

Generated from the curated content and `buildAtlasMonopageOrganisms()` output after the fifteen-organism expansion.

## Organism Matrix

| Organism | Kingdom / major group | Strategy | Material | Geography | Chemistry | Mechanism | Physiology | Media |
|---|---|---|---|---|---|---|---|---|
| *Amanita phalloides* | Fungi / Basidiomycota | Poisonous | Poison | Occurrence | Available: amatoxins | Missing | Missing | Missing |
| *Androctonus australis* | Animalia / Arthropoda | Venomous | Venom | Occurrence | Missing | Missing | Missing | Missing |
| *Chironex fleckeri* | Animalia / Cnidaria | Venomous | Venom | Occurrence | Missing | Missing | Missing | Missing |
| *Clostridium botulinum* | Bacteria / Bacillota | Toxin-producing | Isolated toxin | Occurrence | Available: botulinum neurotoxin | Available | Missing | Missing |
| *Conus geographus* | Animalia / Mollusca | Venomous | Venom | Occurrence | Missing | Missing | Missing | Missing |
| *Datura stramonium* | Plantae / Tracheophyta | Poisonous | Poison | Occurrence | Available: atropine | Missing | Missing | Missing |
| *Eunice aphroditois* | Animalia / Annelida | Venomous | Secretion | Occurrence | Missing | Missing | Missing | Missing |
| *Heloderma suspectum* | Animalia / Chordata | Venomous | Venom | Occurrence | Missing | Missing | Missing | Missing |
| *Latrodectus hasselti* | Animalia / Arthropoda | Venomous | Venom | Occurrence | Missing | Missing | Missing | Missing |
| *Ornithorhynchus anatinus* | Animalia / Chordata | Venomous | Missing | Available | Missing | Missing | Missing | Missing |
| *Oxyuranus microlepidotus* | Animalia / Chordata | Venomous | Missing | Available | Missing | Missing | Missing | Missing |
| *Phyllobates terribilis* | Animalia / Chordata | Poisonous | Poison | Available | Available: batrachotoxin | Missing | Missing | Missing |
| *Ricinus communis* | Plantae / Tracheophyta | Poisonous | Poison | Occurrence | Available: ricin | Missing | Missing | Missing |
| *Solenopsis invicta* | Animalia / Arthropoda | Venomous | Venom | Available | Available: solenopsin A | Available | Available | Missing |
| *Synanceia verrucosa* | Animalia / Chordata | Venomous | Missing | Available | Missing | Missing | Missing | Missing |

## Record Coverage

- All fifteen organism dossiers have stable identifiers, taxonomy, strategy, delivery summary, habitats, ecological roles, evidence, and citation IDs.
- All fifteen organisms have toxic-material records where the current evidence supports a meaningful material record; missing material states remain explicit for the baseline dossiers without curated material records.
- Individual toxin records currently cover batrachotoxin, botulinum neurotoxin, solenopsin A, ricin, amatoxin-associated compounds, and atropine.
- The catalog uses the shorter English display name `Botulinum bacterium`; the scientific name remains *Clostridium botulinum*, and botulism remains the disease concept.
- Botulinum physiology is represented as organism-exposure evidence with a `direct_toxin` pathway; it is not classified as venom physiology.
- Dossier coverage now reports explicit `Available` or `Not available` states for geography, chemistry, structures, physiology, and licensed media; unavailable visual sections remain omitted.
- Botulinum production is represented separately from venom delivery, and botulism remains distinct from both the bacterium and botulinum neurotoxin.
- Every organism now has occurrence-tier geography. Occurrence points and derived regional presence show documented records, not complete native or introduced range boundaries; higher tiers remain optional and evidence-gated.

## Deferred Work

- Additional toxin, mechanism, and physiology records require organism-specific evidence before being added.
- Molecular structures remain absent unless source metadata, licensing, and committed assets are available.
- Full catalog and geography E2E coverage passes, including occurrence rendering, local layer controls, and focus-gated zoom behavior.
- Occurrence generation now validates every point coordinate and requires a non-empty license plus an HTTP(S) source URL on each feature.
