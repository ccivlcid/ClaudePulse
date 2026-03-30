import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { appendEvent, ensureDirectories, getSessionFilePath, getPulseDir } from './writer.js';
import type { PulseEvent } from './types.js';

const TEST_DIR = path.join(os.tmpdir(), `claude-pulse-test-${crypto.randomUUID()}`);
const origHome = os.homedir;

// Override homedir for tests
beforeEach(() => {
  (os as { homedir: () => string }).homedir = () => TEST_DIR;
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  (os as { homedir: () => string }).homedir = origHome;
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function makeEvent(overrides: Partial<PulseEvent> = {}): PulseEvent {
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    sessionId: 'test-session',
    projectDir: '/test/project',
    type: 'tool-start',
    toolName: 'Read',
    ...overrides,
  };
}

describe('writer', () => {
  it('ensureDirectories creates sessions and servers dirs', () => {
    ensureDirectories();
    expect(fs.existsSync(path.join(TEST_DIR, '.claude-pulse', 'sessions'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, '.claude-pulse', 'servers'))).toBe(true);
  });

  it('appendEvent writes JSONL line', () => {
    const event = makeEvent();
    appendEvent('test-session', event);

    const filePath = getSessionFilePath('test-session');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ type: 'tool-start', toolName: 'Read' });
  });

  it('appendEvent appends multiple events', () => {
    appendEvent('test-session', makeEvent({ toolName: 'Read' }));
    appendEvent('test-session', makeEvent({ toolName: 'Edit' }));
    appendEvent('test-session', makeEvent({ toolName: 'Bash' }));

    const filePath = getSessionFilePath('test-session');
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');

    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]).toolName).toBe('Read');
    expect(JSON.parse(lines[1]).toolName).toBe('Edit');
    expect(JSON.parse(lines[2]).toolName).toBe('Bash');
  });

  it('each line ends with newline', () => {
    appendEvent('test-session', makeEvent());
    const content = fs.readFileSync(getSessionFilePath('test-session'), 'utf-8');
    expect(content.endsWith('\n')).toBe(true);
  });
});
