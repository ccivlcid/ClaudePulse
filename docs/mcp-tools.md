# MCP 도구 상세 스펙

MCP 서버 진입점: `dist/mcp/server.js`

---

## 도구 목록

| 도구 | 설명 | 사용 예시 |
|---|---|---|
| `pulse_session_stats` | 현재 세션 통계 | "이번 세션 통계 보여줘" |
| `pulse_server_logs` | Dev 서버 최근 로그 N줄 | "서버 로그 최근 20줄" |
| `pulse_server_errors` | Dev 서버 에러만 필터링 | "서버 에러 있어?" |
| `pulse_file_heatmap` | 파일 접근 빈도 순위 | "가장 많이 수정한 파일은?" |
| `pulse_agent_status` | 활성 에이전트 상태 | "지금 에이전트 상태는?" |
| `pulse_cost_estimate` | 비용 추정 (범위 표시) | "지금까지 얼마나 쓴 것 같아?" |
| `pulse_start_server` | Dev 서버 시작 + 로그 캡처 | "dev 서버 띄워줘" |
| `pulse_stop_server` | Dev 서버 종료 | "dev 서버 내려줘" |
| `pulse_timeline` | 세션 타임라인 요약 | "오늘 작업 요약해줘" |
| `pulse_open_dashboard` | 웹 대시보드 시작 + 브라우저 열기 | "대시보드 열어줘" |

---

## 각 도구 상세

### pulse_session_stats

현재 세션의 통계를 반환.

- **입력**: `{ sessionId?: string }` (생략 시 현재 세션)
- **출력**: 도구별 호출 횟수, 에러 수, 경과 시간, 에이전트 수
- **데이터 소스**: `sessions/{sessionId}.jsonl` 파싱 + 집계

### pulse_server_logs

Dev 서버의 최근 로그를 반환.

- **입력**: `{ lines?: number }` (기본값: 50)
- **출력**: 최근 N줄의 서버 로그 (level, timestamp, method, path, status)
- **데이터 소스**: `servers/{sessionId}.jsonl`
- **미모니터링 시**: "모니터링 중인 서버 없음. pulse_start_server로 시작해주세요"

### pulse_server_errors

Dev 서버 에러만 필터링하여 반환.

- **입력**: `{ since?: string }` (ISO 8601, 기본값: 세션 시작)
- **출력**: 에러 로그만 필터링 (level: "error")
- **데이터 소스**: `servers/{sessionId}.jsonl` → error-detector.ts로 필터링

### pulse_file_heatmap

파일 접근 빈도를 순위로 반환.

- **입력**: `{ sessionId?: string, top?: number }` (기본값: 상위 10개)
- **출력**: 파일별 Read/Edit/Write 횟수 순위
- **데이터 소스**: `sessions/{sessionId}.jsonl`에서 `tool-start` + `filePath` 집계

### pulse_agent_status

현재 활성 에이전트와 완료된 에이전트 상태.

- **입력**: `{ sessionId?: string }`
- **출력**: 에이전트별 상태(RUNNING/DONE), 도구 호출 횟수, 경과 시간
- **데이터 소스**: `agent-start`/`agent-stop` 이벤트 매칭

### pulse_cost_estimate

세션별 추정 비용을 범위로 반환.

- **입력**: `{ sessionId?: string }`
- **출력**: 추정 비용(범위), 도구별 호출 횟수
- **추정 방식**:
  - `tool_input` 텍스트 길이 기반 input 토큰 추정
  - 도구별 평균 output 토큰 테이블 적용
  - 모델별 단가: Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25 (per 1M tokens)
- **한계**: 실제 비용의 30~60% 수준만 추정 가능

### pulse_start_server

Dev 서버를 래핑 시작하고 로그 캡처 시작.

- **입력**: `{ command: string, port?: number }`
- **동작**:
  1. `child_process.spawn(command, { shell: true })`
  2. stdout/stderr → log-parser.ts → `servers/{sessionId}.jsonl`에 append
  3. 서버 PID를 index.json에 기록
- **출력**: "서버 시작됨. PID: 12345, Port: 3000"

### pulse_stop_server

모니터링 중인 Dev 서버를 종료.

- **입력**: `{}`
- **동작**: 저장된 PID로 프로세스 kill
- **출력**: "서버 종료됨"

### pulse_timeline

세션 타임라인을 요약 텍스트로 반환.

- **입력**: `{ sessionId?: string }`
- **출력**: 시간축 기반 주요 이벤트 요약 (코드 탐색, 수정, 테스트, 에러 등)
- **데이터 소스**: `sessions/{sessionId}.jsonl` 전체 파싱

### pulse_open_dashboard

웹 대시보드 서버를 시작하고 브라우저를 엶.

- **입력**: `{ port?: number }` (기본값: 52101)
- **동작**:
  1. Hono 서버 시작 (API + 정적 서빙 + SSE)
  2. 브라우저 자동 오픈
- **출력**: "대시보드 시작됨: http://localhost:52101"

---

## 성능 목표

- MCP 도구 응답: **200ms 이내**
