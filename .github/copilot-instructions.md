# Copilot Instructions For Thin Route Pages

All route-level page files under `apps/web/src/features/**/*Page.tsx` must follow the thin-page architecture.

## Required Pattern

1. Page file is a thin wrapper.
- It wires one orchestration hook to one host component.
- It should not own business logic, data loading, or orchestration effects.

2. Orchestration hook owns behavior.
- Place route behavior in `hooks/use<PageName>Orchestration.ts`.
- This includes fetching, derived state, and side effects.

3. Host component owns rendering.
- Place visual composition in `components/<PageName>Host.tsx`.
- Host components receive typed props from orchestration hooks.

## Disallowed In Page Files

Do not add the following directly in `*Page.tsx` route files:
- `useEffect`, `useState`, `useMemo`, `useReducer`, `useRef`
- direct API calls
- route-driven data orchestration

## Allowed In Page Files

- imports
- page prop typing
- one hook call
- one host render return

## Reference

Architecture details and rationale live in `docs/architecture/ui-thin-pages.md`.
