import { usePulseSSE, useSessions } from './hooks/usePulseData.js';
import { usePulseStore } from './stores/pulseStore.js';
import ActivityStream from './components/ActivityStream.js';
import FileHeatmap from './components/FileHeatmap.js';
import AgentTracker from './components/AgentTracker.js';
import CostEstimate from './components/CostEstimate.js';
import SessionTimeline from './components/SessionTimeline.js';
import ErrorPanel from './components/ErrorPanel.js';
import ServerMonitor from './components/ServerMonitor.js';
import ProjectComparison from './components/ProjectComparison.js';

export default function App() {
  useSessions();
  usePulseSSE();

  const { connected, activeSessionId, events, theme, toggleTheme } = usePulseStore();

  const toolCount = events.filter(e => e.type === 'tool-start').length;
  const errorCount = events.filter(e => e.type === 'tool-error').length;
  const elapsed = events.length > 0
    ? Math.round((Date.now() - new Date(events[0].ts).getTime()) / 60000)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-6">
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Claude Pulse</span>

          {activeSessionId && (
            <nav className="hidden sm:flex items-center gap-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              <span className="nums">{elapsed}m</span>
              <span style={{ color: 'var(--text-faint)' }}>/</span>
              <span className="nums">{toolCount} calls</span>
              {errorCount > 0 && (
                <>
                  <span style={{ color: 'var(--text-faint)' }}>/</span>
                  <span style={{ color: 'var(--red)' }} className="nums">{errorCount} err</span>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          {activeSessionId && (
            <span className="font-mono nums" style={{ color: 'var(--text-faint)', fontSize: '12px' }}>
              {activeSessionId.slice(0, 8)}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`w-[6px] h-[6px] rounded-full ${connected ? 'live-pulse' : ''}`}
              style={{ background: connected ? 'var(--green)' : 'var(--red)' }}
            />
            <span style={{ color: connected ? 'var(--text-secondary)' : 'var(--red)' }}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="p-4 lg:p-5 max-w-[1680px] mx-auto grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <ActivityStream />
        </div>

        <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-3 lg:gap-4">
          <CostEstimate />
          <ErrorPanel />
        </div>

        <div className="col-span-12 md:col-span-4">
          <SessionTimeline />
        </div>
        <div className="col-span-12 md:col-span-4">
          <FileHeatmap />
        </div>
        <div className="col-span-12 md:col-span-4">
          <AgentTracker />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ServerMonitor />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <ProjectComparison />
        </div>
      </main>
    </div>
  );
}
