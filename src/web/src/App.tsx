import { useState, useEffect } from 'react';
import { usePulseSSE, useSessions } from './hooks/usePulseData.js';
import { useServerLogs } from './hooks/useServerLogs.js';
import { usePulseStore } from './stores/pulseStore.js';
import {
  buildAgentSummaries,
  buildAlertItems,
  buildFileStats,
  buildTokenUsage,
  formatClock,
  formatDuration,
  shortPath,
} from './lib/dashboard.js';
import { translations } from './lib/translations.js';

import ActivityStream from './components/ActivityStream.js';
import TopFiles from './components/TopFiles.js';
import AgentTracker from './components/AgentTracker.js';
import AlertCenter from './components/AlertCenter.js';
import ServerMonitor from './components/ServerMonitor.js';
import TokenUsage from './components/TokenUsage.js';
import KPIRow from './components/KPIRow.js';

export default function App() {
  useSessions();
  usePulseSSE();

  const { connected, activeSessionId, events, toggleTheme, theme, sessions, language, toggleLanguage } = usePulseStore();
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const { logs } = useServerLogs(activeSessionId, 150);

  const [standaloneView, setStandaloneView] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view) setStandaloneView(view);
  }, []);

  const { setActiveSessionId: switchSession } = usePulseStore();

  const openPopout = (view: string) => {
    const params = new URLSearchParams({ view });
    if (activeSessionId) params.set('sessionId', activeSessionId);
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    window.open(url, '_blank', 'width=1400,height=850,menubar=no,status=no');
  };

  const API_BASE = window.location.origin;

  const resetSession = async () => {
    if (!activeSessionId) return;
    if (!confirm(t.CONFIRM_RESET_SESSION)) return;
    await fetch(`${API_BASE}/api/sessions/${activeSessionId}`, { method: 'DELETE' });
    window.location.reload();
  };

  const resetAll = async () => {
    if (!confirm(t.CONFIRM_RESET_ALL)) return;
    await fetch(`${API_BASE}/api/sessions`, { method: 'DELETE' });
    window.location.reload();
  };

  const files = buildFileStats(events);
  const alerts = buildAlertItems(events, logs);
  const agents = buildAgentSummaries(events);
  const tokenUsage = buildTokenUsage(events);

  const now = Date.now();
  const startedAt = activeSession?.startedAt ?? events[0]?.ts ?? null;
  const elapsedMs = startedAt ? now - new Date(startedAt).getTime() : 0;
  const currentProject = shortPath(activeSession?.project ?? events[0]?.projectDir ?? null);
  const lastUpdated = formatClock(events.at(-1)?.ts ?? logs.at(-1)?.ts ?? null);

  const activeAgentCount = agents.filter(a => a.status === 'running').length;
  const toolCallCount = events.filter(e => e.type === 'tool-start').length;

  if (standaloneView) {
    const standaloneComponents: Record<string, React.ReactNode> = {
      terminal: <ServerMonitor standalone={true} />,
      activity: <ActivityStream />,
      tokens: <TokenUsage />,
      alerts: <AlertCenter alerts={alerts} />,
      agents: <AgentTracker />,
      files: <TopFiles files={files} />,
    };
    return (
      <div className="h-screen w-screen bg-[var(--bg)] flex flex-col overflow-hidden">
        {standaloneComponents[standaloneView] ?? <ServerMonitor standalone={true} />}
      </div>
    );
  }

  const sortedSessions = sessions.slice().sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[var(--bg)]">
      {/* Session Sidebar (tmux-style) */}
      <aside className={`flex-shrink-0 flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all ${sidebarCollapsed ? 'w-[48px]' : 'w-[220px]'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)] bg-[var(--surface-raised)]">
          {!sidebarCollapsed && (
            <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-widest">{t.SESSIONS}</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[var(--text-faint)] hover:text-[var(--fg)] transition-colors text-[14px] font-bold w-6 h-6 flex items-center justify-center"
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sortedSessions.length === 0 ? (
            !sidebarCollapsed && (
              <div className="p-4 text-[var(--text-faint)] text-[11px] italic text-center">{t.NO_SESSIONS}</div>
            )
          ) : (
            sortedSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const projectName = s.project.replace(/\\/g, '/').split('/').pop() || s.project;
              const time = new Date(s.startedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
              const isLive = !s.endedAt;

              return (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`w-full text-left transition-colors border-b border-[var(--border)] ${
                    isActive
                      ? 'bg-[var(--surface-raised)] border-l-2 border-l-[var(--neon-cyan)]'
                      : 'hover:bg-[var(--surface-raised)] border-l-2 border-l-transparent'
                  }`}
                  title={s.project}
                >
                  {sidebarCollapsed ? (
                    <div className="flex flex-col items-center py-3 gap-1">
                      <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-[var(--neon-green)]' : 'bg-[var(--text-faint)]'}`}></div>
                      <span className="text-[9px] font-bold text-[var(--text-faint)] mono">{s.id.slice(0, 4).toUpperCase()}</span>
                    </div>
                  ) : (
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[12px] font-bold truncate ${isActive ? 'text-[var(--neon-cyan)]' : 'text-[var(--fg)]'}`}>
                          {projectName}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ml-2 ${isLive ? 'bg-[var(--neon-green)]' : 'bg-[var(--text-faint)]'}`}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[var(--text-faint)] mono">{s.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] text-[var(--text-faint)] mono">{time}</span>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[9px] text-[var(--text-faint)]">T:{s.toolCount}</span>
                        <span className="text-[9px] text-[var(--text-faint)]">A:{s.agentCount}</span>
                        {s.errorCount > 0 && <span className="text-[9px] text-[var(--neon-red)]">E:{s.errorCount}</span>}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="border-t border-[var(--border)] p-2 flex flex-col gap-1">
            <button onClick={resetSession} className="cli-btn !py-1 !text-[10px] w-full">{t.RESET_SESSION}</button>
            <button onClick={resetAll} className="cli-btn !py-1 !text-[10px] w-full !text-[var(--neon-red)] !border-[var(--neon-red)]/30">{t.RESET_ALL}</button>
          </div>
        )}
      </aside>

      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-4">
        {/* Header */}
        <header className="flex-shrink-0 flex justify-between items-center bg-[var(--surface-raised)] border border-[var(--border)] px-8 py-3 rounded-t-md">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <img src="/logo.svg" alt="Claude Pulse" className="w-7 h-7" />
              <span className="text-[16px] font-bold tracking-tight text-[var(--fg)] uppercase">Claude_Pulse</span>
              <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[var(--neon-green)] shadow-[0_0_6px_var(--neon-green)]' : 'bg-[var(--neon-red)] shadow-[0_0_6px_var(--neon-red)]'}`}></div>
            </div>
            <div className="hidden lg:flex items-center gap-10">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.ENVIRONMENT}</span>
                <span className="text-[13px] font-semibold text-[var(--fg)] mono uppercase truncate max-w-[200px]">{currentProject || t.INITIALIZING}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.SESSION_ID}</span>
                <span className="text-[13px] font-medium text-[var(--text-muted)] mono">{activeSessionId?.slice(0, 8).toUpperCase() || '--------'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden xl:flex items-center gap-10">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.UPTIME}</span>
                <span className="text-[14px] font-bold mono text-[var(--fg)]">{formatDuration(elapsedMs)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.TOOL_CALLS}</span>
                <span className="text-[14px] font-bold mono text-[var(--neon-cyan)]">{toolCallCount}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.AGENTS}</span>
                <span className={`text-[14px] font-bold mono ${activeAgentCount > 0 ? 'text-[var(--neon-cyan)]' : 'text-[var(--text-faint)]'}`}>
                  {activeAgentCount}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.ALERTS}</span>
                <span className={`text-[14px] font-bold mono ${alerts.length > 0 ? 'text-[var(--neon-red)]' : 'text-[var(--text-faint)]'}`}>
                  {alerts.length}
                </span>
              </div>
            </div>
            <div className="h-10 w-px bg-[var(--border)] mx-4 hidden xl:block"></div>
            <div className="flex gap-3">
              <button onClick={toggleLanguage} className="cli-btn !px-4 !py-1.5">{language === 'ko' ? 'EN' : 'KO'}</button>
              <button onClick={toggleTheme} className="cli-btn !px-4 !py-1.5">{theme.toUpperCase()}</button>
            </div>
          </div>
        </header>

        {/* KPI Row */}
        <div className="flex-shrink-0">
          <KPIRow
            elapsedMs={elapsedMs}
            toolCalls={toolCallCount}
            totalTokens={tokenUsage.totalTokens}
            hotFiles={files.length}
            activeAgents={activeAgentCount}
          />
        </div>

        {/* Main Workstation Layout */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Column: Streams */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
            <div className="flex-[3] flex flex-col min-h-0">
              <ActivityStream onPopout={() => openPopout('activity')} />
            </div>
            <div className="flex-[2] flex flex-col min-h-0">
              <ServerMonitor onPopout={() => openPopout('terminal')} />
            </div>
          </div>

          {/* Right Column: Analytics */}
          <div className="w-[460px] flex-shrink-0 flex flex-col gap-4 min-h-0">
            <div className="flex-[2] flex flex-col min-h-0">
              <TokenUsage onPopout={() => openPopout('tokens')} />
            </div>
            <div className="flex-[2] flex flex-col min-h-0">
              <AlertCenter alerts={alerts} onPopout={() => openPopout('alerts')} />
            </div>
            <div className="flex-[2] flex flex-col min-h-0">
              <AgentTracker onPopout={() => openPopout('agents')} />
            </div>
            <div className="flex-[3] flex flex-col min-h-0">
              <TopFiles files={files} onPopout={() => openPopout('files')} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex-shrink-0 flex justify-between items-center bg-[var(--surface-raised)] border border-[var(--border)] px-8 py-3 rounded-b-md">
          <div className="flex gap-12">
            <span className="text-[11px] font-bold text-[var(--neon-green)] opacity-90 tracking-widest uppercase">{t.KERNEL_SIGNAL}: ACTIVE</span>
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t.UPTIME}: {formatDuration(elapsedMs)}</span>
            <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-widest">{t.PROTOCOL}: v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-widest">{t.LAST_PACKET}: {lastUpdated}</span>
            <div className="cli-cursor !w-2 !h-4"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
