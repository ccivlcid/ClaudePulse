#!/usr/bin/env node

// Claude Pulse - Hook Event Collector
// 자체 완결형 ESM 스크립트. Node.js 내장 모듈만 사용. 빌드 불필요.
// 에러 발생 시 조용히 실패 — Claude Code 작업을 방해하면 안 됨.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const PULSE_DIR = path.join(os.homedir(), '.claude-pulse');
const SESSIONS_DIR = path.join(PULSE_DIR, 'sessions');
const INDEX_PATH = path.join(PULSE_DIR, 'index.json');

try {
  const eventType = process.argv[2]; // tool-start, tool-end, tool-error, agent-start, agent-stop, session-start, session-end
  if (!eventType) process.exit(0);

  // Read stdin JSON
  let stdinRaw = '';
  try {
    stdinRaw = fs.readFileSync(0, 'utf-8');
  } catch {
    process.exit(0);
  }

  let stdin;
  try {
    stdin = JSON.parse(stdinRaw);
  } catch {
    process.exit(0);
  }

  const sessionId = stdin.session_id;
  if (!sessionId) process.exit(0);

  // Ensure directories
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
  const projectDir = stdin.cwd || process.env.CLAUDE_PROJECT_DIR || '';

  // Build PulseEvent
  const event = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    sessionId,
    projectDir,
    type: eventType,
  };

  // Tool fields
  if (eventType === 'tool-start' || eventType === 'tool-end' || eventType === 'tool-error') {
    event.toolName = stdin.tool_name;
    event.toolUseId = stdin.tool_use_id;

    // Extract filePath from tool_input
    if (stdin.tool_input) {
      event.toolInput = stdin.tool_input;
      const filePath = stdin.tool_input.file_path || stdin.tool_input.path;
      if (filePath) {
        event.filePath = filePath;
      }
    }

    // tool_response (tool-end)
    if (eventType === 'tool-end' && stdin.tool_response) {
      event.toolResponse = {
        stdout: stdin.tool_response.stdout,
        stderr: stdin.tool_response.stderr,
        interrupted: stdin.tool_response.interrupted,
      };
    }

    // Error message (tool-error)
    if (eventType === 'tool-error') {
      if (stdin.tool_response?.stderr) {
        event.message = stdin.tool_response.stderr.slice(0, 500);
      } else if (stdin.error) {
        event.message = String(stdin.error).slice(0, 500);
      }
    }
  }

  // Agent fields
  if (eventType === 'agent-start' || eventType === 'agent-stop') {
    event.agentId = stdin.agent_id;
    event.agentType = stdin.agent_type;

    if (eventType === 'agent-stop') {
      event.agentTranscriptPath = stdin.agent_transcript_path;
      if (stdin.last_assistant_message) {
        event.lastAgentMessage = stdin.last_assistant_message.slice(0, 1000);
      }
    }
  }

  // Append event to JSONL
  fs.appendFileSync(sessionFile, JSON.stringify(event) + '\n');

  // index.json management for session lifecycle
  if (eventType === 'session-start') {
    updateIndex(index => {
      const existing = index.sessions.findIndex(s => s.id === sessionId);
      const entry = {
        id: sessionId,
        project: projectDir,
        startedAt: event.ts,
        endedAt: null,
        toolCount: 0,
        agentCount: 0,
        errorCount: 0,
      };
      if (existing >= 0) {
        index.sessions[existing] = entry;
      } else {
        index.sessions.push(entry);
      }
    });
  }

  if (eventType === 'session-end') {
    // Count events from JSONL
    let toolCount = 0;
    let agentCount = 0;
    let errorCount = 0;

    try {
      const lines = fs.readFileSync(sessionFile, 'utf-8').trim().split('\n');
      for (const line of lines) {
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.type === 'tool-start') toolCount++;
          if (evt.type === 'agent-start') agentCount++;
          if (evt.type === 'tool-error') errorCount++;
        } catch { /* skip */ }
      }
    } catch { /* no file */ }

    updateIndex(index => {
      const session = index.sessions.find(s => s.id === sessionId);
      if (session) {
        session.endedAt = event.ts;
        session.toolCount = toolCount;
        session.agentCount = agentCount;
        session.errorCount = errorCount;
      }
    });

    // Cleanup expired sessions
    cleanupExpired();
  }
} catch {
  // 조용히 실패
}

// --- Helper functions ---

function readIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  } catch {
    return { sessions: [] };
  }
}

function writeIndex(index) {
  const tmpPath = path.join(PULSE_DIR, `index.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(index, null, 2) + '\n');
  fs.renameSync(tmpPath, INDEX_PATH);
}

function updateIndex(fn) {
  const index = readIndex();
  fn(index);
  writeIndex(index);
}

function cleanupExpired() {
  try {
    // Read config
    let config = { retention: { eventsDays: 30, serverLogsDays: 7, maxTotalSizeMb: 500 } };
    try {
      const configPath = path.join(PULSE_DIR, 'config.json');
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch { /* use defaults */ }

    const now = Date.now();
    const eventsCutoff = now - config.retention.eventsDays * 24 * 60 * 60 * 1000;
    const serversDir = path.join(PULSE_DIR, 'servers');

    const index = readIndex();
    const remaining = [];

    for (const session of index.sessions) {
      const startTime = new Date(session.startedAt).getTime();
      if (startTime < eventsCutoff) {
        try { fs.unlinkSync(path.join(SESSIONS_DIR, `${session.id}.jsonl`)); } catch { /* gone */ }
        try { fs.unlinkSync(path.join(serversDir, `${session.id}.jsonl`)); } catch { /* gone */ }
      } else {
        remaining.push(session);
      }
    }

    // Enforce max size
    const maxBytes = config.retention.maxTotalSizeMb * 1024 * 1024;
    const withSize = remaining
      .map(s => {
        try {
          return { session: s, size: fs.statSync(path.join(SESSIONS_DIR, `${s.id}.jsonl`)).size };
        } catch {
          return { session: s, size: 0 };
        }
      })
      .sort((a, b) => new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime());

    let total = 0;
    const kept = [];
    for (const entry of withSize) {
      total += entry.size;
      if (total <= maxBytes) {
        kept.push(entry.session);
      } else {
        try { fs.unlinkSync(path.join(SESSIONS_DIR, `${entry.session.id}.jsonl`)); } catch { /* gone */ }
      }
    }

    writeIndex({ sessions: kept });
  } catch { /* cleanup failure is non-critical */ }
}
