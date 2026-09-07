# UI Thin-Page Architecture

Route entry points stay thin, interactive orchestration lives in feature hooks, and rendering is split into reusable components or focused islands.

## Objective

Route files should be easy to scan and mostly answer one question:
which orchestration hook and host component does this route bind together?

## Composition Pattern

For interactive React entry points:

1. Thin page or island entry
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

## Current Atlas Example

- `apps/web/src/pages/index.astro` renders the static organism chooser.
- `apps/web/src/pages/atlas/[slug].astro` generates one canonical monopage per organism.
- `apps/web/src/islands/AtlasMonopageIsland.tsx` composes the interactive organism view.
- `apps/web/src/features/atlas/hooks/useAtlasMonopageOrchestration.ts` owns URL state, observers, and derived view models.
- `apps/web/src/features/atlas/components/*` owns deferred and provider-specific interactive surfaces.
- `apps/web/src/features/atlas/atlas-types.ts` defines the view-model boundary shared by loading and rendering.

## Adoption Rules For New Pages

- Keep route files short and orchestration-free.
- Put state, effects, and route synchronization in hooks under the same feature.
- Keep host components focused on composition, not data APIs.
- Extract repeated visual structures into feature components before adding route logic.
- Prefer explicit prop contracts over implicit global coupling.
- Do not make the whole route interactive when an Astro-rendered section or smaller island is sufficient.
- Use `client:visible` or an equivalent visibility boundary for expensive visualization runtimes.
