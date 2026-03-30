import { usePulseStore } from '../stores/pulseStore.js';

export default function CostEstimate() {
  const events = usePulseStore(s => s.events);

  let totalInputChars = 0;
  let toolCalls = 0;
  const toolCounts: Record<string, number> = {};

  for (const e of events) {
    if (e.type === 'tool-start') {
      toolCalls++;
      if (e.toolName) toolCounts[e.toolName] = (toolCounts[e.toolName] ?? 0) + 1;
      if (e.toolInput) totalInputChars += JSON.stringify(e.toolInput).length;
    }
  }

  const inputTokens = Math.round(totalInputChars / 4);
  const outputTokens = toolCalls * 500;
  const cost = (inputTokens / 1e6) * 3 + (outputTokens / 1e6) * 15;
  const low = cost * 0.5;
  const high = cost * 2.0;

  const sorted = Object.entries(toolCounts).sort(([, a], [, b]) => b - a);
  const maxCount = sorted[0]?.[1] ?? 1;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Cost</h2>
        <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
          ${low.toFixed(2)}&ndash;${high.toFixed(2)} range
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-[32px] font-semibold tracking-tight nums">${cost.toFixed(2)}</span>
        <span className="text-[13px]" style={{ color: 'var(--text-faint)' }}>est.</span>
      </div>

      <div className="space-y-[6px]">
        {sorted.slice(0, 5).map(([name, count]) => (
          <div key={name} className="flex items-center gap-3 text-[12px]">
            <span className="w-12 shrink-0" style={{ color: 'var(--text-muted)' }}>{name}</span>
            <div className="flex-1 h-[3px] rounded-full" style={{ background: 'var(--border)' }}>
              <div
                className="h-[3px] rounded-full"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  background: 'var(--text-muted)',
                }}
              />
            </div>
            <span className="nums w-6 text-right" style={{ color: 'var(--text-secondary)' }}>{count}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] mt-4 pt-3" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
        ~30&ndash;60% of actual. Tool I/O only.
      </p>
    </div>
  );
}
