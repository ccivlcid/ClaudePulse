import { buildAgentSummaries, formatDuration } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

export default function AgentTracker() {
  const events = usePulseStore((state) => state.events);
  const agents = buildAgentSummaries(events);
  const running = agents.filter((agent) => agent.status === 'running').length;

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">Subagent Watch</p>
          <h2 className="panel-title">Agent Tracker</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Running agents, latest task context, and captured tool activity.
          </p>
        </div>
        <div className="text-right">
          <div className="metric-value text-[26px]">{running}</div>
          <div className="panel-meta">running now</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
        {agents.length === 0 ? (
          <div className="empty-state h-full">
            <h3>No active agents</h3>
            <p>Subagent activity will appear here.</p>
          </div>
        ) : (
          agents.map((agent) => {
            const elapsedMs = (agent.endedAt ? new Date(agent.endedAt).getTime() : Date.now()) - new Date(agent.startedAt).getTime();
            const summary = ['Read', 'Edit', 'Bash']
              .map((key) => `${key[0]} ${agent.toolCounts[key] ?? 0}`)
              .join(' / ');

            return (
              <article key={agent.agentId} className="stat-row">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`status-pill ${agent.status === 'running' ? 'is-success' : 'is-neutral'}`}>
                        {agent.status === 'running' ? 'RUNNING' : 'DONE'}
                      </span>
                      <h3 className="text-[13px] font-medium">{agent.agentType}</h3>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {agent.currentTask}
                    </p>
                  </div>
                  <span className="panel-meta shrink-0">{formatDuration(elapsedMs)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="split-chip">{summary}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
