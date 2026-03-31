---
name: reset
description: Reset session data or all Claude Pulse data
user-invocable: true
---

<Use_When>
- User says "reset", "초기화", "데이터 삭제", "세션 삭제", "clear data"
- User wants to delete session data or reset all Pulse data
</Use_When>

<Instructions>
## To reset a specific session:

1. Ask the user which session to delete if not specified
2. Call `pulse_reset_session` MCP tool with the session ID
3. Confirm deletion to the user

## To reset all data:

1. **IMPORTANT**: Confirm with the user before proceeding — this deletes ALL sessions and server logs
2. Call `pulse_reset_all` MCP tool
3. Confirm that all data has been cleared
</Instructions>
