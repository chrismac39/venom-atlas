# UI Terminology Guide

This glossary explains common frontend and UX terms used in this repository.

## Why this exists

This project has a scroll-driven monopage with pinned UI, framework variants, and section-level overrides. The terms below help describe changes precisely.

## Core layout terms

| Term | Plain-language meaning | In this repo |
|---|---|---|
| Monopage | A single long page where sections are reached by scrolling instead of separate page loads. | The main atlas experience rendered by AtlasMonopage. |
| Section | A content block with its own heading and body. | Organism Profile, Geography, Mechanisms, Chemistry, etc. |
| Anchor navigation | Links that jump to specific sections in the same page. | Top ribbon links to section IDs. |
| Dedicated route | A standalone URL/page for a section. | Each monopage section can still open a dedicated page. |
| Pinned summary strip | A small always-visible summary card near the top while scrolling. | Species/overview/toxin category strip. |

## Positioning and scrolling terms

| Term | Plain-language meaning | In this repo |
|---|---|---|
| Fixed | Element stays in the same viewport position while page scrolls. | Top nav and pinned summary strip on desktop. |
| Sticky | Element behaves normally until a threshold, then sticks in place. | Used in many UIs; compared often against fixed behavior. |
| Scroll bleed-through | Background content showing through translucent foreground UI. | Seen in the gap behind the pinned summary before scrim tuning. |
| Scroll margin | Extra offset when jumping to anchors so headers do not cover content. | Section-level `scroll-margin-top` behavior. |

## Visual styling terms

| Term | Plain-language meaning | In this repo |
|---|---|---|
| Pill | Rounded compact UI block, often for summary info. | Top pinned strip and summary pill styles. |
| Scrim | A translucent layer behind floating UI to reduce visual noise underneath. | Backdrop band behind pinned summary zone. |
| Backdrop filter | Blur/saturation applied to what is behind an element. | Used to make the scrim suppress background details. |
| Glass / glassmorphism | Soft translucent surface with subtle highlights and depth. | `ui-surface-glass` pattern. |
| Card / cell | A distinct bounded mini-surface for grouped content. | Taxonomy matrix entries are styled as cells. |
| Outer frame | Border/background around a whole component, separate from cells inside it. | Removed from taxonomy container per design preference. |
| Asymmetric gradient | Gradient/glow where one side or corner is intentionally stronger. | Taxonomy cells and pinned strip use subtle asymmetric lighting. |
| Hover lift | Tiny upward movement/shadow change on mouse hover. | Applied to interactive/attention UI blocks. |

## Taxonomy display terms

| Term | Plain-language meaning | In this repo |
|---|---|---|
| Taxonomy matrix | A compact grid where each rank has a label and value. | Regnum/Phylum/... cards in Species snapshot. |
| Rank label | The taxonomy level name. | Regnum, Phylum, Classis, Ordo, Familia, Genus, Species. |
| Binomial name | Two-word species name format. | Species rule displays both words with capitalization. |

## Framework architecture terms

| Term | Plain-language meaning | In this repo |
|---|---|---|
| Framework variant | Configuration profile for a class of organisms. | Insect vs fish wording/layout differences. |
| Organism override | Per-species configuration layered on top of class defaults. | `solenopsis-invicta` custom labels and embeds. |
| Section-level variant | Per-section copy/behavior values passed as props. | Geography titles, venom chart labels, mechanism labels, etc. |
| One-off | Hardcoded behavior in one component for one species only. | Being replaced with framework config where possible. |

## Data and routing terms

| Term | Plain-language meaning | In this repo |
|---|---|---|
| Slug | URL-safe identifier used in routes. | `solenopsis-invicta`, `solenopsin-a`. |
| Mapping | Converting slug to internal ID and back. | `atlasRouting` helper functions. |
| Fallback | Default value used when data is missing/unknown. | Unknown route handling and default labels. |

## Practical phrase cheatsheet

Use these phrases when requesting changes:

- "Use fixed positioning for the summary strip."
- "Add a scrim behind the pinned pill to prevent bleed-through."
- "Keep distinct cells but remove the outer frame."
- "Make the gradient more subtle and keep hover lift gentle."
- "Route this through framework variants, not one-off logic."
- "Add a per-organism override on top of class defaults."
- "Keep dedicated routes but preserve monopage scroll navigation."

## Quick mental model

Think of the UI in three layers:

1. Structure layer: sections, routes, anchors, fixed/sticky behavior.
2. Framework layer: class variants and organism overrides.
3. Surface layer: cards/cells, gradients, scrims, shadows, hover states.

When something looks wrong, naming the layer first usually leads to faster fixes.
