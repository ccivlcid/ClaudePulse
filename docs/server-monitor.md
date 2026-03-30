# Dev 서버 모니터링 스펙

## 설계 원칙

Hook은 Claude Code의 명령을 가로채거나 수정할 수 없음. 따라서 Dev 서버 로그 캡처는 **MCP 도구를 통한 명시적 시작** 방식만 지원.

> **미지원 케이스**: 사용자가 Claude Code 밖에서 직접 터미널로 서버를 시작한 경우, 로그 캡처 불가. "모니터링 중인 서버 없음. pulse_start_server로 시작해주세요" 메시지 반환.

---

## pulse_start_server 동작

```typescript
// MCP 도구: pulse_start_server
// input: { command: "npm run dev", port?: 3000 }

1. child_process.spawn(command, { shell: true })
2. stdout.on('data') → 파싱 → servers/{sessionId}.jsonl에 append
3. stderr.on('data') → 파싱 → servers/{sessionId}.jsonl에 append (level: "error")
4. 서버 PID를 index.json에 기록
5. 반환: "서버 시작됨. PID: 12345, Port: 3000"
```

---

## 에러 감지 패턴

```typescript
const ERROR_PATTERNS = [
  // JavaScript/TypeScript
  /TypeError|ReferenceError|SyntaxError|RangeError/,
  /Unhandled.*rejection|uncaught.*exception/i,
  // HTTP
  /\b[45]\d{2}\b.*\b(GET|POST|PUT|DELETE|PATCH)\b/,
  /\b(GET|POST|PUT|DELETE|PATCH)\b.*\b[45]\d{2}\b/,
  // Build
  /Failed to compile|Build failed|Module not found/i,
  // Network
  /EADDRINUSE|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/,
  // Stack trace
  /^\s+at\s+/m,
];
```

---

## 서버 시작 감지 패턴

```typescript
const SERVER_READY_PATTERNS = [
  /listening on|ready on|started at|server running/i,
  /Local:\s+http/,
  /Network:\s+http/,
];
```

---

## Claude Code 연동 흐름

```
1. 사용자: "dev 서버 띄워줘"
2. Claude Code → pulse_start_server({ command: "npm run dev" })
3. MCP Server가 spawn으로 서버 시작 + 로그 캡처 시작
4. 반환: "Next.js 서버 시작됨 (localhost:3000)"

... 개발 작업 진행 중 ...

5. 사용자: "서버 에러 있어?"
6. Claude Code → pulse_server_errors()
7. 반환: "1건 발견 - TypeError at src/api/auth.ts:42 (14:35:05)"
8. Claude Code → Read src/api/auth.ts → 수정 제안
```

---

## 구현 파일

| 파일 | 역할 |
|---|---|
| `src/server-monitor/process-manager.ts` | `child_process.spawn`/`kill` 관리, PID 추적 |
| `src/server-monitor/log-parser.ts` | stdout/stderr 텍스트를 구조화된 JSON으로 파싱 |
| `src/server-monitor/error-detector.ts` | 에러 패턴 매칭, level(info/warn/error) 분류 |

---

## 성능 목표

- Dev 서버 에러 감지 → MCP 도구로 조회 가능까지: **1초 이내**
