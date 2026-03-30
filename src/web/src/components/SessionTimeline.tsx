import { usePulseStore } from '../stores/pulseStore.js';

const DOT_COLOR: Record<string, string> = {
  'session-start': '#22c55e',
  'session-end': '#52525b',
  'tool-start': '#60a5fa',
  'tool-error': '#ef4444',
  'agent-start': '#22d3ee',
  'agent-stop': '#0e7490',
};

export default function SessionTimeline() {
  const events = usePulseStore(s => s.events);

  const keyEvents = events.filter(e => e.type !== 'tool-end').slice(-40);

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Timeline</h2>
        <span className="text-[12px] nums" style={{ color: 'var(--text-faint)' }}>{keyEvents.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {keyEvents.length === 0 ? (
          <p className="text-[13px] pt-8 text-center" style={{ color: 'var(--text-faint)' }}>No events yet</p>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-[3px] top-1 bottom-1 w-px" style={{ background: 'var(--border)' }} />

            {keyEvents.map(e => {
              const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const color = DOT_COLOR[e.type] ?? '#3f3f46';
              const isError = e.type === 'tool-error';

              let label = e.type;
              if (e.type === 'tool-start') label = e.toolName ?? 'tool';
              if (e.type === 'tool-error') label = `${e.toolName ?? 'tool'} failed`;
              if (e.type === 'agent-start') label = `agent ${e.agentType ?? ''}`;
              if (e.type === 'agent-stop') label = `agent done`;
              if (e.type === 'session-start') label = 'session start';
              if (e.type === 'session-end') label = 'session end';

              return (
                <div key={e.id} className="relative mb-[7px] text-[12px]">
                  <div
                    className="absolute -left-[7px] top-[5px] w-[7px] h-[7px] rounded-full"
                    style={{ background: color }}
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="nums shrink-0" style={{ color: 'var(--text-faint)', fontSize: '11px' }}>{time}</span>
                    <span style={{ color: isError ? 'var(--red)' : 'var(--text-secondary)' }}>{label}</span>
                    {e.filePath && (
                      <span className="truncate" style={{ color: 'var(--text-faint)', fontSize: '11px' }}>
                        {e.filePath.split('/').slice(-2).join('/')}
                      </span>
                    )}
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
