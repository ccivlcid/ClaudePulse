import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { appendEvent, getSessionFilePath } from './writer.js';
import { readSessionEvents, getSessionStats, getFileHeatmap, getAgentStatus } from './reader.js';
import type { PulseEvent } from './types.js';

const TEST_DIR = path.join(os.tmpdir(), `claude-pulse-test-${crypto.randomUUID()}`);
const origHome = os.homedir;

beforeEach(() => {
  (os as { homedir: () => string }).homedir = () => TEST_DIR;
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  (os as { homedir: () => string }).homedir = origHome;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

const SID = 'test-session';

function event(type: PulseEvent['type'], extra: Partial<PulseEvent> = {}): PulseEvent {
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    sessionId: SID,
    projectDir: '/test',
    type,
    ...extra,
  };
}

function writeEvents(events: PulseEvent[]) {
  for (const e of events) appendEvent(SID, e);
}

describe('readSessionEvents', () => {
  it('returns empty array for missing session', () => {
    expect(readSessionEvents('nonexistent')).toEqual([]);
  });

  it('parses valid JSONL', () => {
    writeEvents([event('tool-start', { toolName: 'Read' }), event('tool-end', { toolName: 'Read' })]);
    const events = readSessionEvents(SID);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('tool-start');
    expect(events[1].type).toBe('tool-end');
  });

  it('skips malformed lines', () => {
    writeEvents([event('tool-start', { toolName: 'Read' })]);
    // Inject a bad line
    const filePath = getSessionFilePath(SID);
    fs.appendFileSync(filePath, 'NOT VALID JSON\n');
    fs.appendFileSync(filePath, JSON.stringify(event('tool-end', { toolName: 'Read' })) + '\n');

    const events = readSessionEvents(SID);
    expect(events).toHaveLength(2); // bad line skipped
  });
});

describe('getSessionStats', () => {
  it('counts tools, agents, errors', () => {
    writeEvents([
      event('session-start'),
      event('tool-start', { toolName: 'Read' }),
      event('tool-start', { toolName: 'Read' }),
      event('tool-start', { toolName: 'Edit' }),
      event('tool-error', { toolName: 'Bash', message: 'fail' }),
      event('agent-start', { agentId: 'a1', agentType: 'general-purpose' }),
      event('agent-stop', { agentId: 'a1', agentType: 'general-purpose' }),
      event('session-end'),
    ]);

    const stats = getSessionStats(SID);
    expect(stats.totalTools).toBe(3);
    expect(stats.toolCounts['Read']).toBe(2);
    expect(stats.toolCounts['Edit']).toBe(1);
    expect(stats.errorCount).toBe(1);
    expect(stats.agentCount).toBe(1);
  });
});

describe('getFileHeatmap', () => {
  it('aggregates file access counts', () => {
    writeEvents([
      event('tool-start', { toolName: 'Read', filePath: 'src/a.ts' }),
      event('tool-start', { toolName: 'Read', filePath: 'src/a.ts' }),
      event('tool-start', { toolName: 'Edit', filePath: 'src/a.ts' }),
      event('tool-start', { toolName: 'Read', filePath: 'src/b.ts' }),
    ]);

    const heatmap = getFileHeatmap(SID);
    expect(heatmap[0].filePath).toBe('src/a.ts');
    expect(heatmap[0].readCount).toBe(2);
    expect(heatmap[0].editCount).toBe(1);
    expect(heatmap[0].total).toBe(3);
    expect(heatmap[1].filePath).toBe('src/b.ts');
    expect(heatmap[1].total).toBe(1);
  });
});

describe('getAgentStatus', () => {
  it('matches agent start and stop', () => {
    writeEvents([
      event('agent-start', { agentId: 'a1', agentType: 'general-purpose' }),
      event('agent-stop', { agentId: 'a1', agentType: 'general-purpose' }),
    ]);

    const agents = getAgentStatus(SID);
    expect(agents).toHaveLength(1);
    expect(agents[0].agentId).toBe('a1');
    expect(agents[0].status).toBe('done');
  });

  it('shows running agent without stop', () => {
    writeEvents([
      event('agent-start', { agentId: 'a1', agentType: 'general-purpose' }),
    ]);

    const agents = getAgentStatus(SID);
    expect(agents[0].status).toBe('running');
  });
});
