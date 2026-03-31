import type { PulseEvent, SessionEntry } from '../stores/pulseStore.js';

export interface ServerLog {
  ts: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  text: string;
  port?: number;
  serverReady?: boolean;
}

export interface AlertItem {
  id: string;
  severity: 'ERROR' | 'WARN';
  source: 'TOOL' | 'SERVER';
  title: string;
  message: string;
  ts: string;
  filePath?: string;
}

export interface FileStat {
  path: string;
  read: number;
  edit: number;
  write: number;
  total: number;
}

export interface AgentSummary {
  agentId: string;
  agentType: string;
  status: 'running' | 'done';
  startedAt: string;
  endedAt?: string;
  currentTask: string;
  toolCounts: Record<string, number>;
}

export interface TimelineMilestone {
  id: string;
  ts: string;
  tone: 'neutral' | 'accent' | 'warn' | 'error';
  title: string;
  summary: string;
}

export interface ProjectRow {
  project: string;
  sessions: number;
  tools: number;
  agents: number;
  errors: number;
}

export interface ServerSummary {
  status: 'OFFLINE' | 'LIVE' | 'WARN' | 'ERROR';
  requestCount: number;
  avgResponseTime: number | null;
  port: number | null;
  latestIssue: ServerLog | null;
}

export interface ActivityItem {
  id: string;
  ts: string;
  owner: string;
  kind: 'tools' | 'errors' | 'agents' | 'session';
  tone: 'neutral' | 'accent' | 'warn' | 'error';
  title: string;
  detail: string;
}

export interface ActivityGroup {
  id: string;
  owner: string;
  items: ActivityItem[];
}

export const TOOL_ACCENTS: Record<string, string> = {
  Read: 'var(--blue)',
  Edit: 'var(--accent)',
  Write: 'var(--orange)',
  Bash: 'var(--green)',
  Grep: 'var(--violet)',
  Glob: 'var(--violet)',
  Agent: 'var(--cyan)',
};

const HTTP_METHOD_RE = /\b(GET|POST|PUT|DELETE|PATCH)\b/;
const RESPONSE_MS_RE = /\b(\d+)ms\b/;

export function formatClock(ts?: string | null): string {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatClockShort(ts?: string | null): string {
  if (!ts) return '--:--';
  const d = new Date(ts);
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${m}:${s}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function shortPath(path?: string | null): string {
  if (!path) return 'Unknown target';
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || normalized;
}

export function extractCommand(toolInput?: Record<string, unknown>): string {
  const command = toolInput?.command;
  if (typeof command === 'string' && command.trim()) return command;
  const query = toolInput?.query;
  if (typeof query === 'string' && query.trim()) return query;
  if (!toolInput) return 'No input';
  return JSON.stringify(toolInput).slice(0, 120);
}

export interface TokenSummary {
  inputChars: number;
  estimatedTokens: number;
  toolCallCount: number;
}

export function buildTokenStats(events: PulseEvent[]): TokenSummary {
  let chars = 0;
  let toolCalls = 0;

  for (const event of events) {
    if (event.type === 'tool-start') {
      toolCalls++;
      if (event.toolInput) {
        chars += JSON.stringify(event.toolInput).length;
      }
    }
  }

  return {
    inputChars: chars,
    estimatedTokens: Math.round(chars / 4),
    toolCallCount: toolCalls,
  };
}

export function buildAlertItems(events: PulseEvent[], logs: ServerLog[]): AlertItem[] {
  const toolAlerts = events
    .filter((event) => event.type === 'tool-error')
    .map<AlertItem>((event) => ({
      id: event.id,
      severity: 'ERROR',
      source: 'TOOL',
      title: `${event.toolName ?? 'Tool'} failed`,
      message: event.message ?? event.toolResponse?.stderr ?? 'Tool execution failed',
      ts: event.ts,
      filePath: event.filePath,
    }));

  const serverAlerts = logs
    .filter((log) => log.level === 'warn' || log.level === 'error')
    .map<AlertItem>((log, index) => ({
      id: `server-${log.ts}-${index}`,
      severity: log.level === 'error' ? 'ERROR' : 'WARN',
      source: 'SERVER',
      title: log.level === 'error' ? 'Server error detected' : 'Server warning detected',
      message: log.text,
      ts: log.ts,
    }));

  return [...toolAlerts, ...serverAlerts]
    .sort((left, right) => {
      if (left.severity !== right.severity) return left.severity === 'ERROR' ? -1 : 1;
      return new Date(right.ts).getTime() - new Date(left.ts).getTime();
    })
    .slice(0, 8);
}

export function buildFileStats(events: PulseEvent[]): FileStat[] {
  const map = new Map<string, FileStat>();

  for (const event of events) {
    if (event.type !== 'tool-start' || !event.filePath || !event.toolName) continue;
    const existing = map.get(event.filePath) ?? {
      path: event.filePath,
      read: 0,
      edit: 0,
      write: 0,
      total: 0,
    };

    if (event.toolName === 'Read' || event.toolName === 'Glob') existing.read += 1;
    if (event.toolName === 'Edit') existing.edit += 1;
    if (event.toolName === 'Write') existing.write += 1;
    existing.total = existing.read + existing.edit + existing.write;
    map.set(event.filePath, existing);
  }

  return [...map.values()].sort((left, right) => right.total - left.total);
}

export function buildAgentSummaries(events: PulseEvent[]): AgentSummary[] {
  const agents = new Map<string, AgentSummary>();

  for (const event of events) {
    if (event.type === 'agent-start' && event.agentId) {
      agents.set(event.agentId, {
        agentId: event.agentId,
        agentType: event.agentType ?? 'agent',
        status: 'running',
        startedAt: event.ts,
        currentTask: event.lastAgentMessage ?? 'Subagent running',
        toolCounts: agents.get(event.agentId)?.toolCounts ?? {},
      });
    }

    if (event.type === 'agent-stop' && event.agentId) {
      const agent = agents.get(event.agentId);
      if (!agent) continue;
      agent.status = 'done';
      agent.endedAt = event.ts;
      if (event.lastAgentMessage) agent.currentTask = event.lastAgentMessage;
    }

    if (event.type === 'tool-start' && event.agentId) {
      const agent = agents.get(event.agentId);
      if (!agent) continue;
      const key = event.toolName ?? 'Tool';
      agent.toolCounts[key] = (agent.toolCounts[key] ?? 0) + 1;
      if (event.filePath) agent.currentTask = `${key} ${shortPath(event.filePath)}`;
      else agent.currentTask = `${key} ${extractCommand(event.toolInput)}`;
    }
  }

  return [...agents.values()].sort((left, right) => {
    if (left.status !== right.status) return left.status === 'running' ? -1 : 1;
    return new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime();
  });
}

export function buildTimelineMilestones(events: PulseEvent[]): TimelineMilestone[] {
  const milestones: TimelineMilestone[] = [];

  for (const event of events) {
    if (event.type === 'session-start') {
      milestones.push({
        id: event.id,
        ts: event.ts,
        tone: 'accent',
        title: 'Session started',
        summary: shortPath(event.projectDir),
      });
      continue;
    }

    if (event.type === 'agent-start') {
      milestones.push({
        id: event.id,
        ts: event.ts,
        tone: 'accent',
        title: `${event.agentType ?? 'Agent'} delegated`,
        summary: event.lastAgentMessage ?? 'Subagent work started',
      });
      continue;
    }

    if (event.type === 'tool-error') {
      milestones.push({
        id: event.id,
        ts: event.ts,
        tone: 'error',
        title: `${event.toolName ?? 'Tool'} failed`,
        summary: event.message ?? shortPath(event.filePath ?? extractCommand(event.toolInput)),
      });
      continue;
    }

    if (event.type === 'tool-start' && ['Edit', 'Write', 'Bash', 'Read'].includes(event.toolName ?? '')) {
      milestones.push({
        id: event.id,
        ts: event.ts,
        tone: event.toolName === 'Edit' || event.toolName === 'Write' ? 'accent' : 'neutral',
        title: `${event.toolName} ${shortPath(event.filePath)}`,
        summary: event.filePath ? 'Tool activity recorded' : extractCommand(event.toolInput),
      });
      continue;
    }

    if (event.type === 'session-end') {
      milestones.push({
        id: event.id,
        ts: event.ts,
        tone: 'neutral',
        title: 'Session ended',
        summary: 'Final summary available in history',
      });
    }
  }

  return milestones.slice(-10).reverse();
}

export function summarizeServer(logs: ServerLog[]): ServerSummary {
  if (!logs.length) {
    return {
      status: 'OFFLINE',
      requestCount: 0,
      avgResponseTime: null,
      port: null,
      latestIssue: null,
    };
  }

  const requestDurations: number[] = [];
  let requestCount = 0;
  let port: number | null = null;

  for (const log of logs) {
    if (HTTP_METHOD_RE.test(log.text)) requestCount += 1;
    const match = log.text.match(RESPONSE_MS_RE);
    if (match) requestDurations.push(Number(match[1]));
    if (typeof log.port === 'number') port = log.port;
  }

  const latestIssue = [...logs].reverse().find((log) => log.level === 'error' || log.level === 'warn') ?? null;
  const hasError = logs.some((log) => log.level === 'error');
  const hasWarn = logs.some((log) => log.level === 'warn');

  return {
    status: hasError ? 'ERROR' : hasWarn ? 'WARN' : 'LIVE',
    requestCount,
    avgResponseTime: requestDurations.length
      ? Math.round(requestDurations.reduce((sum, value) => sum + value, 0) / requestDurations.length)
      : null,
    port,
    latestIssue,
  };
}

export function buildProjectRows(sessions: SessionEntry[]): ProjectRow[] {
  const projects = new Map<string, ProjectRow>();

  for (const session of sessions) {
    const project = session.project;
    const current = projects.get(project) ?? {
      project,
      sessions: 0,
      tools: 0,
      agents: 0,
      errors: 0,
    };

    current.sessions += 1;
    current.tools += session.toolCount;
    current.agents += session.agentCount;
    current.errors += session.errorCount;
    projects.set(project, current);
  }

  return [...projects.values()].sort((left, right) => right.tools - left.tools);
}

export interface TokenUsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolBreakdown: { tool: string; input: number; output: number; calls: number }[];
}

// Average output tokens per tool (when tool-end has no response data)
const AVG_OUTPUT_TOKENS: Record<string, number> = {
  Read: 1200,
  Edit: 300,
  Write: 200,
  Bash: 800,
  Grep: 600,
  Glob: 300,
  Agent: 2000,
  Search: 800,
};

// Per-call overhead: system prompt fragment + conversation context that Claude
// processes each time it decides to call a tool. This accounts for the tokens
// we cannot observe through hooks (system prompt, chat history, reasoning).
const OVERHEAD_PER_CALL = 800;

// Baseline tokens for session infrastructure (system prompt, CLAUDE.md, etc.)
const SESSION_BASELINE = 4000;

function estimateTokens(text: string): number {
  // Mixed content (code + natural language) averages ~3.2 chars/token
  return Math.ceil(text.length / 3.2);
}

export function buildTokenUsage(events: PulseEvent[]): TokenUsageSummary {
  const toolMap = new Map<string, { input: number; output: number; calls: number }>();
  let totalCalls = 0;

  for (const event of events) {
    if (event.type !== 'tool-start' && event.type !== 'tool-end') continue;
    const tool = event.toolName ?? 'Unknown';

    if (!toolMap.has(tool)) {
      toolMap.set(tool, { input: 0, output: 0, calls: 0 });
    }
    const entry = toolMap.get(tool)!;

    if (event.type === 'tool-start') {
      entry.calls += 1;
      totalCalls += 1;
      if (event.toolInput) {
        entry.input += estimateTokens(JSON.stringify(event.toolInput));
      }
    }

    if (event.type === 'tool-end') {
      const resp = event.toolResponse;
      if (resp?.stdout) {
        entry.output += estimateTokens(resp.stdout);
      } else if (resp?.stderr) {
        entry.output += estimateTokens(resp.stderr);
      } else {
        entry.output += AVG_OUTPUT_TOKENS[tool] ?? 400;
      }
    }
  }

  let inputTokens = 0;
  let outputTokens = 0;
  const toolBreakdown: TokenUsageSummary['toolBreakdown'] = [];

  for (const [tool, data] of toolMap) {
    inputTokens += data.input;
    outputTokens += data.output;
    if (data.calls > 0) {
      toolBreakdown.push({ tool, ...data });
    }
  }

  // Add estimated overhead only when there are actual tool calls
  if (totalCalls > 0) {
    const overhead = SESSION_BASELINE + (totalCalls * OVERHEAD_PER_CALL);
    inputTokens += overhead;
  }

  toolBreakdown.sort((a, b) => (b.input + b.output) - (a.input + a.output));

  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, toolBreakdown };
}

export function buildActivityGroups(
  events: PulseEvent[],
  filter: 'all' | 'errors' | 'tools' | 'agents' | 'session',
): ActivityGroup[] {
  const relevant = events
    .filter((event) => event.type !== 'tool-end')
    .slice(-32)
    .reverse()
    .map<ActivityItem>((event) => {
      if (event.type === 'session-start') {
        return {
          id: event.id,
          ts: event.ts,
          owner: 'Session',
          kind: 'session',
          tone: 'accent',
          title: 'Session started',
          detail: shortPath(event.projectDir),
        };
      }

      if (event.type === 'session-end') {
        return {
          id: event.id,
          ts: event.ts,
          owner: 'Session',
          kind: 'session',
          tone: 'neutral',
          title: 'Session ended',
          detail: 'Waiting for next run',
        };
      }

      if (event.type === 'agent-start') {
        return {
          id: event.id,
          ts: event.ts,
          owner: event.agentType ?? 'Agent',
          kind: 'agents',
          tone: 'accent',
          title: `${event.agentType ?? 'Agent'} started`,
          detail: event.lastAgentMessage ?? 'Subagent running',
        };
      }

      if (event.type === 'agent-stop') {
        return {
          id: event.id,
          ts: event.ts,
          owner: event.agentType ?? 'Agent',
          kind: 'agents',
          tone: 'neutral',
          title: `${event.agentType ?? 'Agent'} completed`,
          detail: event.lastAgentMessage ?? 'Subagent stopped',
        };
      }

      if (event.type === 'tool-error') {
        return {
          id: event.id,
          ts: event.ts,
          owner: event.agentType ?? 'Workspace',
          kind: 'errors',
          tone: 'error',
          title: `${event.toolName ?? 'Tool'} failed`,
          detail: event.message ?? shortPath(event.filePath ?? extractCommand(event.toolInput)),
        };
      }

      const subject = event.filePath ? shortPath(event.filePath) : extractCommand(event.toolInput);
      const tone = event.toolName === 'Edit' || event.toolName === 'Write'
        ? 'accent'
        : event.toolName === 'Bash'
          ? 'warn'
          : 'neutral';

      return {
        id: event.id,
        ts: event.ts,
        owner: event.agentType ?? 'Workspace',
        kind: 'tools',
        tone,
        title: `${event.toolName ?? 'Tool'} ${subject}`,
        detail: event.filePath ? 'Tool activity recorded' : subject,
      };
    })
    .filter((item) => filter === 'all' || item.kind === filter);

  const groups: ActivityGroup[] = [];

  for (const item of relevant) {
    const current = groups[groups.length - 1];
    if (current && current.owner === item.owner && current.items.length < 4) {
      current.items.push(item);
      continue;
    }

    groups.push({
      id: `${item.owner}-${item.id}`,
      owner: item.owner,
      items: [item],
    });
  }

  return groups;
}
