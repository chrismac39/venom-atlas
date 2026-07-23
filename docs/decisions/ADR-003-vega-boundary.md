# ADR-003: Vega/Vega-Lite through reusable wrapper boundary

## Status

Accepted

## Decision

Use a reusable React `VegaChart` wrapper around `vega-embed` with disposal and signal-listener support.

## Rationale

Centralized lifecycle handling prevents memory leaks and avoids repeated embedding behavior across pages.

## Consequences

- Charts receive typed specs and common loading/empty/error UX states.
- View finalization is covered by test.
