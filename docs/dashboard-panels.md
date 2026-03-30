# Dashboard 패널 스펙

대시보드 URL: `http://localhost:52101` (환경변수 `PULSE_DASHBOARD_PORT`로 오버라이드)

실시간 갱신: SSE (`/api/sse`) → Hono 서버가 JSONL 파일을 `fs.watch()`로 감시

---

## 1. Activity Stream (에이전트 행동 스트림)

실시간으로 Claude Code의 모든 행동을 시간순으로 표시.

```
[session-1] auth-middleware 태스크 실행 중
  14:32:01  READ   src/middleware/auth.ts (142줄)
  14:32:03  READ   src/types/user.ts (38줄)
  14:32:05  SEARCH "jwt.verify" -> 3 matches
  14:32:08  EDIT   src/middleware/auth.ts (+12, -3)
  14:32:15  TEST   auth.test.ts -> 8/8 passed
  14:32:18  DONE   confidence: 92%
```

**데이터 소스**: `PreToolUse`, `PostToolUse` Hook → JSONL 이벤트

**기능**:
- 도구 사용 빈도 실시간 카운터
- 액션 클릭 시 상세 정보 (파일 경로, diff 미리보기)
- 필터링 (도구 종류별, 시간 범위별)

---

## 2. Dev Server Monitor (개발 서버 모니터)

`pulse_start_server`로 시작한 Dev 서버의 로그를 실시간 표시.

```
-- Dev Server: Next.js (localhost:3000) -- Running --

  14:35:01  GET  /api/users         200  12ms
  14:35:03  GET  /api/users/42      200   8ms
  14:35:05  POST /api/auth/login    500  45ms  !!
    -> TypeError: Cannot read property 'id' of undefined
       at src/api/auth.ts:42

  Errors: 1  |  Avg Response: 22ms  |  Requests: 3
```

**데이터 소스**: `servers/{sessionId}.jsonl`

---

## 3. Cost Estimate (비용 추정)

세션별 토큰 사용량과 비용을 추정.

```
-- Session Cost Estimate --

  추정 비용: ~$2.80 (도구 호출 기반 추정, 실제와 다를 수 있음)
  ================-------  67 calls

  도구별 호출 횟수:
    Read:   32 calls
    Edit:   12 calls
    Bash:    8 calls
    Grep:    8 calls
    Agent:   4 calls
    Write:   3 calls

  예상 비용 범위: $1.40 ~ $5.60
```

**추정 방식**:
- `tool_input` 텍스트 길이 기반 input 토큰 추정
- 도구별 평균 output 토큰 테이블 적용
- 모델별 단가: Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25 (per 1M tokens)

**한계**: 실제 비용의 30~60% 수준. 상대 비교(세션 간, 프로젝트 간)에 유용.

---

## 4. Session Timeline (세션 타임라인)

세션 전체를 시간축으로 한눈에 조망.

```
14:30 --*-- 세션 시작
         |  프로젝트: /project/my-app
14:31 --*-- 코드 탐색 (5 files read)
         |
14:32 --*-- 에이전트 위임: auth-refactor
         |  +-- executor: auth.ts 수정
         |  +-- test-engineer: 테스트 작성
14:34 --*-- 테스트 실행: 12/12 passed
         |
14:35 --*-- Dev 서버 에러 감지 !!
         |  TypeError at api/auth.ts:42
14:36 --*-- 핫픽스 적용 -> 재테스트 통과
         |
14:38 --*-- 세션 종료
         |  도구 67회 | 에이전트 3회 | ~$2.80
```

---

## 5. File Heatmap (파일 히트맵)

에이전트가 가장 많이 접근한 파일을 트리맵으로 시각화.

```
+---------------------------------------------------+
| src/                                              |
| +------------------+ +----------+ +----------+    |
| | auth.ts          | | user.ts  | | db.ts    |    |
| | READ:12  EDIT:5  | | READ:8   | | READ:4   |    |
| | (HOT)            | |          | |          |    |
| +------------------+ +----------+ +----------+    |
| +--------+ +--------+                             |
| | test/  | | cfg/   |                             |
| | R:6    | | R:2    |                             |
| +--------+ +--------+                             |
+---------------------------------------------------+
```

**활용**:
- 핫스팟 파일 = 리팩토링 필요 신호
- 읽기만 많은 파일 = 참조용 (인터페이스, 타입)
- 수정이 많은 파일 = 핵심 작업 대상

**데이터 소스**: `tool-start` 이벤트에서 `tool IN ('Read','Edit','Write')` + `filePath` 집계

---

## 6. Agent Tracker (에이전트 추적기)

현재 활성 에이전트와 활동량을 실시간 추적.

```
-- Active Agents --

  [RUNNING] executor (sonnet)       auth.ts 작업 중
     +-- Read: 3  Edit: 1  Bash: 0
     +-- 경과: 2분 30초

  [RUNNING] test-engineer (sonnet)  테스트 작성 중
     +-- Read: 2  Write: 1  Bash: 1
     +-- 경과: 1분 45초

  [DONE]    explorer (haiku)        탐색 완료
     +-- Read: 8  Grep: 3  경과: 45초

  완료: 1  |  활성: 2
```

**참고**: `SubagentStart`/`SubagentStop`은 시작과 끝만 알려줌. 중간 진행률(%)은 알 수 없으므로, 도구 호출 횟수와 경과 시간으로 활동량 표시.

---

## 7. Error & Alert Panel (에러 & 알림)

모든 소스의 에러를 통합 표시.

```
-- Alerts --

  [ERROR] 14:35:05  SERVER  POST /api/auth 500
    TypeError at src/api/auth.ts:42

  [WARN]  14:34:12  TEST    user.test.ts 1 failed
    Expected 200, got 401

  [WARN]  14:33:50  TOOL    Bash exit code 1
    npm install failed: ERESOLVE
```

**에러 소스**:
- `PostToolUseFailure` Hook → 도구 실행 실패
- `servers/{sessionId}.jsonl` → Dev 서버 에러
- `Bash` 도구의 exit code != 0 → 명령 실패

---

## 8. Project Comparison (프로젝트 비교)

여러 프로젝트/세션의 통계를 비교.

```
-- Project Comparison --

  Project        Est.Cost  Tools  Agents  Errors
  -----------------------------------------------
  my-app          ~$2.80    67      3       1
  api-server      ~$4.50   124      7       5
  landing-page    ~$0.90    23      1       0
```

**데이터 소스**: `index.json`에서 세션 목록 조회 + 프로젝트별 그룹화
