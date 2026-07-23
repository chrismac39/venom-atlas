---
name: "Start Venom Atlas"
description: "Start local Venom Atlas services (ClickHouse, API, web) using the repo start script"
argument-hint: "Optional notes, for example: restart clean"
agent: "agent"
---
Start the local Venom Atlas development stack from the workspace root.

Steps:
1. Run: pnpm start
2. If the command stays active (watch mode), keep it running.
3. Report the service URLs for API and web.
4. If startup fails due to ports already in use, run pnpm stop and retry once.
