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
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="p-4 lg:p-5 max-w-[1680px] mx-auto grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <ActivityStream />
        </div>

        <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-3 lg:gap-4 lg:max-h-[560px]">
          <CostEstimate />
          <ErrorPanel />
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
