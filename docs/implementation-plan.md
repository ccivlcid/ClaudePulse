# Implementation Plan

## 프로젝트 디렉토리 구조

```
claude-pulse/
├── .claude-plugin/
│   ├── plugin.json              # 플러그인 메타데이터       ✅ 완료
│   └── marketplace.json         # 마켓플레이스 등록         ✅ 완료
├── .mcp.json                    # MCP 서버 선언             ✅ 완료
├── hooks/
│   └── hooks.json               # Hook 이벤트 정의          ✅ 완료
├── skills/
│   ├── dashboard/SKILL.md       # /claude-pulse:dashboard  ✅ 완료
│   ├── logs/SKILL.md            # /claude-pulse:logs       ✅ 완료
│   ├── stats/SKILL.md           # /claude-pulse:stats      ✅ 완료
│   └── server/SKILL.md          # /claude-pulse:server     ✅ 완료
├── agents/
│   └── log-analyzer.md          # 로그 분석 에이전트        ✅ 완료
├── scripts/
│   └── collect-event.mjs        # Hook → JSONL append      ⬜ 구현 필요
├── src/
│   ├── data/
│   │   ├── writer.ts            # JSONL append 쓰기        ⬜ 구현 필요
│   │   ├── reader.ts            # JSONL 읽기 + 집계        ⬜ 구현 필요
│   │   └── index-manager.ts     # index.json 갱신/조회     ⬜ 구현 필요
│   ├── mcp/
│   │   ├── server.ts            # MCP 도구 서버            ⬜ 구현 필요
│   │   └── tools.ts             # 도구 정의                ⬜ 구현 필요
│   ├── server-monitor/
│   │   ├── process-manager.ts   # Dev 서버 spawn/kill      ⬜ 구현 필요
│   │   ├── log-parser.ts        # stdout/stderr 파싱       ⬜ 구현 필요
│   │   └── error-detector.ts    # 에러 패턴 감지           ⬜ 구현 필요
│   └── web/
│       ├── server.ts            # Hono API + SSE           ⬜ 구현 필요
│       ├── index.html           # HTML 진입점              ⬜ 구현 필요
│       ├── vite.config.ts       # Vite 설정                ⬜ 구현 필요
│       └── src/
│           ├── App.tsx                                     ⬜ 구현 필요
│           ├── components/
│           │   ├── ActivityStream.tsx                      ⬜ 구현 필요
│           │   ├── ServerMonitor.tsx                       ⬜ 구현 필요
│           │   ├── CostEstimate.tsx                        ⬜ 구현 필요
│           │   ├── SessionTimeline.tsx                     ⬜ 구현 필요
│           │   ├── FileHeatmap.tsx                         ⬜ 구현 필요
│           │   ├── AgentTracker.tsx                        ⬜ 구현 필요
│           │   ├── ErrorPanel.tsx                          ⬜ 구현 필요
│           │   └── ProjectComparison.tsx                   ⬜ 구현 필요
│           ├── hooks/
│           │   └── usePulseData.ts                        ⬜ 구현 필요
│           └── stores/
│               └── pulseStore.ts                          ⬜ 구현 필요
├── package.json                                            ✅ 완료
├── tsconfig.json                                           ✅ 완료
├── CLAUDE.md                                               ✅ 완료
└── README.md                                               ✅ 완료
```

---

## 구현 순서

### Phase 1: 데이터 수집 (최우선)

데이터가 없으면 나머지 모든 기능이 무의미.

| 순서 | 파일 | 설명 | 참조 문서 |
|---|---|---|---|
| 1-1 | `src/data/writer.ts` | JSONL append 유틸리티 | [data-schema.md](data-schema.md) |
| 1-2 | `src/data/reader.ts` | JSONL 읽기 + 집계 | [data-schema.md](data-schema.md) |
| 1-3 | `src/data/index-manager.ts` | index.json CRUD | [data-schema.md](data-schema.md) |
| 1-4 | `scripts/collect-event.mjs` | Hook 이벤트 수집기 | [hooks.md](hooks.md) |
| 1-T | 테스트 | writer, reader, index-manager 단위 테스트 | - |

**검증**: Hook 발동 → JSONL 파일에 이벤트 기록 확인

### Phase 2: MCP Server

CLI 안에서 데이터 조회 가능하게.

| 순서 | 파일 | 설명 | 참조 문서 |
|---|---|---|---|
| 2-1 | `src/mcp/server.ts` | MCP 서버 진입점 | [mcp-tools.md](mcp-tools.md) |
| 2-2 | `src/mcp/tools.ts` | 10개 도구 정의 | [mcp-tools.md](mcp-tools.md) |
| 2-T | 테스트 | MCP 도구 응답 테스트 | - |

**검증**: `/claude-pulse:stats` → 통계 응답 확인

### Phase 3: Dev Server Monitor

서버 로그 캡처 + 에러 감지.

| 순서 | 파일 | 설명 | 참조 문서 |
|---|---|---|---|
| 3-1 | `src/server-monitor/error-detector.ts` | 에러 패턴 매칭 | [server-monitor.md](server-monitor.md) |
| 3-2 | `src/server-monitor/log-parser.ts` | stdout/stderr 파싱 | [server-monitor.md](server-monitor.md) |
| 3-3 | `src/server-monitor/process-manager.ts` | spawn/kill 관리 | [server-monitor.md](server-monitor.md) |
| 3-T | 테스트 | error-detector, log-parser 단위 테스트 | - |

**검증**: `pulse_start_server` → 서버 로그 캡처 확인

### Phase 4: Web Dashboard

시각화 UI.

| 순서 | 파일 | 설명 | 참조 문서 |
|---|---|---|---|
| 4-1 | `src/web/vite.config.ts` | Vite 설정 | - |
| 4-2 | `src/web/index.html` | HTML 진입점 | - |
| 4-3 | `src/web/server.ts` | Hono API + SSE | [dashboard-panels.md](dashboard-panels.md) |
| 4-4 | `src/web/src/stores/pulseStore.ts` | Zustand 상태 | - |
| 4-5 | `src/web/src/hooks/usePulseData.ts` | SSE + Zustand 연동 | - |
| 4-6 | `src/web/src/App.tsx` | 메인 레이아웃 | - |
| 4-7 | 8개 컴포넌트 | 대시보드 패널 | [dashboard-panels.md](dashboard-panels.md) |

**검증**: `http://localhost:52101` → 대시보드 렌더링 확인

---

## 성능 목표

| 지표 | 목표값 |
|---|---|
| Hook → JSONL 기록 | 100ms 이내 (Node.js 스폰 포함) |
| MCP 도구 응답 | 200ms 이내 |
| 대시보드 데이터 갱신 | SSE 실시간 스트림 |
| Dev 서버 에러 감지 → 조회 가능 | 1초 이내 |
| 플러그인 설치 → 수집 시작 | 즉시 (설정 불필요) |
| 1일 사용 데이터 크기 | 5MB 이내 |

---

## 향후 확장 (Phase 2+)

- 다중 세션 동시 모니터링
- 세션 리플레이 (녹화 → 재생)
- AI 기반 비용 최적화 추천
- 팀 대시보드
- Codex CLI 지원
- VS Code / JetBrains 확장 연동
- 클라우드 대시보드 (원격 접속)
- Slack/Discord 알림 연동
