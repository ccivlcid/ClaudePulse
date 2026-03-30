import { usePulseStore } from '../stores/pulseStore.js';

export default function AgentTracker() {
  const events = usePulseStore(s => s.events);

  const agents = new Map<string, {
    agentId: string;
    agentType: string;
    status: 'running' | 'done';
    startTs: string;
    endTs?: string;
  }>();

  for (const e of events) {
    if (e.type === 'agent-start' && e.agentId) {
      agents.set(e.agentId, {
        agentId: e.agentId,
        agentType: e.agentType ?? 'unknown',
        status: 'running',
        startTs: e.ts,
      });
    }
    if (e.type === 'agent-stop' && e.agentId) {
      const a = agents.get(e.agentId);
      if (a) { a.status = 'done'; a.endTs = e.ts; }
    }
  }

  const agentList = [...agents.values()];
  const running = agentList.filter(a => a.status === 'running').length;

  return (
    <div className="rounded-xl p-5 h-[420px] flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Agents</h2>
        {running > 0 ? (
          <span className="text-[12px] nums" style={{ color: 'var(--green)' }}>{running} active</span>
        ) : (
          <span className="text-[12px] nums" style={{ color: 'var(--text-faint)' }}>{agentList.length}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-[6px]">
        {agentList.length === 0 ? (
          <p className="text-[13px] pt-8 text-center" style={{ color: 'var(--text-faint)' }}>No agents</p>
        ) : (
          agentList.map(a => {
            const elapsed = Math.round(
              ((a.endTs ? new Date(a.endTs).getTime() : Date.now()) - new Date(a.startTs).getTime()) / 1000
            );
            const isRunning = a.status === 'running';
            return (
              <div
                key={a.agentId}
                className="flex items-center justify-between py-2 px-3 rounded-lg text-[12px]"
                style={{
                  background: isRunning ? 'rgba(34, 197, 94, 0.04)' : 'transparent',
                  border: isRunning ? '1px solid rgba(34, 197, 94, 0.12)' : '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-[5px] h-[5px] rounded-full ${isRunning ? 'live-pulse' : ''}`}
                    style={{ background: isRunning ? 'var(--green)' : 'var(--text-faint)' }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>{a.agentType}</span>
                </div>
                <span className="nums" style={{ color: 'var(--text-faint)' }}>{elapsed}s</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
