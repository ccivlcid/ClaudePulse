# Claude Pulse

> Claude Code CLI의 모든 활동을 실시간으로 시각화하는 대시보드 플러그인

---

## 한눈에 보기

Claude Code가 파일을 읽고, 수정하고, 테스트하는 **모든 과정**을 자동으로 기록하고,
CLI 또는 웹 대시보드에서 실시간으로 확인할 수 있습니다.

```
Claude Code CLI
  │
  ├── Hook이 모든 도구 사용을 자동 기록  →  ~/.claude-pulse/sessions/*.jsonl
  │
  ├── CLI에서 바로 조회     "/claude-pulse:stats"
  │
  └── 웹 대시보드에서 시각화  "/claude-pulse:dashboard"  →  http://localhost:52101
```

---

## 설치

```bash
# 1. 마켓플레이스 등록 (최초 1회)
claude plugin marketplace add ccivlcid/ClaudePulse

# 2. 플러그인 설치
claude plugin install claude-pulse@claude-pulse

# 2. 플러그인 할성화
claude plugin enable claude-pulse
```

설치 즉시 데이터 수집이 시작됩니다. 별도 설정이 필요 없습니다.

### 요구사항

- Node.js >= 20
- Claude Code CLI

### 플러그인 관리

```bash
# 삭제
claude plugin uninstall claude-pulse

# 삭제 (데이터 보존 — ~/.claude-pulse/ 유지)
claude plugin uninstall claude-pulse --keep-data

# 업데이트
claude plugin update claude-pulse

# 일시 비활성화 / 재활성화
claude plugin disable claude-pulse
claude plugin enable claude-pulse
```

스코프를 지정하면 적용 범위를 제어할 수 있습니다:


| 스코프     | 플래그                 | 적용 범위                                        |
| ------- | ------------------- | -------------------------------------------- |
| user    | `--scope user` (기본) | 모든 프로젝트에 적용                                  |
| project | `--scope project`   | 해당 프로젝트만 (`.claude/settings.json`)           |
| local   | `--scope local`     | 로컬만 (`.claude/settings.local.json`, Git 미추적) |


---

## 사용법

### 슬래시 커맨드


| 커맨드                       | 설명           |
| ------------------------- | ------------ |
| `/claude-pulse:stats`     | 현재 세션 통계 요약  |
| `/claude-pulse:dashboard` | 웹 대시보드 열기    |
| `/claude-pulse:logs`      | Dev 서버 로그 확인 |
| `/claude-pulse:server`    | Dev 서버 시작/중지 |


### 1. 세션 통계 보기

```
> /claude-pulse:stats

── Session Stats ──────────────────
경과: 6분 | 도구: 67회 | 에러: 1건

  Read: 32  Edit: 12  Bash: 8
  Grep: 8   Agent: 4  Write: 3
───────────────────────────────────
```

자연어로도 가능합니다:

- "이번 세션 통계 보여줘"
- "지금까지 얼마나 쓴 것 같아?"
- "가장 많이 수정한 파일은?"

### 2. 웹 대시보드

```
> /claude-pulse:dashboard
```

브라우저에서 `http://localhost:52101`이 자동으로 열립니다.

**대시보드 패널 구성:**


| 패널                  | 설명                       |
| ------------------- | ------------------------ |
| **Activity Stream** | 모든 도구 사용을 시간순으로 실시간 표시   |
| **Alert Center**    | 도구 에러 + 서버 에러를 통합 표시     |
| **Agent Tracker**   | 활성 에이전트와 활동량 추적          |
| **Top Files**       | 가장 많이 접근한 파일 순위 시각화      |
| **Token Usage**     | 세션별 추정 토큰 사용량 (도구 호출 기반) |
| **Server Monitor**  | Dev 서버 로그 실시간 표시         |


각 패널 헤더의 **↗** 버튼을 클릭하면 새 창에서 해당 패널을 전체 화면으로 볼 수 있습니다.

대시보드는 SSE(Server-Sent Events)로 실시간 갱신됩니다. 새로고침 없이 Claude Code 작업이 바로 반영됩니다.

### 3. Dev 서버 모니터링

Claude Pulse를 통해 Dev 서버를 시작하면 로그가 자동 캡처됩니다.

```
> dev 서버 띄워줘

Claude Code → pulse_start_server({ command: "npm run dev" })
→ "Next.js 서버 시작됨 (localhost:3000)"
```

이후 서버 에러 확인:

```
> 서버 에러 있어?

→ "1건 발견 - TypeError at src/api/auth.ts:42 (14:35:05)"
→ Claude Code가 자동으로 해당 파일 확인 → 수정 제안
```

**자동 감지하는 에러 패턴:**

- JavaScript 예외: `TypeError`, `ReferenceError`, `SyntaxError`
- HTTP 에러: 4xx/5xx 응답
- 빌드 에러: `Failed to compile`, `Module not found`
- 네트워크 에러: `EADDRINUSE`, `ECONNREFUSED`
- Stack trace

---

## 작동 원리

### 데이터 수집 (자동)

Claude Code에 내장된 Hook 시스템을 활용합니다.

```
사용자: "auth 모듈 리팩토링 해줘"

  Claude Code가 Read 도구 호출
  → PreToolUse Hook 발동
  → collect-event.mjs 실행
  → ~/.claude-pulse/sessions/{sessionId}.jsonl에 한 줄 추가

  Claude Code가 Edit 도구 호출
  → 같은 과정 반복

  도구 실패 시
  → PostToolUseFailure Hook 발동
  → 에러 정보까지 기록
```

수집되는 이벤트:


| Hook                 | 이벤트             | 설명        |
| -------------------- | --------------- | --------- |
| `SessionStart`       | `session-start` | 세션 시작     |
| `PreToolUse`         | `tool-start`    | 도구 사용 시작  |
| `PostToolUse`        | `tool-end`      | 도구 사용 완료  |
| `PostToolUseFailure` | `tool-error`    | 도구 실행 실패  |
| `SubagentStart`      | `agent-start`   | 서브에이전트 시작 |
| `SubagentStop`       | `agent-stop`    | 서브에이전트 종료 |
| `SessionEnd`         | `session-end`   | 세션 종료     |


### 데이터 저장

모든 데이터는 로컬 JSONL 파일에 저장됩니다. 외부 서버나 DB가 필요 없습니다.

```
~/.claude-pulse/
├── sessions/
│   ├── {sessionId-1}.jsonl    # 세션별 이벤트 로그
│   └── {sessionId-2}.jsonl
├── servers/
│   └── {sessionId}.jsonl      # Dev 서버 로그
├── index.json                 # 세션 목록 (빠른 조회용)
└── config.json                # 설정
```

JSONL 한 줄 예시:

```json
{"id":"a1b2","ts":"2026-03-30T14:32:01Z","type":"tool-start","sessionId":"8ebad784-...","toolName":"Read","toolUseId":"toolu_01Gt...","filePath":"src/auth.ts","projectDir":"/home/user/my-app"}
```

### 데이터 보존

- 이벤트 로그: 30일 보존 (기본값)
- 서버 로그: 7일 보존
- 최대 용량: 500MB (초과 시 오래된 세션부터 삭제)
- 정리는 세션 종료 시에만 실행 (작업 중 부하 없음)

---

## MCP 도구

Claude Code 안에서 자연어로 호출할 수 있는 도구들입니다.


| 도구                     | 설명                | 사용 예시             |
| ---------------------- | ----------------- | ----------------- |
| `pulse_session_stats`  | 현재 세션 통계          | "이번 세션 통계 보여줘"    |
| `pulse_server_logs`    | Dev 서버 최근 로그      | "서버 로그 최근 20줄"    |
| `pulse_server_errors`  | Dev 서버 에러만 필터링    | "서버 에러 있어?"       |
| `pulse_file_heatmap`   | 파일 접근 빈도 순위       | "가장 많이 수정한 파일은?"  |
| `pulse_agent_status`   | 활성 에이전트 상태        | "지금 에이전트 상태는?"    |
| `pulse_token_usage`    | 토큰 사용량 추정         | "지금까지 토큰 얼마나 썼어?" |
| `pulse_server_health`  | 서버 상태 종합 진단       | "서버 상태 어때?"       |
| `pulse_start_server`   | Dev 서버 시작 + 로그 캡처 | "dev 서버 띄워줘"      |
| `pulse_stop_server`    | Dev 서버 종료         | "dev 서버 내려줘"      |
| `pulse_timeline`       | 세션 타임라인 요약        | "오늘 작업 요약해줘"      |
| `pulse_open_dashboard` | 웹 대시보드 열기         | "대시보드 열어줘"        |


---

## 설정

`~/.claude-pulse/config.json`에서 변경할 수 있습니다.

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

환경변수로 포트를 오버라이드할 수도 있습니다:

```bash
PULSE_DASHBOARD_PORT=52102
```

---

## 토큰 사용량 추정에 대하여

토큰 추정은 도구 호출의 input 텍스트 길이(~4 chars/token)와 도구별 평균 output 토큰 테이블을 기반으로 합니다.

Hook에서는 시스템 프롬프트, 대화 히스토리 등의 토큰을 볼 수 없기 때문에, **도구 관련 토큰만 추정 가능**합니다. 추정치는 세션 간/프로젝트 간 **상대 비교**에 유용하며, 절대 수치는 참고용입니다.

---

## 기술 스택


| 구성 요소         | 기술                                           |
| ------------- | -------------------------------------------- |
| 이벤트 수집        | JSONL (`fs.appendFileSync`, zero dependency) |
| MCP Server    | `@modelcontextprotocol/sdk`                  |
| Dashboard API | Hono                                         |
| 실시간 갱신        | SSE (Server-Sent Events)                     |
| Frontend      | React 19 + Vite                              |
| 스타일링          | Tailwind CSS 4                               |
| 차트            | Recharts                                     |
| 상태 관리         | Zustand                                      |


네이티브 C++ 모듈 의존성이 없어 Windows/macOS/Linux 어디서든 동작합니다.

---

## 제약 사항

- Claude Code 밖에서 직접 터미널로 시작한 Dev 서버는 로그 캡처 불가 (`pulse_start_server`로 시작해야 함)
- 토큰 추정은 도구 호출 기반 근사치 (시스템 프롬프트, 대화 히스토리 제외)
- Hook은 도구의 시작/끝만 알려주며, 중간 진행률은 알 수 없음

---

## 라이선스

MIT