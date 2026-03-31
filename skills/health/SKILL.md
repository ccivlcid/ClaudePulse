---
name: health
description: Show dev server health diagnosis from Claude Pulse
user-invocable: true
---

<Use_When>
- User says "health", "서버 상태", "server health", "서버 건강", "서버 진단"
- User wants a comprehensive dev server status check
</Use_When>

<Instructions>
1. Call `pulse_server_health` MCP tool to get comprehensive server diagnosis
2. Display server status, error patterns, port info, and readiness state
3. If no server is being monitored, suggest using `/claude-pulse:server` to start one
</Instructions>
