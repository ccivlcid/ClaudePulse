import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { streamSSE } from 'hono/streaming';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSessions, getActiveSession, removeSession, removeAllSessions } from '../data/index-manager.js';
import { readSessionEvents, getSessionStats, getFileHeatmap, getAgentStatus, getTimeline } from '../data/reader.js';
import { getSessionFilePath, getServerLogPath, deleteSession, deleteAllData } from '../data/writer.js';
const app = new Hono();
app.use('*', cors());
// --- API Routes ---
app.get('/api/sessions', (c) => {
    const project = c.req.query('project');
    const sessions = getSessions();
    if (project) {
        const normalized = project.replace(/\\/g, '/').toLowerCase();
        return c.json(sessions.filter(s => s.project.replace(/\\/g, '/').toLowerCase() === normalized));
    }
    return c.json(sessions);
});
app.get('/api/sessions/active', (c) => {
    const project = c.req.query('project');
    if (project) {
        const normalized = project.replace(/\\/g, '/').toLowerCase();
        const sessions = getSessions()
            .filter(s => s.project.replace(/\\/g, '/').toLowerCase() === normalized && !s.endedAt)
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        if (sessions.length === 0)
            return c.json({ error: 'No active session for this project' }, 404);
        return c.json(sessions[0]);
    }
    const active = getActiveSession();
    if (!active)
        return c.json({ error: 'No active session' }, 404);
    return c.json(active);
});
app.get('/api/sessions/:id/events', (c) => {
    const events = readSessionEvents(c.req.param('id'));
    return c.json(events);
});
app.get('/api/sessions/:id/stats', (c) => {
    const stats = getSessionStats(c.req.param('id'));
    return c.json(stats);
});
app.get('/api/sessions/:id/heatmap', (c) => {
    const top = parseInt(c.req.query('top') ?? '10', 10);
    const heatmap = getFileHeatmap(c.req.param('id')).slice(0, top);
    return c.json(heatmap);
});
app.get('/api/sessions/:id/agents', (c) => {
    const agents = getAgentStatus(c.req.param('id'));
    return c.json(agents);
});
app.get('/api/sessions/:id/timeline', (c) => {
    const timeline = getTimeline(c.req.param('id'));
    return c.json(timeline);
});
app.get('/api/sessions/:id/server-logs', (c) => {
    const sid = c.req.param('id');
    const lines = parseInt(c.req.query('lines') ?? '100', 10);
    const logPath = getServerLogPath(sid);
    try {
        const raw = fs.readFileSync(logPath, 'utf-8');
        const entries = raw.trim().split('\n')
            .filter(l => l)
            .map(l => { try {
            return JSON.parse(l);
        }
        catch {
            return null;
        } })
            .filter(Boolean);
        return c.json(entries.slice(-lines));
    }
    catch {
        return c.json([]);
    }
});
// --- Data management endpoints ---
app.delete('/api/sessions/:id', (c) => {
    const sid = c.req.param('id');
    const found = removeSession(sid);
    if (!found)
        return c.json({ error: 'Session not found' }, 404);
    deleteSession(sid);
    return c.json({ ok: true, message: `Session ${sid} deleted` });
});
app.delete('/api/sessions', (c) => {
    deleteAllData();
    removeAllSessions();
    return c.json({ ok: true, message: 'All data reset' });
});
// --- SSE endpoint ---
app.get('/api/sse', (c) => {
    const sessionId = c.req.query('sessionId') ?? getActiveSession()?.id;
    if (!sessionId) {
        return c.text('No active session', 404);
    }
    return streamSSE(c, async (stream) => {
        const filePath = getSessionFilePath(sessionId);
        let lastSize = 0;
        try {
            const stat = fs.statSync(filePath);
            lastSize = stat.size;
        }
        catch {
            // File doesn't exist yet
        }
        // Send initial events
        const events = readSessionEvents(sessionId);
        for (const event of events) {
            await stream.writeSSE({ event: 'pulse-event', data: JSON.stringify(event) });
        }
        // Watch for new events
        let watching = true;
        const checkNewEvents = async () => {
            if (!watching)
                return;
            try {
                const stat = fs.statSync(filePath);
                if (stat.size > lastSize) {
                    const fd = fs.openSync(filePath, 'r');
                    const buf = Buffer.alloc(stat.size - lastSize);
                    fs.readSync(fd, buf, 0, buf.length, lastSize);
                    fs.closeSync(fd);
                    lastSize = stat.size;
                    const newLines = buf.toString('utf-8').trim().split('\n');
                    for (const line of newLines) {
                        if (!line)
                            continue;
                        try {
                            const event = JSON.parse(line);
                            await stream.writeSSE({ event: 'pulse-event', data: JSON.stringify(event) });
                        }
                        catch { /* skip bad line */ }
                    }
                }
            }
            catch { /* file may not exist yet */ }
        };
        let watcher = null;
        try {
            watcher = fs.watch(filePath, () => checkNewEvents());
        }
        catch {
            // File doesn't exist yet, poll instead
        }
        // Heartbeat + fallback polling
        const interval = setInterval(async () => {
            await checkNewEvents();
            await stream.writeSSE({ event: 'heartbeat', data: '' });
        }, 3000);
        stream.onAbort(() => {
            watching = false;
            clearInterval(interval);
            watcher?.close();
        });
        // Keep connection alive
        while (watching) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    });
});
// --- Static file serving (built React app) ---
app.get('*', (c) => {
    // When compiled, server.js is in dist/web/ alongside index.html and assets/
    const webDir = path.dirname(fileURLToPath(import.meta.url));
    const reqPath = c.req.path === '/' ? '/index.html' : c.req.path;
    const filePath = path.join(webDir, reqPath);
    try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
        };
        return c.body(content, 200, { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' });
    }
    catch {
        // SPA fallback
        try {
            const html = fs.readFileSync(path.join(webDir, 'index.html'));
            return c.body(html, 200, { 'Content-Type': 'text/html' });
        }
        catch {
            return c.text('Dashboard not built. Run: npm run build:web', 404);
        }
    }
});
// --- Start ---
export function startDashboard(port = 52101) {
    serve({ fetch: app.fetch, port });
    return { port };
}
// Direct execution (only when running web/server.js directly, not via mcp/server.js)
const scriptPath = process.argv[1]?.replace(/\\/g, '/') ?? '';
const isDirectRun = scriptPath.endsWith('web/server.js') || scriptPath.endsWith('web/server.ts');
if (isDirectRun) {
    const port = parseInt(process.env.PULSE_DASHBOARD_PORT ?? '52101', 10);
    startDashboard(port);
    console.log(`Claude Pulse Dashboard: http://localhost:${port}`);
}
//# sourceMappingURL=server.js.map