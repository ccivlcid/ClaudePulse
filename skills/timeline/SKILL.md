---
name: timeline
description: Show session timeline summary from Claude Pulse
user-invocable: true
---

<Use_When>
- User says "timeline", "타임라인", "작업 요약", "오늘 뭐 했어", "session summary"
- User wants a chronological summary of session activity
</Use_When>

<Instructions>
1. Call `pulse_timeline` MCP tool to get session timeline
2. Display events in chronological order with timestamps and descriptions
</Instructions>
