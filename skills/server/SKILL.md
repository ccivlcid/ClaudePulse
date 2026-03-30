---
name: server
description: Start or stop a dev server with log monitoring via Claude Pulse
---

<Use_When>
- User says "dev server", "서버 시작", "서버 띄워", "start server", "stop server", "서버 내려"
- User wants to run a dev server with automatic log capture
</Use_When>

<Instructions>
To start:
1. Ask the user for the start command if not provided (e.g., "npm run dev")
2. Call `pulse_start_server` MCP tool with the command
3. Server stdout/stderr will be automatically captured for monitoring

To stop:
1. Call `pulse_stop_server` MCP tool
2. Confirm the server has been stopped
</Instructions>
