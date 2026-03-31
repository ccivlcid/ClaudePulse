import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const dir = path.join(os.homedir(), '.claude-pulse');
const sessDir = path.join(dir, 'sessions');
const srvDir = path.join(dir, 'servers');
fs.mkdirSync(sessDir, { recursive: true });
fs.mkdirSync(srvDir, { recursive: true });

const projects = [
  { name: 'ClaudePulse', path: 'C:\\PythonProjects\\ClaudePulse', tools: 42, agents: 3, errors: 2 },
  { name: 'ru_production_portal', path: 'C:\\rmproject\\ru_production_portal', tools: 28, agents: 1, errors: 0 },
  { name: 'my-api-server', path: 'C:\\Projects\\my-api-server', tools: 15, agents: 0, errors: 3 },
];

const sessions = [];
const toolNames = ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'];
const fileList = ['src/index.ts', 'src/app.tsx', 'src/server.ts', 'src/config.ts', 'package.json', 'README.md', 'tsconfig.json', 'src/utils.ts', 'src/api/routes.ts', 'src/db/models.ts'];
const agentTypes = ['code-reviewer', 'Explore', 'feature-dev', 'Plan'];

for (const proj of projects) {
  const sid = crypto.randomUUID();
  const baseTime = new Date(Date.now() - Math.floor(Math.random() * 3600000 + 600000));
  const evts = [];
  let evtIdx = 1;

  evts.push({ id: 'e' + evtIdx++, ts: baseTime.toISOString(), type: 'session-start', sessionId: sid, projectDir: proj.path });

  for (let i = 0; i < proj.tools; i++) {
    const ts = new Date(baseTime.getTime() + (i + 1) * 3000).toISOString();
    const tsEnd = new Date(baseTime.getTime() + (i + 1) * 3000 + 800).toISOString();
    const tool = toolNames[Math.floor(Math.random() * toolNames.length)];
    const fp = fileList[Math.floor(Math.random() * fileList.length)];
    const tuid = 'toolu_' + crypto.randomUUID().slice(0, 8);

    if (i < proj.errors) {
      evts.push({ id: 'e' + evtIdx++, ts, type: 'tool-error', sessionId: sid, toolName: 'Bash', toolUseId: tuid, message: 'Command failed with exit code 1', filePath: fp });
    } else {
      evts.push({ id: 'e' + evtIdx++, ts, type: 'tool-start', sessionId: sid, toolName: tool, toolUseId: tuid, filePath: fp, toolInput: { command: 'npm test', path: fp } });
      evts.push({ id: 'e' + evtIdx++, ts: tsEnd, type: 'tool-end', sessionId: sid, toolName: tool, toolUseId: tuid, toolResponse: { stdout: 'ok output for ' + tool } });
    }
  }

  for (let i = 0; i < proj.agents; i++) {
    const aid = 'agent-' + crypto.randomUUID().slice(0, 8);
    const atype = agentTypes[Math.floor(Math.random() * agentTypes.length)];
    const ts = new Date(baseTime.getTime() + (proj.tools + i) * 3000).toISOString();
    const tsEnd = new Date(baseTime.getTime() + (proj.tools + i + 2) * 3000).toISOString();
    evts.push({ id: 'e' + evtIdx++, ts, type: 'agent-start', sessionId: sid, agentId: aid, agentType: atype, lastAgentMessage: 'Working on ' + fileList[i % fileList.length] });
    for (let j = 0; j < 3; j++) {
      const tts = new Date(new Date(ts).getTime() + (j + 1) * 1000).toISOString();
      evts.push({ id: 'e' + evtIdx++, ts: tts, type: 'tool-start', sessionId: sid, agentId: aid, agentType: atype, toolName: toolNames[j % toolNames.length], toolUseId: 'toolu_a' + j, filePath: fileList[j % fileList.length] });
      evts.push({ id: 'e' + evtIdx++, ts: new Date(new Date(tts).getTime() + 500).toISOString(), type: 'tool-end', sessionId: sid, agentId: aid, toolName: toolNames[j % toolNames.length], toolUseId: 'toolu_a' + j, toolResponse: { stdout: 'result' } });
    }
    evts.push({ id: 'e' + evtIdx++, ts: tsEnd, type: 'agent-stop', sessionId: sid, agentId: aid, agentType: atype, lastAgentMessage: 'Completed analysis' });
  }

  fs.writeFileSync(path.join(sessDir, sid + '.jsonl'), evts.map(e => JSON.stringify(e)).join('\n') + '\n');

  const srvLogs = [];
  for (let i = 0; i < 30; i++) {
    const ts = new Date(baseTime.getTime() + i * 5000).toISOString();
    const roll = Math.random();
    if (roll < 0.1) srvLogs.push({ ts, level: 'error', source: 'stderr', text: 'ECONNRESET: connection reset by peer' });
    else if (roll < 0.2) srvLogs.push({ ts, level: 'warn', source: 'stderr', text: 'Heap usage warning: RSS exceeds limit' });
    else srvLogs.push({ ts, level: 'info', source: 'stdout', text: 'GET /api/data 200 ' + Math.floor(Math.random() * 50) + 'ms' });
  }
  fs.writeFileSync(path.join(srvDir, sid + '.jsonl'), srvLogs.map(l => JSON.stringify(l)).join('\n') + '\n');

  sessions.push({
    id: sid,
    project: proj.path,
    startedAt: baseTime.toISOString(),
    endedAt: proj.name === 'ClaudePulse' ? null : new Date(baseTime.getTime() + proj.tools * 3000 + 60000).toISOString(),
    toolCount: proj.tools,
    agentCount: proj.agents,
    errorCount: proj.errors,
  });
}

fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ sessions }, null, 2) + '\n');
console.log('Created', sessions.length, 'sessions:');
for (const s of sessions) {
  const proj = path.basename(s.project);
  console.log(' -', s.id.slice(0, 8), '|', proj, '| tools:', s.toolCount, '| agents:', s.agentCount, '| active:', !s.endedAt);
}
