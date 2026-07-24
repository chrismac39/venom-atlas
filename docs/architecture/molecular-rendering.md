# Molecular Rendering

## Multiple valid views

A molecule has multiple valid representations because each view communicates different scientific meaning.

- 2D skeletal formula: connectivity, functional groups, and stereochemical conventions.
- Ball-and-stick: atom positions plus visible bonding relationships.
- Space-filling: approximate occupied volume and steric crowding.
- Ribbon/cartoon: protein fold and secondary structure abstraction.
- Molecular surface: potential interaction envelope and accessibility.

## Class differences

Small molecules are often represented by explicit atom/bond geometry.
Peptides and proteins require macromolecular conventions and sequence/structure context.
Complexes require multi-entity assembly context.

## Renderer boundaries

- `3Dmol.js`: first functional renderer for sourced small-molecule structure assets.
- `Mol*`: adapter boundary for future peptides, proteins, receptors, channels, and toxin-target complexes.

Current implementation details:

- Runtime renderer selection happens in `apps/web/src/molecular/adapters/selectRenderer.ts`.
- `apps/web/src/molecular/adapters/ThreeDmolAdapter.ts` handles:
	- small molecules from `sdf`, `mol`, `mol2` and optional `pdb`/`mmcif`
	- static complex structures from `pdb`/`mmcif`
	- representations including ball-and-stick, stick, space-filling, molecular surface, and target-complex context styles
- `apps/web/src/molecular/adapters/MolstarAdapter.ts` remains a scaffold boundary and is not currently used for active rendering in this stack.

## Surface rendering controls

Surface-capable modes are integrated in the existing `MoleculeViewer` component and are not a separate demo UI.

- Surface types: SES, SAS, VDW, Gaussian-style envelope fallback
- Surface transparency: user-adjustable opacity
- Surface coloring:
	- Element: supported in-browser
	- Uniform color: supported in-browser
	- Hydrophobicity: requires curated residue/atom property annotations prepared offline
	- Electrostatic potential: requires precomputed map assets and metadata

## Interaction visualization boundary

The interaction view is static-data driven.

- A toxin can reference an `interactionVisualization` metadata block in content YAML.
- The block points to:
	- a static complex structure asset (`pdb` or `mmcif`)
	- a static JSON interaction annotation payload under public assets
- The annotation payload is validated client-side with Zod and then passed to the existing viewer pipeline.
- Contact highlighting and camera presets are driven only by annotated data.

No interaction geometry is inferred at runtime from proximity alone.

## Electrostatic potential pipeline (offline)

Electrostatic surface coloring is intentionally separated from baseline surface rendering.

Recommended offline workflow:

1. Prepare structure with protonation/charges (for example PDB2PQR).
2. Solve electrostatics (for example APBS).
3. Export a browser-consumable potential map (`.dx` or `.cube`).
4. Store map path and format in the interaction annotation JSON.
5. Frontend loads precomputed map metadata and applies coloring if present.

This keeps expensive computation out of browser runtime and preserves static deployment.

Renderer tools are display engines. They are not scientific evidence.
Scientific validity depends on source quality of structure files and metadata.

## Source policy

- Structure files must come from reputable databases/publications.
- Theoretical or generated conformations must not be presented as experimentally determined structures.
- If source confidence is incomplete, show explicit missing/provisional states.
