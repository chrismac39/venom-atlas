---
name: "Start Venom Atlas"
description: "Start the local Venom Atlas static web dev server using the repo start script"
argument-hint: "Optional notes, for example: restart clean"
agent: "agent"
---
Start the local Venom Atlas development server from the workspace root.

Steps:
1. Run: pnpm start
2. Confirm startup reports PID and log file under `.tmp/`.
3. Report the web URL: http://localhost:5199.
4. If startup fails due to ports already in use, run pnpm stop and retry once.
