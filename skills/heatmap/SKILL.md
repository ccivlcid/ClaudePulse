---
name: heatmap
description: Show file access frequency ranking from Claude Pulse
user-invocable: true
---

<Use_When>
- User says "heatmap", "히트맵", "파일 순위", "top files", "가장 많이 수정한 파일"
- User wants to see which files were accessed most frequently
</Use_When>

<Instructions>
1. Call `pulse_file_heatmap` MCP tool to get file access frequency ranking
2. Display the top files with access counts
3. If the user specifies a number (e.g., `/claude-pulse:heatmap 20`), pass it as the `top` parameter
</Instructions>
