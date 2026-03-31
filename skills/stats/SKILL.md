---
name: stats
description: Show current session statistics from Claude Pulse
user-invocable: true
---

<Use_When>
- User says "stats", "통계", "statistics", "세션 통계", "session stats"
- User wants a quick summary of current session activity
</Use_When>

<Instructions>
1. Call `pulse_session_stats` MCP tool to get current session statistics
2. Display tool call counts, agent activity, error count, and elapsed time
</Instructions>
