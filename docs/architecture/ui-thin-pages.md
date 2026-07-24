# UI Thin-Page Architecture

This project adopts the same route architecture principle used in taxisbi-mvp:
keep route pages thin, move orchestration into hooks, and render through reusable host/components.

## Objective

Route files should be easy to scan and mostly answer one question:
which orchestration hook and host component does this route bind together?

## Composition Pattern

For each route-level page:

1. Thin page route file
- Owns no heavy business logic.
- Calls one orchestration hook.
- Renders one host component.

2. Orchestration hook
- Owns data fetching, effects, derived view models, and route-driven state.
- Returns a stable shape used by host/presentation components.
- Avoids direct rendering concerns.

3. Host and reusable components
- Focus on JSX composition and UI structure.
- Receive state/actions through typed props.
- Avoid network calls and multi-step orchestration logic.

## Why This Helps

- Route intent stays obvious during reviews.
- Logic is easier to unit-test in isolation.
- UI sections become reusable across monopage and dedicated routes.
- Future refactors affect hooks/components without route churn.

## Current Example In This Repo

- `apps/web/src/features/atlas/AtlasMonopage.tsx` is now a thin page.
- `apps/web/src/features/atlas/hooks/useAtlasMonopageOrchestration.ts` owns state, effects, and derived data.
- `apps/web/src/features/atlas/components/AtlasMonopageHost.tsx` owns route UI composition.

## Current Coverage

The pattern is applied to every current route page under `apps/web/src/features`:

- `apps/web/src/features/atlas/AtlasMonopage.tsx`
- `apps/web/src/features/atlas/LandingPage.tsx`
- `apps/web/src/features/atlas/NotFoundPage.tsx`
- `apps/web/src/features/organism/OrganismsPage.tsx`
- `apps/web/src/features/organism/OrganismDetailPage.tsx`
- `apps/web/src/features/venom/VenomPage.tsx`
- `apps/web/src/features/molecule/MoleculePage.tsx`
- `apps/web/src/features/mechanism/MechanismPage.tsx`
- `apps/web/src/features/physiology/PhysiologyPage.tsx`
- `apps/web/src/features/geography/GeographyPage.tsx`

## Adoption Rules For New Pages

- Keep route files short and orchestration-free.
- Put `useEffect`-heavy logic in hooks under the same feature.
- Keep host components focused on composition, not data APIs.
- Extract repeated visual structures into feature components before adding route logic.
- Prefer explicit prop contracts over implicit global coupling.
