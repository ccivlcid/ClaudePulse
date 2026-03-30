import { usePulseSSE, useSessions } from './hooks/usePulseData.js';
import { useServerLogs } from './hooks/useServerLogs.js';
import { usePulseStore } from './stores/pulseStore.js';
import {
  buildAgentSummaries,
  buildAlertItems,
  buildFileStats,
  calculateCost,
  formatClock,
  formatDuration,
  shortPath,
  summarizeServer,
} from './lib/dashboard.js';
import ActivityStream from './components/ActivityStream.js';
import FileHeatmap from './components/FileHeatmap.js';
import AgentTracker from './components/AgentTracker.js';
import CostEstimate from './components/CostEstimate.js';
import SessionTimeline from './components/SessionTimeline.js';
import ErrorPanel from './components/ErrorPanel.js';
import ServerMonitor from './components/ServerMonitor.js';
import ProjectComparison from './components/ProjectComparison.js';

function statusClass(status: 'LIVE' | 'OFFLINE' | 'WARN' | 'ERROR') {
  if (status === 'LIVE') return 'is-success';
  if (status === 'WARN') return 'is-warn';
  if (status === 'ERROR') return 'is-error';
  return 'is-neutral';
}

export default function App() {
  useSessions();
  usePulseSSE();

  const { connected, activeSessionId, events, theme, toggleTheme, sessions } = usePulseStore();
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const { logs } = useServerLogs(activeSessionId, 30);

  const cost = calculateCost(events);
  const files = buildFileStats(events);
  const agents = buildAgentSummaries(events);
  const alerts = buildAlertItems(events, logs);
  const server = summarizeServer(logs);
  const now = Date.now();
  const startedAt = activeSession?.startedAt ?? events[0]?.ts ?? null;
  const elapsedMs = startedAt ? now - new Date(startedAt).getTime() : 0;
  const currentProject = shortPath(activeSession?.project ?? events[0]?.projectDir ?? null);
  const lastUpdated = formatClock(events.at(-1)?.ts ?? logs.at(-1)?.ts ?? null);
  const serverStatus = server.status === 'OFFLINE' ? 'OFFLINE' : server.status;

  const metrics = [
    { label: 'Elapsed', value: startedAt ? formatDuration(elapsedMs) : '--', hint: activeSessionId ? 'Current session runtime' : 'Waiting for session' },
    { label: 'Tool Calls', value: `${cost.toolCalls}`, hint: 'Recorded tool-start events' },
    { label: 'Est. Cost', value: `$${cost.cost.toFixed(2)}`, hint: 'Based on tool I/O only' },
    { label: 'Hot Files', value: `${files.filter((file) => file.total > 1).length || files.length}`, hint: files.length ? `${files.length} files touched` : 'No file activity yet' },
    { label: 'Project', value: currentProject === 'Unknown target' ? 'No project' : currentProject, hint: activeSession ? 'Active session context' : 'No active session' },
  ];

  return (
    <div className="dashboard-shell">
      <div className="max-w-[1680px] mx-auto px-4 py-4 lg:px-6 lg:py-5">
        <header className="topbar mb-4 lg:mb-5">
          <div>
            <p className="panel-kicker">Claude Pulse</p>
            <h1 className="text-[24px] font-semibold tracking-[-0.03em]">
              {activeSessionId ? 'Session active' : 'No active session'}
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {activeSessionId
                ? `${currentProject} tracking live activity and diagnostics`
                : 'Open the dashboard during a Claude session to see live activity and alerts.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 lg:max-w-[55%]">
            <span className={`status-pill ${connected ? 'is-success' : 'is-error'}`}>{connected ? 'LIVE' : 'OFFLINE'}</span>
            <span className="status-pill is-neutral">{activeSessionId ? 'Session active' : 'No active session'}</span>
            <span className="status-pill is-accent">{agents.filter((agent) => agent.status === 'running').length} agents</span>
            <span className={`status-pill ${alerts.length > 0 ? 'is-error' : 'is-neutral'}`}>{alerts.length} alerts</span>
            <span className={`status-pill ${statusClass(serverStatus)}`}>Server {serverStatus}</span>
            <span className="status-pill is-neutral">Updated {lastUpdated}</span>
            <button
              onClick={toggleTheme}
              className="icon-button"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <section className="metric-grid mb-4 lg:mb-5">
          {metrics.map((metric) => (
            <div key={metric.label} className="metric-tile">
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-hint">{metric.hint}</span>
            </div>
          ))}
        </section>

        <main className="grid grid-cols-12 gap-4 lg:gap-5">
          <div className="col-span-12 xl:col-span-8">
            <ActivityStream />
          </div>

          <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 lg:gap-5">
            <ErrorPanel />
            <CostEstimate />
          </div>

          <div className="col-span-12 lg:col-span-4">
            <SessionTimeline />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <FileHeatmap />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <AgentTracker />
          </div>

          <div className="col-span-12 lg:col-span-7">
            <ServerMonitor />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <ProjectComparison />
          </div>
        </main>
      </div>
    </div>
  );
}
