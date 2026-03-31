import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getIndexPath, getPulseDir, getSessionsDir, getServersDir, ensureDirectories } from './writer.js';
import type { SessionEntry, SessionIndex, RetentionConfig } from './types.js';

function readIndex(): SessionIndex {
  const indexPath = getIndexPath();
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as SessionIndex;
  } catch {
    return { sessions: [] };
  }
}

function writeIndex(index: SessionIndex): void {
  ensureDirectories();
  const indexPath = getIndexPath();
  const tmpPath = path.join(getPulseDir(), `index.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(index, null, 2) + '\n');
  fs.renameSync(tmpPath, indexPath);
}

export function addSession(session: SessionEntry): void {
  const index = readIndex();
  const existing = index.sessions.findIndex(s => s.id === session.id);
  if (existing >= 0) {
    index.sessions[existing] = session;
  } else {
    index.sessions.push(session);
  }
  writeIndex(index);
}

export function updateSession(sessionId: string, updates: Partial<SessionEntry>): void {
  const index = readIndex();
  const session = index.sessions.find(s => s.id === sessionId);
  if (session) {
    Object.assign(session, updates);
    writeIndex(index);
  }
}

export function getSessions(): SessionEntry[] {
  return readIndex().sessions;
}

export function getActiveSession(): SessionEntry | null {
  const sessions = readIndex().sessions
    .filter(s => s.endedAt === null)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return sessions[0] ?? null;
}

export function getSessionById(sessionId: string): SessionEntry | null {
  return readIndex().sessions.find(s => s.id === sessionId) ?? null;
}

export function removeSession(sessionId: string): boolean {
  const index = readIndex();
  const before = index.sessions.length;
  index.sessions = index.sessions.filter(s => s.id !== sessionId);
  if (index.sessions.length < before) {
    writeIndex(index);
    return true;
  }
  return false;
}

export function removeAllSessions(): void {
  writeIndex({ sessions: [] });
}

export function cleanupExpired(config: RetentionConfig): void {
  const index = readIndex();
  const now = Date.now();
  const eventsCutoff = now - config.eventsDays * 24 * 60 * 60 * 1000;
  const serverLogsCutoff = now - config.serverLogsDays * 24 * 60 * 60 * 1000;

  const sessionsDir = getSessionsDir();
  const serversDir = getServersDir();
  const remaining: SessionEntry[] = [];

  for (const session of index.sessions) {
    const startTime = new Date(session.startedAt).getTime();

    if (startTime < eventsCutoff) {
      // Delete expired session JSONL
      const sessionFile = path.join(sessionsDir, `${session.id}.jsonl`);
      try { fs.unlinkSync(sessionFile); } catch { /* already gone */ }
    } else {
      remaining.push(session);
    }

    // Delete expired server logs independently
    if (startTime < serverLogsCutoff) {
      const serverFile = path.join(serversDir, `${session.id}.jsonl`);
      try { fs.unlinkSync(serverFile); } catch { /* already gone */ }
    }
  }

  // Enforce max total size
  let totalSize = 0;
  const sessionFiles = remaining
    .map(s => {
      const filePath = path.join(sessionsDir, `${s.id}.jsonl`);
      try {
        const stat = fs.statSync(filePath);
        return { session: s, size: stat.size, startedAt: s.startedAt };
      } catch {
        return { session: s, size: 0, startedAt: s.startedAt };
      }
    })
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const maxBytes = config.maxTotalSizeMb * 1024 * 1024;
  const kept: SessionEntry[] = [];

  for (const entry of sessionFiles) {
    totalSize += entry.size;
    if (totalSize <= maxBytes) {
      kept.push(entry.session);
    } else {
      // Over limit — delete oldest
      const filePath = path.join(sessionsDir, `${entry.session.id}.jsonl`);
      try { fs.unlinkSync(filePath); } catch { /* already gone */ }
    }
  }

  writeIndex({ sessions: kept });
}
