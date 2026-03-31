import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { PulseEvent } from './types.js';

export function getPulseDir(): string {
  return path.join(os.homedir(), '.claude-pulse');
}

export function getSessionsDir(): string {
  return path.join(getPulseDir(), 'sessions');
}

export function getServersDir(): string {
  return path.join(getPulseDir(), 'servers');
}

export function getSessionFilePath(sessionId: string): string {
  return path.join(getSessionsDir(), `${sessionId}.jsonl`);
}

export function getServerLogPath(sessionId: string): string {
  return path.join(getServersDir(), `${sessionId}.jsonl`);
}

export function getIndexPath(): string {
  return path.join(getPulseDir(), 'index.json');
}

export function getConfigPath(): string {
  return path.join(getPulseDir(), 'config.json');
}

export function ensureDirectories(): void {
  fs.mkdirSync(getSessionsDir(), { recursive: true });
  fs.mkdirSync(getServersDir(), { recursive: true });
}

export function appendEvent(sessionId: string, event: PulseEvent): void {
  ensureDirectories();
  const filePath = getSessionFilePath(sessionId);
  fs.appendFileSync(filePath, JSON.stringify(event) + '\n');
}

export function appendServerLog(sessionId: string, log: Record<string, unknown> | object): void {
  ensureDirectories();
  const filePath = getServerLogPath(sessionId);
  fs.appendFileSync(filePath, JSON.stringify(log) + '\n');
}

export function deleteSession(sessionId: string): void {
  const sessionFile = getSessionFilePath(sessionId);
  const serverFile = getServerLogPath(sessionId);
  try { fs.unlinkSync(sessionFile); } catch { /* already gone */ }
  try { fs.unlinkSync(serverFile); } catch { /* already gone */ }
}

export function deleteAllData(): void {
  const sessionsDir = getSessionsDir();
  const serversDir = getServersDir();
  const indexPath = getIndexPath();

  try {
    for (const file of fs.readdirSync(sessionsDir)) {
      fs.unlinkSync(path.join(sessionsDir, file));
    }
  } catch { /* dir may not exist */ }

  try {
    for (const file of fs.readdirSync(serversDir)) {
      fs.unlinkSync(path.join(serversDir, file));
    }
  } catch { /* dir may not exist */ }

  try { fs.writeFileSync(indexPath, JSON.stringify({ sessions: [] }, null, 2) + '\n'); } catch { /* ignore */ }
}
