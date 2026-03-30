---
name: logs
description: View dev server logs from Claude Pulse
---

<Use_When>
- User says "logs", "로그", "server logs", "서버 로그"
- User wants to check dev server output
</Use_When>

<Instructions>
1. Call `pulse_server_logs` MCP tool to retrieve recent server logs
2. Display the logs to the user with level indicators (info/warn/error)
3. If no server is being monitored, suggest using `pulse_start_server` to start one
</Instructions>
