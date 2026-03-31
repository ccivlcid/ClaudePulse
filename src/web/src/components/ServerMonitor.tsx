import { useServerLogs } from '../hooks/useServerLogs.js';
import { summarizeServer, formatClock } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';
import { translations } from '../lib/translations.js';

interface ServerMonitorProps {
  onPopout?: () => void;
  standalone?: boolean;
}

export default function ServerMonitor({ onPopout, standalone = false }: ServerMonitorProps) {
  const activeSessionId = usePulseStore((state) => state.activeSessionId);
  const language = usePulseStore((state) => state.language);
  const t = translations[language];
  const { logs } = useServerLogs(activeSessionId, standalone ? 300 : 150);
  const server = summarizeServer(logs);

  return (
    <div className={`cli-pane ${standalone ? 'border-0' : ''}`}>
      <div className="cli-pane-header">
        <div className="flex items-center gap-4">
          <span className="cli-pane-title">{t.SERVER_MONITOR}</span>
          {server.status === 'LIVE' && <span className="text-[11px] font-bold text-[var(--neon-green)] uppercase tracking-widest">{t.SERVER_STABLE}</span>}
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden sm:flex gap-8 border-r border-[var(--border)] pr-8 h-5 items-center">
            <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{t.PORT}: <span className="text-[var(--fg)] mono">{server.port || '----'}</span></span>
            <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{t.PING}: <span className="text-[var(--fg)] mono">{server.avgResponseTime || '0'}MS</span></span>
          </div>
          {!standalone && onPopout && (
            <button onClick={onPopout} className="cli-btn !px-3 !py-1" title="Detach Terminal">
              <span className="text-[14px] font-bold">↗</span>
            </button>
          )}
        </div>
      </div>

      <div className="cli-pane-content bg-[var(--bg)] p-0">
        <div className="p-8 font-mono text-[14px] leading-relaxed selection:bg-[var(--neon-green)] selection:text-black">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-40">
              <span className="text-[15px] tracking-[0.2em] font-bold text-[var(--text-faint)] uppercase italic">{t.INITIALIZING_STREAM}</span>
            </div>
          ) : (
            <div className="space-y-1">
              {[...logs].reverse().map((log, i) => (
                <div key={i} className="group flex gap-8 py-1 hover:bg-[var(--surface)] transition-colors rounded px-2">
                  <div className="shrink-0 flex items-center gap-4 w-32">
                    <span className="text-[var(--text-faint)] font-medium text-[12px] mono">{formatClock(log.ts)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm leading-none border ${
                      log.level === 'error' ? 'border-[var(--neon-red)] text-[var(--neon-red)]' : 
                      log.level === 'warn' ? 'border-[var(--neon-amber)] text-[var(--neon-amber)]' : 
                      'border-[var(--border)] text-[var(--text-muted)]'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  <span className={`break-all group-hover:text-[var(--fg-bright)] transition-colors tracking-tight font-medium ${
                    log.level === 'error' ? 'text-[var(--neon-red)]' : 
                    log.level === 'warn' ? 'text-[var(--neon-amber)]' : 'text-[var(--fg)]'
                  }`}>
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
