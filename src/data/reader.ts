import fs from 'node:fs';
import { getSessionFilePath } from './writer.js';
import type {
  PulseEvent,
  SessionStats,
  FileHeatmapEntry,
  AgentStatusEntry,
  TimelineEntry,
} from './types.js';

export function readSessionEvents(sessionId: string): PulseEvent[] {
  const filePath = getSessionFilePath(sessionId);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n');
    const events: PulseEvent[] = [];
    for (const line of lines) {
      if (!line) continue;
      try {
        events.push(JSON.parse(line) as PulseEvent);
      } catch {
        // Skip malformed lines
      }
    }
    return events;
  } catch {
    return [];
  }
}

export function getSessionStats(sessionId: string): SessionStats {
  const events = readSessionEvents(sessionId);

  const toolCounts: Record<string, number> = {};
  let agentCount = 0;
  let errorCount = 0;
  let startedAt = '';
  let endedAt: string | null = null;

  for (const event of events) {
    if (event.type === 'session-start') {
      startedAt = event.ts;
    } else if (event.type === 'session-end') {
      endedAt = event.ts;
    } else if (event.type === 'tool-start' && event.toolName) {
      toolCounts[event.toolName] = (toolCounts[event.toolName] ?? 0) + 1;
    } else if (event.type === 'tool-error') {
      errorCount++;
    } else if (event.type === 'agent-start') {
      agentCount++;
    }
  }

  const totalTools = Object.values(toolCounts).reduce((sum, n) => sum + n, 0);
  const start = startedAt ? new Date(startedAt).getTime() : Date.now();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  return {
    sessionId,
    startedAt,
    endedAt,
    elapsedMs: end - start,
    toolCounts,
    totalTools,
    agentCount,
    errorCount,
  };
}

export function getFileHeatmap(sessionId: string): FileHeatmapEntry[] {
  const events = readSessionEvents(sessionId);
  const map = new Map<string, FileHeatmapEntry>();

  for (const event of events) {
    if (event.type !== 'tool-start' || !event.filePath || !event.toolName) continue;

    let entry = map.get(event.filePath);
    if (!entry) {
      entry = { filePath: event.filePath, readCount: 0, editCount: 0, writeCount: 0, total: 0 };
      map.set(event.filePath, entry);
    }

    if (event.toolName === 'Read' || event.toolName === 'Glob') entry.readCount++;
    else if (event.toolName === 'Edit') entry.editCount++;
    else if (event.toolName === 'Write') entry.writeCount++;

    entry.total = entry.readCount + entry.editCount + entry.writeCount;
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function getAgentStatus(sessionId: string): AgentStatusEntry[] {
  const events = readSessionEvents(sessionId);
  const agents = new Map<string, AgentStatusEntry>();

  for (const event of events) {
    if (event.type === 'agent-start' && event.agentId) {
      agents.set(event.agentId, {
        agentId: event.agentId,
        agentType: event.agentType ?? 'unknown',
        status: 'running',
        startedAt: event.ts,
        endedAt: null,
        elapsedMs: Date.now() - new Date(event.ts).getTime(),
        toolCounts: {},
      });
    } else if (event.type === 'agent-stop' && event.agentId) {
      const agent = agents.get(event.agentId);
      if (agent) {
        agent.status = 'done';
        agent.endedAt = event.ts;
        agent.elapsedMs = new Date(event.ts).getTime() - new Date(agent.startedAt).getTime();
      }
    }
  }

  // Count tool calls per agent (between agent-start and agent-stop)
  // Tools don't carry agentId, so we attribute tools to the most recently started running agent
  // This is a heuristic — not perfectly accurate for parallel agents
  const agentList = [...agents.values()];
  for (const event of events) {
    if (event.type !== 'tool-start' || !event.toolName) continue;
    const eventTime = new Date(event.ts).getTime();

    // Find the agent that was running at this time
    for (const agent of agentList) {
      const start = new Date(agent.startedAt).getTime();
      const end = agent.endedAt ? new Date(agent.endedAt).getTime() : Date.now();
      if (eventTime >= start && eventTime <= end) {
        agent.toolCounts[event.toolName] = (agent.toolCounts[event.toolName] ?? 0) + 1;
        break;
      }
    }
  }

  return agentList;
}

export function getTimeline(sessionId: string): TimelineEntry[] {
  const events = readSessionEvents(sessionId);
  const timeline: TimelineEntry[] = [];

  for (const event of events) {
    let summary = '';

    switch (event.type) {
      case 'session-start':
        summary = `세션 시작 — ${event.projectDir}`;
        break;
      case 'session-end':
        summary = '세션 종료';
        break;
      case 'tool-start':
        summary = event.filePath
          ? `${event.toolName} — ${event.filePath}`
          : `${event.toolName}`;
        break;
      case 'tool-error':
        summary = `${event.toolName} 실패${event.message ? ` — ${event.message}` : ''}`;
        break;
      case 'agent-start':
        summary = `에이전트 시작: ${event.agentType ?? 'unknown'}`;
        break;
      case 'agent-stop':
        summary = `에이전트 종료: ${event.agentType ?? 'unknown'}`;
        break;
      default:
        continue;
    }

    timeline.push({ ts: event.ts, type: event.type, summary });
  }

  return timeline;
}
