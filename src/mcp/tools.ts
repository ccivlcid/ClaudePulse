import fs from 'node:fs';
import { exec } from 'node:child_process';
import { getSessionStats, getFileHeatmap, getAgentStatus, getTimeline, readSessionEvents } from '../data/reader.js';
import { getActiveSession, removeSession, removeAllSessions } from '../data/index-manager.js';
import { getServerLogPath, deleteSession, deleteAllData } from '../data/writer.js';
import { startServer, stopServer, getServerStatus } from '../server-monitor/process-manager.js';
import { detectLevel, isServerReady, extractPort } from '../server-monitor/error-detector.js';
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

export function pulseServerHealth(params: { sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const managed = getServerStatus();
  const logs = readServerLogs(sid);

  // Process status
  const processStatus = managed
    ? `PID: ${managed.process.pid} | Command: ${managed.command} | Ready: ${managed.ready ? 'YES' : 'NO'}`
    : 'NOT RUNNING';

  // Port detection
  const detectedPort = managed?.port
    ?? logs.reduceRight<number | null>((found, l) => found ?? extractPort(l.text), null);

  // Analyze recent logs with error-detector
  const recent = logs.slice(-100);
  let errorCount = 0;
  let warnCount = 0;
  let infoCount = 0;
  const recentErrors: string[] = [];

  for (const log of recent) {
    const level = detectLevel(log.text);
    if (level === 'error') {
      errorCount++;
      if (recentErrors.length < 5) {
        const time = new Date(log.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        recentErrors.push(`  ${time}  ${log.text}`);
      }
    } else if (level === 'warn') {
      warnCount++;
    } else {
      infoCount++;
    }
  }

  // Server ready detection from recent logs
  const readySignal = [...recent].reverse().find(l => isServerReady(l.text));

  // Health grade
  const grade = !managed ? 'OFFLINE'
    : errorCount > 5 ? 'CRITICAL'
    : errorCount > 0 ? 'DEGRADED'
    : warnCount > 3 ? 'WARNING'
    : 'HEALTHY';

  const lines = [
    `── Server Health Diagnostics ──────`,
    `Status: ${grade}`,
    `Process: ${processStatus}`,
    `Port: ${detectedPort ?? 'unknown'}`,
    `Ready Signal: ${readySignal ? 'detected' : 'none'}`,
    ``,
    `Log Analysis (last ${recent.length} lines):`,
    `  Errors: ${errorCount} | Warnings: ${warnCount} | Info: ${infoCount}`,
  ];

  if (recentErrors.length > 0) {
    lines.push('', 'Recent Errors:', ...recentErrors);
  }

  lines.push('──────────────────────────────────');
  return text(lines.join('\n'));
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

// tool-end에 response 데이터가 없을 때 사용하는 평균 output 토큰
// dashboard.ts와 동일한 값을 사용해야 함
const AVG_OUTPUT_TOKENS: Record<string, number> = {
  Read: 500, Edit: 150, Write: 100, Bash: 400, Grep: 300, Glob: 150, Agent: 800, Search: 400,
};

function estimateTokens(text: string): number {
  // ~4 chars/token (mixed code + natural language)
  return Math.ceil(text.length / 4);
}

export function pulseTokenUsage(params: { sessionId?: string }): ToolResult {
  const sid = resolveSessionId(params.sessionId);
  if (!sid) return error('활성 세션이 없습니다.');

  const events = readSessionEvents(sid);
  const toolMap = new Map<string, { input: number; output: number; calls: number }>();

  for (const event of events) {
    if (event.type !== 'tool-start' && event.type !== 'tool-end') continue;
    const tool = event.toolName ?? 'Unknown';

    if (!toolMap.has(tool)) toolMap.set(tool, { input: 0, output: 0, calls: 0 });
    const entry = toolMap.get(tool)!;

    if (event.type === 'tool-start') {
      entry.calls += 1;
      if (event.toolInput) entry.input += estimateTokens(JSON.stringify(event.toolInput));
    }

    if (event.type === 'tool-end') {
      const resp = event.toolResponse;
      if (resp?.stdout) entry.output += estimateTokens(resp.stdout);
      else if (resp?.stderr) entry.output += estimateTokens(resp.stderr);
      else entry.output += AVG_OUTPUT_TOKENS[tool] ?? 200;
    }
  }

  let totalInput = 0;
  let totalOutput = 0;
  const lines: string[] = [];

  for (const [tool, data] of [...toolMap.entries()].sort((a, b) => (b[1].input + b[1].output) - (a[1].input + a[1].output))) {
    totalInput += data.input;
    totalOutput += data.output;
    const total = data.input + data.output;
    lines.push(`  ${tool}: ${total.toLocaleString()} tkn (in:${data.input.toLocaleString()} out:${data.output.toLocaleString()}) x${data.calls}`);
  }

  const totalTokens = totalInput + totalOutput;

  return text(`── Token Usage (추정) ─────────────
Input: ${totalInput.toLocaleString()} tokens
Output: ${totalOutput.toLocaleString()} tokens
Total: ${totalTokens.toLocaleString()} tokens

${lines.length > 0 ? lines.join('\n') : '  (도구 사용 없음)'}

※ 추정치: tool_input 길이 기반 (~4 chars/token)
───────────────────────────────────`);
}

export function pulseResetSession(params: { sessionId: string }): ToolResult {
  const found = removeSession(params.sessionId);
  if (!found) return error(`세션 "${params.sessionId}"을 찾을 수 없습니다.`);
  deleteSession(params.sessionId);
  return text(`세션 "${params.sessionId}" 데이터가 삭제되었습니다.`);
}

export function pulseResetAll(): ToolResult {
  deleteAllData();
  removeAllSessions();
  return text('모든 Claude Pulse 데이터가 초기화되었습니다.');
}

let dashboardRunning = false;

export function pulseOpenDashboard(params: { port?: number; project?: string }): ToolResult {
  const port = params.port ?? parseInt(process.env.PULSE_DASHBOARD_PORT ?? '52101', 10);
  const projectParam = params.project ? `?project=${encodeURIComponent(params.project)}` : '';
  const url = `http://localhost:${port}${projectParam}`;

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
