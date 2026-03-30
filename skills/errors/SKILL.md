---
name: errors
description: Show all errors from current session (tool failures + server errors)
---

<Use_When>
- User says "errors", "에러", "에러 보여줘", "what errors", "에러 있어?"
- User wants to see all errors from the current session
</Use_When>

<Do_Not_Use_When>
- User wants only server errors — use `/claude-pulse:logs` instead
- User wants full stats — use `/claude-pulse:stats` instead
</Do_Not_Use_When>

<Instructions>
1. Call `pulse_server_errors` MCP tool to get dev server errors
2. Call `pulse_session_stats` MCP tool to get tool failure count
3. Display all errors grouped by source (tool failures, server errors)
4. If no errors, inform the user that the session is clean
</Instructions>
