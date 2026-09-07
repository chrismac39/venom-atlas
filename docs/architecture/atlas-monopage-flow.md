# Atlas Monopage Flow

## Route Model

- `/` is the organism chooser and performs no organism-specific hydration.
- `/atlas/[slug]` is the canonical, statically generated organism story.
- `/atlas` redirects to the chooser.
- A section is addressed by hash, such as `#section-geography`.
- A subordinate toxin selection may be represented by `?toxin=<slug>`.

## Rendering Boundaries

Astro owns route generation, metadata, and the initial chooser. The atlas receives one serialized `AtlasOrganismData` object rather than the complete organism catalog.

The atlas renders sourced text immediately. Expensive visualizations use `DeferredContent`, dynamic imports, and local error boundaries. External maps require explicit user action before an iframe is created or a third-party request is made.

## Capability Model

Sections appear only when the selected organism has the relevant data. Geography visualizations are provider-neutral records with a kind, provider, label, and URL. A provider implementation decides how and when to render that capability.

## Navigation

The organism slug is route-owned. The local section rail links within the continuous story, while “Change organism” returns to the chooser. Scroll tracking updates the hash with `replaceState`, so passive reading does not flood browser history.