---
name: "Stop Venom Atlas"
description: "Stop the local Venom Atlas static web dev server using the repo stop script"
argument-hint: "Optional notes, for example: force cleanup"
agent: "agent"
---
Stop the local Venom Atlas development server from the workspace root.

Steps:
1. Run: pnpm stop
2. Confirm whether web listeners were stopped.
3. Report completion and any cleanup warnings.
