# Evidence and Provenance

Every substantive claim should be linked to citations and evidence assessment.

Each claim-level evidence assessment may also declare:

- `reviewStatus`: `unreviewed`, `reviewed`, or `needs_review`.
- `reviewedAt`: ISO date for the latest editorial or clinical review.
- `causalScope`: `organism_exposure`, `whole_material`, or `isolated_compound`.

The scope must describe what the cited evidence supports. An organism-exposure claim
must not inherit isolated-compound causality merely because a compound is featured in
the same dossier.

## Evidence categories

- Experimentally established
- Clinically observed
- Inferred/proposed
- Editorially normalized
- Unknown/unavailable

## Confidence

- high
- moderate
- low
- unknown

## Policy

- Avoid false precision.
- Keep uncertain values nullable.
- Separate direct venom effects from immune-mediated outcomes.
- Distinguish potential systemic allergic pathways from default local outcomes.
