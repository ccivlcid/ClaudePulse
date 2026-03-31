import { buildAgentSummaries, formatDuration } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';
import { translations } from '../lib/translations.js';

interface AgentTrackerProps {
  onPopout?: () => void;
}

export default function AgentTracker({ onPopout }: AgentTrackerProps) {
  const events = usePulseStore((state) => state.events);
  const language = usePulseStore((state) => state.language);
  const t = translations[language];
  const agents = buildAgentSummaries(events);
  const running = agents.filter(a => a.status === 'running').length;

  return (
    <div className="cli-pane">
      <div className="cli-pane-header">
        <span className="cli-pane-title">{t.AGENT_TRACKER}</span>
        <div className="flex items-center gap-3">
          <span className="text-[var(--neon-cyan)] text-[12px] font-bold uppercase tracking-wider">{running} {t.ACTIVE}</span>
          {onPopout && <button onClick={onPopout} className="cli-btn !px-3 !py-1" title="Popout"><span className="text-[14px] font-bold">↗</span></button>}
        </div>
      </div>

      <div className="cli-pane-content font-mono bg-[var(--bg)] p-8">
        {agents.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-40">
            <span className="text-[14px] font-bold text-[var(--text-faint)] uppercase tracking-[0.2em]">{t.IDLE_NODES}</span>
          </div>
        ) : (
          <div className="space-y-8">
            {agents.map((agent) => {
              const isMain = agent.agentId === '__main__';
              const totalCalls = Object.values(agent.toolCounts).reduce((s, n) => s + n, 0);

              return (
                <div key={agent.agentId} className={`relative pl-5 border-l-2 py-1 ${isMain ? 'border-[var(--neon-cyan)]' : 'border-[var(--border-strong)]'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-[14px] uppercase tracking-wider ${isMain ? 'text-[var(--neon-cyan)]' : 'text-[var(--fg-bright)]'}`}>
                        {agent.agentType}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${agent.status === 'running' ? 'bg-[var(--neon-green)] shadow-[0_0_8px_var(--neon-green)]' : 'bg-[var(--text-faint)]'}`}></div>
                      {isMain && (
                        <span className="text-[var(--text-muted)] text-[11px] font-bold mono">
                          {totalCalls} calls
                        </span>
                      )}
                    </div>
                    {agent.status === 'running' && (
                      <span className="text-[var(--neon-amber)] text-[11px] font-bold uppercase mono bg-[var(--neon-amber)]/10 px-2 py-0.5 rounded-sm">
                        {t.RUN_TIME}: {formatDuration(Date.now() - new Date(agent.startedAt).getTime())}
                      </span>
                    )}
                  </div>

                  <div className="text-[var(--fg)] text-[12px] font-medium truncate mb-4 italic bg-[var(--surface)] px-3 py-2 rounded-md border border-[var(--border)]">
                    {agent.currentTask}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(agent.toolCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tool, count]) => (
                        <span key={tool} className="text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border)] px-2 py-1 mono bg-[var(--surface-raised)] rounded-sm">
                          <span className="text-[var(--neon-cyan)]">{tool.toUpperCase().charAt(0)}</span>_{count}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
