---
name: "Stop Venom Atlas"
description: "Stop local Venom Atlas services (API, web, ClickHouse) using the repo stop script"
argument-hint: "Optional notes, for example: force cleanup"
agent: "agent"
---
Stop the local Venom Atlas development stack from the workspace root.

Steps:
1. Run: pnpm stop
2. Confirm whether API and web listeners were stopped.
3. Confirm Docker services were brought down.
4. Report completion and any cleanup warnings.
