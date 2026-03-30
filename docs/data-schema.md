# Data Schema

## 저장 경로

```
~/.claude-pulse/
├── sessions/
│   ├── {sessionId-1}.jsonl    # 세션별 이벤트 로그 (한 줄 = 하나의 이벤트)
│   └── {sessionId-2}.jsonl
├── servers/
│   └── {sessionId}.jsonl      # Dev 서버 로그 (세션별)
├── index.json                 # 세션 목록 + 요약 통계 (빠른 조회용)
└── config.json                # 사용자 설정 (포트, 보존 기간 등)
```

---

## Hook stdin 실제 스키마 (검증 완료)

Claude Code Hook은 stdin으로 JSON을 전달합니다. 2026-03-30 실측 데이터 기반.

### PreToolUse (tool-start)

```json
{
  "session_id": "8ebad784-9bc1-409f-b15f-39bf1c24e6df",
  "transcript_path": "C:\\Users\\...\\{session_id}.jsonl",
  "cwd": "C:\\project\\claude-pulse",
  "permission_mode": "acceptEdits",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "wc -l < ~/.claude-pulse/hook-debug.jsonl",
    "description": "Check hook data count"
  },
  "tool_use_id": "toolu_01GtGCswTLipVF8wDehCEJLx"
}
```

### PostToolUse (tool-end)

PreToolUse의 모든 필드 + `tool_response` 추가:

```json
{
  "session_id": "8ebad784-...",
  "hook_event_name": "PostToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "...", "description": "..." },
  "tool_response": {
    "stdout": "1",
    "stderr": "",
    "interrupted": false,
    "isImage": false,
    "noOutputExpected": false
  },
  "tool_use_id": "toolu_01GtGCswTLipVF8wDehCEJLx"
}
```

### SubagentStart (agent-start) — 검증 완료

```json
{
  "session_id": "8ebad784-9bc1-409f-b15f-39bf1c24e6df",
  "transcript_path": "C:\\Users\\...\\{session_id}.jsonl",
  "cwd": "C:\\project\\claude-pulse",
  "agent_id": "a04a4e1e93d3625ae",
  "agent_type": "general-purpose",
  "hook_event_name": "SubagentStart"
}
```

> `permission_mode`는 SubagentStart에는 없고 SubagentStop에만 있음.

### SubagentStop (agent-stop) — 검증 완료

SubagentStart 필드 전부 + 추가 필드:

```json
{
  "session_id": "8ebad784-...",
  "cwd": "C:\\project\\claude-pulse",
  "permission_mode": "acceptEdits",
  "agent_id": "a04a4e1e93d3625ae",
  "agent_type": "general-purpose",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_transcript_path": "C:\\Users\\...\\subagents\\agent-{agent_id}.jsonl",
  "last_assistant_message": "에이전트 최종 응답 텍스트"
}
```

### SessionStart / SessionEnd — 미검증

세션 시작/종료 시에만 발동. 현재 세션에서는 실측 불가. 구현 시 디버그 모드로 확인 필요.

### 환경변수 (실측)

| 환경변수 | 값 | 비고 |
|---|---|---|
| `CLAUDE_PROJECT_DIR` | `C:/project/claude-pulse` | 프로젝트 경로 |
| `CLAUDE_CODE_ENTRYPOINT` | `cli` | 진입점 |
| `CLAUDE_CODE_SSE_PORT` | `20948` | 내부 SSE 포트 |

> **주의**: `CLAUDE_SESSION_ID`는 환경변수에 없음. stdin의 `session_id` 필드를 사용해야 함.

---

## PulseEvent (우리가 저장하는 이벤트 스키마)

stdin 데이터를 가공하여 저장하는 형태:

```typescript
interface PulseEvent {
  id: string;                    // crypto.randomUUID()
  ts: string;                   // ISO 8601
  sessionId: string;            // stdin.session_id
  projectDir: string;           // stdin.cwd
  type: "session-start" | "session-end"
      | "tool-start" | "tool-end" | "tool-error"
      | "agent-start" | "agent-stop";

  // 도구 관련
  toolName?: string;            // stdin.tool_name
  toolUseId?: string;           // stdin.tool_use_id (start↔end 매칭용)
  toolInput?: object;           // stdin.tool_input
  filePath?: string;            // tool_input에서 추출 (file_path 등)

  // 도구 결과 (tool-end에만)
  toolResponse?: {
    stdout?: string;
    stderr?: string;
    interrupted?: boolean;
  };

  // 에러 (tool-error에만)
  message?: string;

  // 에이전트 관련 (agent-start/stop에만)
  agentId?: string;             // stdin.agent_id (start↔stop 매칭용)
  agentType?: string;           // stdin.agent_type ("general-purpose" 등)
  agentTranscriptPath?: string; // stdin.agent_transcript_path (stop에만)
  lastAgentMessage?: string;    // stdin.last_assistant_message (stop에만)
}
```

### JSONL 저장 예시

```jsonl
{"id":"a1b2","ts":"2026-03-30T14:32:01Z","sessionId":"8ebad784-...","type":"tool-start","toolName":"Read","toolUseId":"toolu_01Gt...","filePath":"src/auth.ts","projectDir":"/home/user/my-app"}
{"id":"a1b3","ts":"2026-03-30T14:32:01Z","sessionId":"8ebad784-...","type":"tool-end","toolName":"Read","toolUseId":"toolu_01Gt..."}
{"id":"a1b4","ts":"2026-03-30T14:32:08Z","sessionId":"8ebad784-...","type":"agent-start","agentId":"a04a4e1e93d3625ae","agentType":"general-purpose"}
{"id":"a1b5","ts":"2026-03-30T14:35:12Z","sessionId":"8ebad784-...","type":"agent-stop","agentId":"a04a4e1e93d3625ae","agentType":"general-purpose","lastAgentMessage":"작업 완료"}
{"id":"a1b6","ts":"2026-03-30T14:32:08Z","sessionId":"8ebad784-...","type":"tool-error","toolName":"Bash","toolUseId":"toolu_01Yy...","message":"test failed","toolResponse":{"stderr":"FAIL src/auth.test.ts"}}
```

---

## filePath 추출 규칙

도구별로 `tool_input`에서 파일 경로를 추출하는 방법:

| 도구 | tool_input 키 | 예시 |
|---|---|---|
| Read | `file_path` | `"file_path": "src/auth.ts"` |
| Edit | `file_path` | `"file_path": "src/auth.ts"` |
| Write | `file_path` | `"file_path": "src/new.ts"` |
| Glob | `pattern` | `"pattern": "src/**/*.ts"` |
| Grep | `pattern` | `"pattern": "jwt.verify"` |
| Bash | `command` | `"command": "vitest run"` (파일 경로 아님) |

---

## 서버 로그 JSONL 포맷

```jsonl
{"ts":"2026-03-30T14:35:01Z","level":"info","method":"GET","path":"/api/users","status":200,"duration":12}
{"ts":"2026-03-30T14:35:05Z","level":"error","method":"POST","path":"/api/auth","status":500,"message":"TypeError: Cannot read property 'id' of undefined","stack":"at src/api/auth.ts:42"}
```

---

## index.json (세션 인덱스)

빠른 세션 목록 조회 + 프로젝트 비교용.

```json
{
  "sessions": [
    {
      "id": "8ebad784-9bc1-409f-b15f-39bf1c24e6df",
      "project": "/home/user/my-app",
      "startedAt": "2026-03-30T14:30:00Z",
      "endedAt": "2026-03-30T14:38:00Z",
      "toolCount": 67,
      "agentCount": 3,
      "errorCount": 1
    }
  ]
}
```

> `project`는 사용자의 작업 디렉토리 (stdin.cwd)에서 가져오므로 환경마다 다름.

---

## config.json (사용자 설정)

```json
{
  "retention": {
    "eventsDays": 30,
    "serverLogsDays": 7,
    "maxTotalSizeMb": 500
  },
  "ports": {
    "dashboard": 52101
  }
}
```

---

## 데이터 보존 정책

아래는 `config.json`의 **기본값**이며, 사용자가 자유롭게 수정 가능.

- 이벤트 로그: **30일** 보존 (`retention.eventsDays`)
- 서버 로그: **7일** 보존 (`retention.serverLogsDays`)
- 최대 용량: **500MB** (`retention.maxTotalSizeMb`, 초과 시 오래된 세션부터 삭제)
- 정리 시점: `SessionEnd` Hook에서만 실행 (작업 중 부하 없음)
- 정리 방법: JSONL 파일 삭제 + `index.json`에서 항목 제거
