# Hook 이벤트 수집 명세

## 수집 이벤트

| Hook | 이벤트 타입 | timeout | 검증 |
|---|---|---|---|
| `SessionStart` | `session-start` | 3초 | 미검증 |
| `PreToolUse` | `tool-start` | 3초 | **검증 완료** |
| `PostToolUse` | `tool-end` | 3초 | **검증 완료** |
| `PostToolUseFailure` | `tool-error` | 3초 | 미검증 |
| `SubagentStart` | `agent-start` | 3초 | **검증 완료** |
| `SubagentStop` | `agent-stop` | 3초 | **검증 완료** |
| `SessionEnd` | `session-end` | 5초 | 미검증 |

모든 Hook의 matcher는 `"*"` (모든 도구/에이전트에 반응).

> **미검증 항목**: `SessionStart`/`SessionEnd`는 세션 경계에서만 발동하여 현재 세션 내에서 확인 불가. `PostToolUseFailure`는 도구 실패 시에만 발동. 구현 시 디버그 로그로 확인 후 대응.

---

## stdin 실제 스키마 (2026-03-30 실측)

Claude Code는 Hook 스크립트의 stdin으로 JSON을 전달합니다.

### PreToolUse stdin — 검증 완료

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

### PostToolUse stdin — 검증 완료

PreToolUse 필드 전부 + **`tool_response`** 추가:

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

### SubagentStart stdin — 검증 완료

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

> `permission_mode`는 SubagentStart에는 **없음**, SubagentStop에만 있음.

### SubagentStop stdin — 검증 완료

SubagentStart 필드 + 추가 필드:

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

### stdin 필드 종합

| 필드 | PreToolUse | PostToolUse | SubagentStart | SubagentStop |
|---|---|---|---|---|
| `session_id` | O | O | O | O |
| `transcript_path` | O | O | O | O |
| `cwd` | O | O | O | O |
| `permission_mode` | O | O | - | O |
| `hook_event_name` | O | O | O | O |
| `tool_name` | O | O | - | - |
| `tool_input` | O | O | - | - |
| `tool_use_id` | O | O | - | - |
| `tool_response` | - | O | - | - |
| `agent_id` | - | - | O | O |
| `agent_type` | - | - | O | O |
| `stop_hook_active` | - | - | - | O |
| `agent_transcript_path` | - | - | - | O |
| `last_assistant_message` | - | - | - | O |

### 환경변수 (실측)

| 환경변수 | 값 | 비고 |
|---|---|---|
| `CLAUDE_PROJECT_DIR` | `C:/project/claude-pulse` | 프로젝트 경로 |
| `CLAUDE_CODE_ENTRYPOINT` | `cli` | 진입점 |
| `CLAUDE_CODE_SSE_PORT` | `20948` | 내부 SSE 포트 |

> **주의**: PRD가 가정한 `CLAUDE_SESSION_ID`, `CLAUDE_PLUGIN_ROOT`는 환경변수에 **없음**.
> 세션 ID → `stdin.session_id` 사용.

---

## collect-event.mjs 동작 방식 (실측 기반)

```
1. stdin으로 JSON 수신
2. stdin.session_id로 세션 식별
3. stdin.cwd로 프로젝트 경로
4. stdin.hook_event_name으로 이벤트 타입 결정
5. 도구 이벤트: tool_input에서 filePath 추출
6. 에이전트 이벤트: agent_id, agent_type 추출
7. PulseEvent 구성 → fs.appendFileSync로 JSONL append
8. session-start/session-end 시 index.json 갱신
```

### 매칭 ID 활용

- **tool_use_id**: PreToolUse ↔ PostToolUse 매칭 → 도구 실행 시간 계산
- **agent_id**: SubagentStart ↔ SubagentStop 매칭 → 에이전트 활동 시간 계산

---

## 필수 제약사항

- **Node.js 내장 모듈만 사용** (fs, path, crypto, os)
- 외부 라이브러리 의존성 **0개**
- **3초 timeout** 안에 완료 (SessionEnd만 5초)
- 비동기 네트워크 호출 **금지**
- 에러 발생 시 **조용히 실패** (Claude Code 작업을 방해하면 안 됨)

---

## 성능 고려사항

- `fs.appendFileSync` → 동기 append, 1ms 이내
- JSONL append는 원자적 (줄 단위) → 동시 쓰기 안전
- 매 호출마다 Node.js 프로세스 스폰 비용: ~30-80ms (Windows)
- Hook → JSONL 기록 전체: **100ms 이내** (성공 지표)

---

## 도구 분류 체계

Hook에서 수집한 도구를 대시보드에서 카테고리로 분류:

| 카테고리 | 도구명 |
|---|---|
| 파일 읽기 | `Read`, `Glob` |
| 파일 수정 | `Edit`, `Write` |
| 검색 | `Grep`, `Glob` |
| 테스트/실행 | `Bash` (test 패턴 감지) |
| 에이전트 위임 | `Agent`, `SubagentStart` |
| 사용자 대화 | `AskUserQuestion` |

---

## session-start 시 추가 작업

1. `~/.claude-pulse/sessions/` 디렉토리 없으면 생성
2. `index.json`에 새 세션 항목 추가

## session-end 시 추가 작업

1. `index.json`에 종료 시간, toolCount, agentCount, errorCount 갱신
2. 보존 기간 초과된 `.jsonl` 파일 삭제
3. 총 용량 500MB 초과 시 오래된 세션 파일부터 삭제
