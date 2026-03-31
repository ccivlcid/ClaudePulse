---
name: dashboard
description: Open the Claude Pulse real-time activity dashboard in browser
---

<Use_When>
- User says "dashboard", "대시보드", "pulse", "모니터링", "monitoring"
- User wants to see real-time activity visualization
- User wants to open the web dashboard
</Use_When>

<Do_Not_Use_When>
- User just wants CLI stats — use `/claude-pulse:stats` instead
- User just wants server logs — use `/claude-pulse:logs` instead
</Do_Not_Use_When>

<Instructions>
1. Call `pulse_open_dashboard` MCP tool to start the dashboard server and open browser
2. Inform the user that the dashboard is available at http://localhost:52101
3. The dashboard shows: KPI Row, Activity Stream, Token Usage, Top Files, Agent Tracker, Alert Center, Server Monitor
</Instructions>
