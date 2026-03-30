import { spawn, type ChildProcess } from 'node:child_process';
import { appendServerLog, getServerLogPath } from '../data/writer.js';
import { parseLogChunk } from './log-parser.js';

interface ManagedServer {
  process: ChildProcess;
  command: string;
  port: number | null;
  sessionId: string;
  startedAt: string;
  ready: boolean;
}

let currentServer: ManagedServer | null = null;

export function getServerStatus(): ManagedServer | null {
  return currentServer;
}

export function startServer(sessionId: string, command: string, port?: number): { pid: number; message: string } {
  if (currentServer) {
    stopServer();
  }

  const child = spawn(command, [], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  currentServer = {
    process: child,
    command,
    port: port ?? null,
    sessionId,
    startedAt: new Date().toISOString(),
    ready: false,
  };

  const server = currentServer;

  child.stdout?.on('data', (data: Buffer) => {
    const entries = parseLogChunk(data.toString(), 'stdout');
    for (const entry of entries) {
      appendServerLog(sessionId, entry);
      if (entry.serverReady) {
        server.ready = true;
        if (entry.port) server.port = entry.port;
      }
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    const entries = parseLogChunk(data.toString(), 'stderr');
    for (const entry of entries) {
      appendServerLog(sessionId, entry);
    }
  });

  child.on('exit', (code) => {
    appendServerLog(sessionId, {
      ts: new Date().toISOString(),
      level: code === 0 ? 'info' : 'error',
      source: 'stdout',
      text: `Server exited with code ${code}`,
    });
    if (currentServer?.process === child) {
      currentServer = null;
    }
  });

  return {
    pid: child.pid ?? 0,
    message: `서버 시작됨. PID: ${child.pid}, command: ${command}`,
  };
}

export function stopServer(): { message: string } {
  if (!currentServer) {
    return { message: '모니터링 중인 서버 없음.' };
  }

  const pid = currentServer.process.pid;
  currentServer.process.kill();
  currentServer = null;

  return { message: `서버 종료됨. PID: ${pid}` };
}

// Cleanup on MCP server exit
process.on('exit', () => {
  if (currentServer) {
    try { currentServer.process.kill(); } catch { /* already dead */ }
  }
});

process.on('SIGTERM', () => {
  if (currentServer) {
    try { currentServer.process.kill(); } catch { /* already dead */ }
  }
  process.exit(0);
});
