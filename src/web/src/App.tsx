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
  const t = translations[language];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view) setStandaloneView(view);
  }, []);

  const openPopout = (view: string) => {
    const url = `${window.location.origin}${window.location.pathname}?view=${view}`;
    window.open(url, '_blank', 'width=1400,height=850,menubar=no,status=no');
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

  return (
    <div className="cli-dashboard">
      {/* Global Status Bar (Fixed Height) */}
      <header className="flex-shrink-0 flex justify-between items-center bg-[var(--surface-raised)] border border-[var(--border)] px-8 py-3 rounded-t-md">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-[var(--neon-green)]' : 'bg-[var(--neon-red)]'}`}></div>
            <span className="text-[16px] font-bold tracking-tight text-[var(--fg)] uppercase">Claude_Pulse</span>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.ENVIRONMENT}</span>
              <span className="text-[13px] font-semibold text-[var(--fg)] mono uppercase truncate max-w-[200px]">{currentProject || t.INITIALIZING}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.SESSION_ID}</span>
              <span className="text-[13px] font-medium text-[var(--text-muted)] mono">{activeSessionId?.slice(0,8).toUpperCase() || '--------'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.AGENTS}</span>
              <span className={`text-[16px] font-bold mono ${activeAgentCount > 0 ? 'text-[var(--neon-cyan)]' : 'text-[var(--text-faint)]'}`}>
                {activeAgentCount}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.ALERTS}</span>
              <span className={`text-[16px] font-bold mono ${alerts.length > 0 ? 'text-[var(--neon-red)]' : 'text-[var(--text-faint)]'}`}>
                {alerts.length}
              </span>
            </div>
          </div>
          <div className="h-10 w-px bg-[var(--border)] mx-4"></div>
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.PROTOCOL}</span>
              <span className={`text-[13px] font-bold ${connected ? 'text-[var(--neon-green)]' : 'text-[var(--neon-red)]'}`}>
                {connected ? t.STABLE : t.INTERRUPTED}
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={toggleLanguage} className="cli-btn !px-4 !py-1.5">{language === 'ko' ? 'EN' : 'KO'}</button>
              <button onClick={toggleTheme} className="cli-btn !px-4 !py-1.5">{theme.toUpperCase()}</button>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Row (Fixed Height) */}
      <div className="flex-shrink-0">
        <KPIRow 
          elapsedMs={elapsedMs} 
          toolCalls={toolCallCount} 
          totalTokens={tokenUsage.totalTokens} 
          hotFiles={files.length}
          activeAgents={activeAgentCount}
        />
      </div>

      {/* Main Workstation Layout (Fluid Content Area) */}
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
      
      {/* Footer (Fixed Height) */}
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
  );
}
