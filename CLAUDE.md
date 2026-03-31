# Claude Pulse - AI Coding Guidelines

## Project Overview
Claude Pulse는 Claude Code CLI의 모든 활동을 실시간으로 시각화하는 **Claude Code 플러그인**입니다.

## Architecture (서버리스 파일 기반)

```
Hook (collect-event.mjs) → JSONL 파일에 append (zero dependency)
MCP Server → JSONL 파일 읽기 → Claude Code CLI에서 조회
Web Dashboard → Hono API (JSONL 읽기 + SSE 스트림) → React UI
```

## Tech Stack (엄격히 준수)

| 용도 | 기술 | 버전 |
|---|---|---|
| Runtime | Node.js | >= 20 |
| Language | TypeScript | ESM only (`"type": "module"`) |
| Storage | JSONL files | `fs.appendFileSync` (외부 라이브러리 금지) |
| MCP | @modelcontextprotocol/sdk | latest |
| Dashboard API | Hono | latest |
| Realtime | SSE (Server-Sent Events) | 브라우저 네이티브 EventSource |
| Frontend | React 19 + Vite | latest |
| Styling | Tailwind CSS 4 | latest |
| Charts | Recharts | latest |
| State | Zustand | latest |

## Critical Rules

### 절대 금지
- **네이티브 C++ 모듈 사용 금지** (better-sqlite3, sharp, bcrypt 등). 이 프로젝트는 크로스 플랫폼 플러그인이므로 node-gyp 의존성을 만들면 안 됨.
- **Express 사용 금지**. Hono를 사용할 것.
- **WebSocket 라이브러리 사용 금지**. SSE (Server-Sent Events)를 사용할 것.
- **SQLite 사용 금지**. JSONL 파일 기반으로 구현할 것.
- **CommonJS 사용 금지**. 모든 코드는 ESM (`import`/`export`).

### 필수 원칙
- Hook 스크립트 (`scripts/collect-event.mjs`)는 **Node.js 내장 모듈만** 사용 (fs, path, crypto). 외부 의존성 0개.
- Hook 스크립트는 **3초 timeout** 안에 완료되어야 함. 비동기 네트워크 호출 금지.
- 데이터 경로: `~/.claude-pulse/` (크로스 플랫폼: `os.homedir()` 사용)
- 포트: Dashboard는 52101 (환경변수 `PULSE_DASHBOARD_PORT`로 오버라이드 가능)
- 에러 발생 시 조용히 실패. Claude Code 작업을 방해하면 안 됨.

## Data Paths

```
~/.claude-pulse/
├── sessions/{sessionId}.jsonl    # 이벤트 로그
├── servers/{sessionId}.jsonl     # Dev 서버 로그
├── index.json                    # 세션 인덱스
└── config.json                   # 설정
```

## JSONL Event Format

```jsonl
{"id":"uuid","ts":"ISO8601","type":"tool-start","sessionId":"uuid","toolName":"Read","toolUseId":"toolu_xxx","filePath":"src/auth.ts","projectDir":"/path"}
```

type 값: `session-start`, `session-end`, `tool-start`, `tool-end`, `tool-error`, `agent-start`, `agent-stop`

> 필드명은 `docs/data-schema.md`의 PulseEvent 스키마를 따름. Hook stdin 실측 데이터 기반.

## Plugin Structure

```
.claude-plugin/plugin.json    # name, version, skills, mcpServers 선언
.mcp.json                     # MCP 서버 경로
hooks/hooks.json              # Hook 이벤트 정의
skills/*/SKILL.md             # 슬래시 커맨드 정의
```

## File Naming Convention
- TypeScript 소스: `kebab-case.ts` (예: `log-parser.ts`, `index-manager.ts`)
- React 컴포넌트: `PascalCase.tsx` (예: `ActivityStream.tsx`)
- 설정 파일: 표준명 (예: `tsconfig.json`, `vite.config.ts`)

## Testing
- 테스트 프레임워크: Vitest
- 테스트 파일: `src/**/*.test.ts`
- 최소 커버리지: 핵심 로직 (data/writer, data/reader, error-detector)

## Build Output
- `dist/` 디렉토리에 빌드 결과물
- `scripts/collect-event.mjs`는 빌드 없이 직접 실행 가능한 ESM
- Web dashboard는 `dist/web/`에 빌드

## Commit Convention
- conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- 한국어/영어 혼용 가능하나 커밋 메시지는 영어
