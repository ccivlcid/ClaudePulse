#!/usr/bin/env node

// DEBUG MODE: 실제 Hook 데이터를 그대로 덤프하여 스키마 검증용
// 검증 완료 후 실제 구현으로 교체 예정

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const pulseDir = path.join(os.homedir(), '.claude-pulse');
const debugFile = path.join(pulseDir, 'hook-debug.jsonl');

try {
  if (!fs.existsSync(pulseDir)) {
    fs.mkdirSync(pulseDir, { recursive: true });
  }

  // stdin 읽기
  let stdin = '';
  try {
    stdin = fs.readFileSync(0, 'utf-8');
  } catch {
    stdin = '(stdin read failed)';
  }

  // stdin JSON 파싱 시도
  let stdinParsed = null;
  try {
    stdinParsed = JSON.parse(stdin);
  } catch {
    stdinParsed = null;
  }

  const dump = {
    ts: new Date().toISOString(),
    eventType: process.argv[2] || '(no arg)',
    argv: process.argv.slice(2),
    claudeEnv: Object.fromEntries(
      Object.entries(process.env).filter(([k]) =>
        k.startsWith('CLAUDE') || k.startsWith('PULSE') || k === 'SESSION_ID'
      )
    ),
    stdinRaw: stdin.slice(0, 2000),
    stdinParsed,
    stdinKeys: stdinParsed ? Object.keys(stdinParsed) : [],
  };

  fs.appendFileSync(debugFile, JSON.stringify(dump) + '\n');
} catch {
  // 조용히 실패 - Claude Code 작업을 방해하면 안 됨
}
