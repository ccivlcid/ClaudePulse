import { detectLevel, isServerReady, extractPort, type LogLevel } from './error-detector.js';

export interface ServerLogEntry {
  ts: string;
  level: LogLevel;
  source: 'stdout' | 'stderr';
  text: string;
  port?: number;
  serverReady?: boolean;
}

export function parseLogLine(text: string, source: 'stdout' | 'stderr'): ServerLogEntry {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ts: new Date().toISOString(), level: 'info', source, text: '' };
  }

  const detected = detectLevel(trimmed);
  const level: LogLevel = detected !== 'info' ? detected : (source === 'stderr' ? 'warn' : 'info');
  const entry: ServerLogEntry = {
    ts: new Date().toISOString(),
    level,
    source,
    text: trimmed,
  };

  if (isServerReady(trimmed)) {
    entry.serverReady = true;
    const port = extractPort(trimmed);
    if (port) entry.port = port;
  }

  return entry;
}

export function parseLogChunk(chunk: string, source: 'stdout' | 'stderr'): ServerLogEntry[] {
  return chunk
    .split('\n')
    .filter(line => line.trim())
    .map(line => parseLogLine(line, source));
}
