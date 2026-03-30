import { calculateCost, TOOL_ACCENTS } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

export default function CostEstimate() {
  const events = usePulseStore((state) => state.events);
  const summary = calculateCost(events);
  const rows = Object.entries(summary.toolCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
  const maxCount = rows[0]?.[1] ?? 1;

  return (
    <div className="card min-h-[280px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">Session Spend</p>
          <h2 className="panel-title">Cost Snapshot</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Estimate based on tool I/O and recent call distribution.
          </p>
        </div>
        <div className="text-right">
          <div className="panel-meta">${summary.low.toFixed(2)}-${summary.high.toFixed(2)} range</div>
          <div className="panel-meta mt-1">{summary.toolCalls} calls</div>
        </div>
      </div>

      <div className="pt-4 flex-1 flex flex-col">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="metric-value text-[34px]">${summary.cost.toFixed(2)}</div>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>Estimated session cost</p>
          </div>
          <span className="status-pill is-accent">Tool I/O only</span>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state flex-1">
            <h3>No tool activity yet</h3>
            <p>Cost and tool mix will appear after the first tool calls.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(([name, count]) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                  <span className="nums" style={{ color: 'var(--text-muted)' }}>{count} calls</span>
                </div>
                <div className="h-[6px] rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-[6px] rounded-full"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: TOOL_ACCENTS[name] ?? 'var(--text-secondary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 pt-3 text-[11px]" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
          Real cost may vary. Use this panel for session-to-session comparison, not billing accuracy.
        </p>
      </div>
    </div>
  );
}
