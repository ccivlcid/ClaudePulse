import { usePulseStore } from '../stores/pulseStore.js';

export default function ErrorPanel() {
  const events = usePulseStore(s => s.events);
  const errors = events.filter(e => e.type === 'tool-error');

  return (
    <div className="card flex-1 flex flex-col min-h-[200px]">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Errors</h2>
        {errors.length > 0 ? (
          <span className="text-[12px] font-medium nums" style={{ color: 'var(--red)' }}>{errors.length}</span>
        ) : (
          <span className="text-[12px]" style={{ color: 'var(--text-faint)' }}>0</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {errors.length === 0 ? (
          <p className="text-[13px] pt-4 text-center" style={{ color: 'var(--text-faint)' }}>Clean</p>
        ) : (
          errors.map(e => {
            const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div
                key={e.id}
                className="rounded-lg p-3 text-[12px]"
                style={{ background: 'color-mix(in srgb, var(--red) 5%, transparent)', borderLeft: '2px solid var(--red)' }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{e.toolName}</span>
                  <span className="nums" style={{ color: 'var(--text-faint)' }}>{time}</span>
                </div>
                {e.message && (
                  <p style={{ color: 'var(--text-muted)' }} className="leading-relaxed">{e.message}</p>
                )}
                {e.toolResponse?.stderr && (
                  <pre
                    className="mt-2 text-[11px] rounded p-2 overflow-x-auto leading-relaxed"
                    style={{ background: 'color-mix(in srgb, var(--text-primary) 6%, var(--surface))', color: 'var(--red)' }}
                  >{e.toolResponse.stderr.slice(0, 300)}</pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
