# Architecture

## 핵심 설계 원칙: 서버리스 파일 기반

별도 Collector Server를 띄우지 않음. Hook이 JSONL 파일에 직접 append하고, MCP Server와 Dashboard가 같은 파일을 읽는 구조.

```
Claude Code CLI
│
├── Hook: SessionStart ───┐
├── Hook: PreToolUse ─────┤
├── Hook: PostToolUse ────┼──→ collect-event.mjs ──→ ~/.claude-pulse/sessions/{id}.jsonl
├── Hook: PostToolUseFailure──┤                       (fs.appendFileSync, zero dependency)
├── Hook: SubagentStart ──┤                              │
├── Hook: SubagentStop ───┤                              │
├── Hook: SessionEnd ─────┘                              │
│                                                        │
├── MCP Server ──────── JSONL 직접 읽기 ─────────────────┘
│   (pulse_stats, pulse_errors, ...)                     │
│                                                        │
│   "/claude-pulse:dashboard" 실행 시                     │
│   ┌────────────────────────────────────────────────┐   │
│   │ Web Dashboard (:52101)                         │   │
│   │ - Hono (API + 정적 서빙)                        │◄──┘
│   │ - SSE (Server-Sent Events, 실시간 단방향 스트림)  │
│   │ - React + Tailwind + Recharts                  │
│   └────────────────────────────────────────────────┘
│
├── Dev Server (사용자 앱)
│   MCP 도구 pulse_start_server로 래핑 실행 시:
│   └── child_process.spawn → stdout/stderr 캡처 → servers/{id}.jsonl에 기록
│
└── OMC (선택적) → .omc/state/ 파일 watch → 추가 데이터
```

## 왜 서버리스인가

| 접근법 | 문제 |
|---|---|
| Collector HTTP Server | 누가 언제 시작? 안 떠있으면 이벤트 유실 |
| WebSocket 상시 연결 | 리소스 낭비, 프로세스 관리 복잡 |
| SQLite 직접 쓰기 | better-sqlite3가 C++ 네이티브 모듈 → Windows 빌드 실패 빈번 |
| **JSONL 파일 기반 (채택)** | zero dependency, append-only, 네이티브 빌드 불필요 |

## 데이터 흐름

```
[수집] Hook 발동 → collect-event.mjs → fs.appendFileSync → JSONL 파일
                                                              │
[조회] MCP 도구 호출 ─────→ reader.ts ──→ JSONL 파일 읽기 ◄───┘
                                                              │
[시각화] 브라우저 ←── SSE ←── Hono API ──→ JSONL 파일 읽기 ◄──┘
```

## 기술 스택

| 구성 요소 | 기술 | 이유 |
|---|---|---|
| 이벤트 수집 | JSONL (`fs.appendFileSync`) | zero dependency, 1ms 이내 쓰기 |
| MCP Server | `@modelcontextprotocol/sdk` | Claude Code MCP 표준 |
| Dashboard API | Hono (14KB) | Express 대비 10배 가벼움, ESM 네이티브 |
| 실시간 갱신 | SSE (Server-Sent Events) | 단방향으로 충분, 브라우저 네이티브 |
| Frontend | React 19 + Vite | 빠른 개발, 정적 서빙 가능 |
| 스타일링 | Tailwind CSS 4 | 유틸리티 기반 |
| 차트 | Recharts | React 네이티브, SVG 기반, React 19 호환 |
| 상태 관리 | Zustand | 심플, 보일러플레이트 최소 |
| 로그 파싱 | Custom parser | 서버 종류별 로그 포맷 대응 |

## 네이티브 의존성: 0개

| 고려했으나 제외 | 이유 |
|---|---|
| better-sqlite3 | C++ 빌드 필요, Windows node-gyp 실패 빈번 |
| Express | 2MB+ 의존성, CommonJS 기본 |
| WebSocket (ws) | 양방향 불필요, SSE로 충분 |

## 포트

| 서비스 | 기본 포트 | 환경변수 |
|---|---|---|
| Web Dashboard | 52101 | `PULSE_DASHBOARD_PORT` |
| Dev Server | 자동감지 | - |

## OMC 호환성

| 시나리오 | 동작 |
|---|---|
| Claude Pulse만 설치 | 정상 동작. 기본 Hook 이벤트 수집 |
| OMC + Claude Pulse 동시 설치 | 두 플러그인 Hook 동시 실행. 충돌 없음 |
| OMC `.omc/state/` 데이터 | 선택적으로 watch하여 추가 데이터 확보 |
| OMC 에이전트 활동 | SubagentStart/Stop Hook으로 자동 추적 |

## 에러 핸들링

| 상황 | 처리 |
|---|---|
| sessions/ 디렉토리 없음 | `collect-event.mjs`가 첫 실행 시 자동 생성 |
| JSONL 쓰기 실패 | 조용히 실패. Claude Code 작업에 영향 없음 |
| MCP Server가 JSONL 읽기 실패 | 빈 결과 반환 + 에러 메시지 |
| Dashboard 포트 충돌 | 다음 포트(52102, 52103...) 자동 시도 |
| Dev 서버 크래시 | process.on('exit') 감지 → 로그 기록 |
| collect-event.mjs 크래시 | Claude Code에 영향 없음 (Hook 실패는 무시됨) |
