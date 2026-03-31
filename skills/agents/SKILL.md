---
name: agents
description: Show active agent status from Claude Pulse
user-invocable: true
---

<Use_When>
- User says "agents", "에이전트", "agent status", "에이전트 상태"
- User wants to check active subagent activity
</Use_When>

<Instructions>
1. Call `pulse_agent_status` MCP tool to get active agent information
2. Display agent names, activity counts, and current status
</Instructions>
