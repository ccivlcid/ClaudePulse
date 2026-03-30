import { buildTimelineMilestones, formatClock } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

function toneClass(tone: 'neutral' | 'accent' | 'warn' | 'error') {
  if (tone === 'accent') return 'timeline-dot is-accent';
  if (tone === 'warn') return 'timeline-dot is-warn';
  if (tone === 'error') return 'timeline-dot is-error';
  return 'timeline-dot';
}

export default function SessionTimeline() {
  const events = usePulseStore((state) => state.events);
  const milestones = buildTimelineMilestones(events);

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">Session Story</p>
          <h2 className="panel-title">Session Timeline</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Key milestones that summarize how the session evolved.
          </p>
        </div>
        <div className="text-right">
          <div className="metric-value text-[26px]">{milestones.length}</div>
          <div className="panel-meta">milestones</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4">
        {milestones.length === 0 ? (
          <div className="empty-state h-full">
            <h3>No milestones yet</h3>
            <p>Session milestones will appear as work progresses.</p>
          </div>
        ) : (
          <div className="relative pl-5 space-y-4">
            <div className="absolute left-[9px] top-1 bottom-1 w-px" style={{ background: 'var(--border)' }} />
            {milestones.map((milestone) => (
              <article key={milestone.id} className="relative pl-4">
                <span className={toneClass(milestone.tone)} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-medium leading-tight">{milestone.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {milestone.summary}
                    </p>
                  </div>
                  <span className="panel-meta shrink-0">{formatClock(milestone.ts)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
