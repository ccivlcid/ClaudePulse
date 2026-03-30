import { useState } from 'react';
import { usePulseStore } from '../stores/pulseStore.js';
import { buildActivityGroups, formatClock } from '../lib/dashboard.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'errors', label: 'Errors' },
  { key: 'tools', label: 'Tools' },
  { key: 'agents', label: 'Agents' },
  { key: 'session', label: 'Session' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function toneClass(tone: 'neutral' | 'accent' | 'warn' | 'error') {
  if (tone === 'accent') return 'tone-accent';
  if (tone === 'warn') return 'tone-warn';
  if (tone === 'error') return 'tone-error';
  return 'tone-neutral';
}

export default function ActivityStream() {
  const events = usePulseStore((state) => state.events);
  const [filter, setFilter] = useState<FilterKey>('all');
  const groups = buildActivityGroups(events, filter);
  const itemCount = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <div className="card card-elevated h-[620px] flex flex-col">
      <div className="flex flex-col gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="panel-kicker">Primary Feed</p>
            <h2 className="panel-title">Activity Feed</h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Recent work grouped by session, tools, and subagent activity.
            </p>
          </div>
          <div className="text-right">
            <div className="metric-value text-[26px]">{itemCount}</div>
            <div className="panel-meta">visible events</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
              className={`filter-chip ${filter === option.key ? 'is-active' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
        {groups.length === 0 ? (
          <div className="empty-state h-full">
            <h3>No live events yet</h3>
            <p>Tool activity, agent work, and session milestones will appear here.</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="status-pill is-neutral">{group.owner}</span>
                  <span className="panel-meta">{group.items.length} events</span>
                </div>
                <span className="panel-meta">{formatClock(group.items[0]?.ts)}</span>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <article key={item.id} className={`activity-item ${toneClass(item.tone)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-medium leading-tight">{item.title}</h3>
                        <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {item.detail}
                        </p>
                      </div>
                      <span className="panel-meta shrink-0">{formatClock(item.ts)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
