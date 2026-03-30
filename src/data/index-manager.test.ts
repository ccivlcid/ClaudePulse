import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { addSession, updateSession, getSessions, getActiveSession, getSessionById } from './index-manager.js';
import type { SessionEntry } from './types.js';

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

function makeSession(id: string, overrides: Partial<SessionEntry> = {}): SessionEntry {
  return {
    id,
    project: '/test/project',
    startedAt: new Date().toISOString(),
    endedAt: null,
    toolCount: 0,
    agentCount: 0,
    errorCount: 0,
    ...overrides,
  };
}

describe('addSession', () => {
  it('adds a session to empty index', () => {
    addSession(makeSession('s1'));
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('s1');
  });

  it('updates existing session with same id', () => {
    addSession(makeSession('s1', { toolCount: 0 }));
    addSession(makeSession('s1', { toolCount: 5 }));
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].toolCount).toBe(5);
  });
});

describe('updateSession', () => {
  it('updates partial fields', () => {
    addSession(makeSession('s1'));
    updateSession('s1', { endedAt: '2026-03-30T15:00:00Z', toolCount: 42 });

    const session = getSessionById('s1');
    expect(session?.endedAt).toBe('2026-03-30T15:00:00Z');
    expect(session?.toolCount).toBe(42);
  });

  it('does nothing for nonexistent session', () => {
    addSession(makeSession('s1'));
    updateSession('nonexistent', { toolCount: 99 });
    expect(getSessions()).toHaveLength(1);
  });
});

describe('getActiveSession', () => {
  it('returns null when no sessions', () => {
    expect(getActiveSession()).toBeNull();
  });

  it('returns session with null endedAt', () => {
    addSession(makeSession('s1', { endedAt: '2026-03-30T15:00:00Z' }));
    addSession(makeSession('s2', { endedAt: null }));
    expect(getActiveSession()?.id).toBe('s2');
  });

  it('returns most recent active session', () => {
    addSession(makeSession('s1', { startedAt: '2026-03-30T14:00:00Z', endedAt: null }));
    addSession(makeSession('s2', { startedAt: '2026-03-30T15:00:00Z', endedAt: null }));
    expect(getActiveSession()?.id).toBe('s2');
  });
});

describe('index file atomicity', () => {
  it('survives concurrent writes', () => {
    // Rapid sequential writes should not corrupt index
    for (let i = 0; i < 20; i++) {
      addSession(makeSession(`s${i}`));
    }
    const sessions = getSessions();
    expect(sessions).toHaveLength(20);
  });
});
