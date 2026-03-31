import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
export function getPulseDir() {
    return path.join(os.homedir(), '.claude-pulse');
}
export function getSessionsDir() {
    return path.join(getPulseDir(), 'sessions');
}
export function getServersDir() {
    return path.join(getPulseDir(), 'servers');
}
export function getSessionFilePath(sessionId) {
    return path.join(getSessionsDir(), `${sessionId}.jsonl`);
}
export function getServerLogPath(sessionId) {
    return path.join(getServersDir(), `${sessionId}.jsonl`);
}
export function getIndexPath() {
    return path.join(getPulseDir(), 'index.json');
}
export function getConfigPath() {
    return path.join(getPulseDir(), 'config.json');
}
export function ensureDirectories() {
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.mkdirSync(getServersDir(), { recursive: true });
}
export function appendEvent(sessionId, event) {
    ensureDirectories();
    const filePath = getSessionFilePath(sessionId);
    fs.appendFileSync(filePath, JSON.stringify(event) + '\n');
}
export function appendServerLog(sessionId, log) {
    ensureDirectories();
    const filePath = getServerLogPath(sessionId);
    fs.appendFileSync(filePath, JSON.stringify(log) + '\n');
}
//# sourceMappingURL=writer.js.map