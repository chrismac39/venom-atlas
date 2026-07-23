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

Renderer tools are display engines. They are not scientific evidence.
Scientific validity depends on source quality of structure files and metadata.

## Source policy

- Structure files must come from reputable databases/publications.
- Theoretical or generated conformations must not be presented as experimentally determined structures.
- If source confidence is incomplete, show explicit missing/provisional states.
