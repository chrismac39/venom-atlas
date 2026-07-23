# ADR-004: Dual molecular renderer strategy with deferred Mol* install

## Status

Accepted

## Decision

Implement a functional 3Dmol.js adapter for small molecules and scaffold a Mol* adapter boundary without installing Mol* yet.

## Rationale

The first vertical slice centers on Solenopsin A with unsourced structure assets. 3Dmol.js offers a lightweight first implementation path while Mol* support is planned for peptide/protein/complex targets.

## Consequences

- Clean adapter contracts exist now for future Mol* integration.
- No fabricated peptide/protein structures are introduced.
- Deferred installation avoids destabilizing the initial scaffold before validated macromolecular assets are available.
