import fs from 'node:fs';
import { exec } from 'node:child_process';
import { getSessionStats, getFileHeatmap, getAgentStatus, getTimeline, readSessionEvents } from '../data/reader.js';
import { getActiveSession } from '../data/index-manager.js';
import { getServerLogPath } from '../data/writer.js';
import { startServer, stopServer, getServerStatus } from '../server-monitor/process-manager.js';
import { detectLevel } from '../server-monitor/error-detector.js';
import { startDashboard } from '../web/server.js';

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

function text(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }] };
}

function error(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }], isError: true };
}

function resolveSessionId(sessionId?: string): string | null {
  if (sessionId) return sessionId;
  const active = getActiveSession();
  return active?.id ?? null;
}

export function pulseSessionStats(params: { sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const stats = getSessionStats(sid);
  const elapsed = Math.round(stats.elapsedMs / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const toolLines = Object.entries(stats.toolCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => `  ${name}: ${count}`)
    .join('\n');

  return text(`── Session Stats ──────────────────
경과: ${mins}분 ${secs}초 | 도구: ${stats.totalTools}회 | 에러: ${stats.errorCount}건 | 에이전트: ${stats.agentCount}개

${toolLines || '  (도구 사용 없음)'}
───────────────────────────────────`);
}

export function pulseFileHeatmap(params: { sessionId?: string; top?: number }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const heatmap = getFileHeatmap(sid).slice(0, params.top ?? 10);
  if (heatmap.length === 0) return text('파일 접근 기록이 없습니다.');

  const lines = heatmap.map(
    (f, i) => `${i + 1}. ${f.filePath}  (Read:${f.readCount} Edit:${f.editCount} Write:${f.writeCount} = ${f.total})`
  );

  return text(`── File Heatmap ──\n${lines.join('\n')}`);
}

export function pulseAgentStatus(params: { sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const agents = getAgentStatus(sid);
  if (agents.length === 0) return text('에이전트 활동이 없습니다.');

  const lines = agents.map(a => {
    const status = a.status === 'running' ? '[RUNNING]' : '[DONE]   ';
    const elapsed = Math.round(a.elapsedMs / 1000);
    const tools = Object.entries(a.toolCounts).map(([k, v]) => `${k}:${v}`).join(' ');
    return `${status} ${a.agentType}  ${elapsed}초  ${tools}`;
  });

  const running = agents.filter(a => a.status === 'running').length;
  const done = agents.filter(a => a.status === 'done').length;

  return text(`── Agent Tracker ──\n${lines.join('\n')}\n\n활성: ${running} | 완료: ${done}`);
}

export function pulseCostEstimate(params: { sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const events = readSessionEvents(sid);
  let totalInputChars = 0;
  let toolCalls = 0;

  for (const event of events) {
    if (event.type === 'tool-start') {
      toolCalls++;
      if (event.toolInput) {
        totalInputChars += JSON.stringify(event.toolInput).length;
      }
    }
  }

  const estimatedInputTokens = Math.round(totalInputChars / 4);
  const estimatedOutputTokens = toolCalls * 500;
  const sonnetInputCost = (estimatedInputTokens / 1_000_000) * 3;
  const sonnetOutputCost = (estimatedOutputTokens / 1_000_000) * 15;
  const estimated = sonnetInputCost + sonnetOutputCost;
  const low = estimated * 0.5;
  const high = estimated * 2.0;

  return text(`── Cost Estimate ──
추정 비용: ~$${estimated.toFixed(2)} (도구 호출 기반, 실제와 다를 수 있음)
예상 범위: $${low.toFixed(2)} ~ $${high.toFixed(2)}
도구 호출: ${toolCalls}회

⚠️ Hook에서는 시스템 프롬프트/대화 히스토리 토큰을 볼 수 없어 실제의 30~60% 수준만 추정 가능합니다.`);
}

export function pulseTimeline(params: { sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const timeline = getTimeline(sid);
  if (timeline.length === 0) return text('이벤트가 없습니다.');

  const lines = timeline.map(t => {
    const time = new Date(t.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${time}  ${t.summary}`;
  });

  return text(`── Timeline ──\n${lines.join('\n')}`);
}

function readServerLogs(sessionId: string): { ts: string; level: string; text: string }[] {
  const logPath = getServerLogPath(sessionId);
  try {
    const raw = fs.readFileSync(logPath, 'utf-8');
    const lines = raw.trim().split('\n');
    const entries: { ts: string; level: string; text: string }[] = [];
    for (const line of lines) {
      if (!line) continue;
      try { entries.push(JSON.parse(line)); } catch { /* skip */ }
    }
    return entries;
  } catch {
    return [];
  }
}

export function pulseServerLogs(params: { lines?: number; sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const status = getServerStatus();
  if (!status) return text('모니터링 중인 서버 없음. pulse_start_server로 시작해주세요.');

  const logs = readServerLogs(sid);
  const recent = logs.slice(-(params.lines ?? 50));
  if (recent.length === 0) return text('서버 로그가 비어있습니다.');

  const lines = recent.map(l => {
    const time = new Date(l.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const prefix = l.level === 'error' ? '[ERR]' : l.level === 'warn' ? '[WRN]' : '     ';
    return `${time} ${prefix} ${l.text}`;
  });

  return text(`── Server Logs (최근 ${recent.length}줄) ──\n${lines.join('\n')}`);
}

export function pulseServerErrors(params: { since?: string; sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const status = getServerStatus();
  if (!status) return text('모니터링 중인 서버 없음. pulse_start_server로 시작해주세요.');

  const logs = readServerLogs(sid);
  const sinceCutoff = params.since ? new Date(params.since).getTime() : 0;
  const errors = logs.filter(l => l.level === 'error' && new Date(l.ts).getTime() >= sinceCutoff);

  if (errors.length === 0) return text('서버 에러 없음 ✓');

  const lines = errors.map(l => {
    const time = new Date(l.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `[ERROR] ${time}  ${l.text}`;
  });

  return text(`── Server Errors (${errors.length}건) ──\n${lines.join('\n')}`);
}

export function pulseStartServer(params: { command: string; port?: number }): ToolResult {
  const sid = resolveSessionId();
  if (!sid) return error('활성 세션이 없습니다.');

  const result = startServer(sid, params.command, params.port);
  return text(result.message);
}

export function pulseStopServer(): ToolResult {
  const result = stopServer();
  return text(result.message);
}

let dashboardRunning = false;

export function pulseOpenDashboard(params: { port?: number }): ToolResult {
  const port = params.port ?? parseInt(process.env.PULSE_DASHBOARD_PORT ?? '52101', 10);
  const url = `http://localhost:${port}`;

  if (!dashboardRunning) {
    try {
      startDashboard(port);
      dashboardRunning = true;
    } catch (err) {
      return error(`Dashboard 시작 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Open browser (cross-platform)
  const platform = process.platform;
  const cmd = platform === 'win32' ? `start "" "${url}"`
    : platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, () => { /* ignore errors - browser open is best-effort */ });

  return text(`Claude Pulse Dashboard: ${url}`);
}
