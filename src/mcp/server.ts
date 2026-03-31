import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  pulseSessionStats,
  pulseFileHeatmap,
  pulseAgentStatus,
  pulseTokenUsage,
  pulseTimeline,
  pulseServerLogs,
  pulseServerErrors,
  pulseServerHealth,
  pulseStartServer,
  pulseStopServer,
  pulseOpenDashboard,
  pulseResetSession,
  pulseResetAll,
} from './tools.js';

const server = new McpServer({
  name: 'claude-pulse',
  version: '0.1.0',
});

// --- Data query tools ---

server.tool(
  'pulse_session_stats',
  '현재 세션 통계 (도구 횟수, 에러, 시간)',
  { sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)') },
  async (params) => pulseSessionStats(params),
);

server.tool(
  'pulse_file_heatmap',
  '파일 접근 빈도 순위',
  {
    sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)'),
    top: z.number().optional().describe('상위 N개 (기본값: 10)'),
  },
  async (params) => pulseFileHeatmap(params),
);

server.tool(
  'pulse_agent_status',
  '활성 에이전트 상태',
  { sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)') },
  async (params) => pulseAgentStatus(params),
);

server.tool(
  'pulse_token_usage',
  '세션 토큰 사용량 추정',
  { sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)') },
  async (params) => pulseTokenUsage(params),
);

server.tool(
  'pulse_timeline',
  '세션 타임라인 요약',
  { sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)') },
  async (params) => pulseTimeline(params),
);

// --- Server monitor tools ---

server.tool(
  'pulse_server_logs',
  'Dev 서버 최근 로그',
  {
    lines: z.number().optional().describe('최근 N줄 (기본값: 50)'),
    sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)'),
  },
  async (params) => pulseServerLogs(params),
);

server.tool(
  'pulse_server_errors',
  'Dev 서버 에러만 필터링',
  {
    since: z.string().optional().describe('ISO 8601 시작 시간'),
    sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)'),
  },
  async (params) => pulseServerErrors(params),
);

server.tool(
  'pulse_server_health',
  'Dev 서버 상태 종합 진단 (에러 패턴 감지, 포트 감지, 준비 상태)',
  { sessionId: z.string().optional().describe('세션 ID (생략 시 현재 세션)') },
  async (params) => pulseServerHealth(params),
);

server.tool(
  'pulse_start_server',
  'Dev 서버 시작 + 로그 자동 캡처',
  {
    command: z.string().describe('서버 시작 명령어 (예: npm run dev)'),
    port: z.number().optional().describe('서버 포트'),
  },
  async (params) => pulseStartServer(params),
);

server.tool(
  'pulse_stop_server',
  'Dev 서버 종료',
  {},
  async () => pulseStopServer(),
);

// --- Dashboard tool ---

server.tool(
  'pulse_open_dashboard',
  '웹 대시보드 시작 + 브라우저 열기',
  {
    port: z.number().optional().describe('대시보드 포트 (기본값: 52101)'),
    project: z.string().optional().describe('프로젝트 경로 (해당 프로젝트 세션만 표시)'),
  },
  async (params) => pulseOpenDashboard(params),
);

// --- Data management tools ---

server.tool(
  'pulse_reset_session',
  '특정 세션 데이터 삭제',
  { sessionId: z.string().describe('삭제할 세션 ID') },
  async (params) => pulseResetSession(params),
);

server.tool(
  'pulse_reset_all',
  '모든 Pulse 데이터 초기화 (세션, 서버 로그 전체 삭제)',
  {},
  async () => pulseResetAll(),
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => {
  process.exit(1);
});
