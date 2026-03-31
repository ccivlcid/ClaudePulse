import { useState } from 'react';
import { usePulseStore } from '../stores/pulseStore.js';
import { buildActivityGroups, formatClock } from '../lib/dashboard.js';
import { translations } from '../lib/translations.js';

const FILTERS = ['all', 'errors', 'tools', 'agents'] as const;
type FilterKey = (typeof FILTERS)[number];

interface ActivityStreamProps {
  onPopout?: () => void;
}

export default function ActivityStream({ onPopout }: ActivityStreamProps) {
  const events = usePulseStore((state) => state.events);
  const language = usePulseStore((state) => state.language);
  const t = translations[language];
  const [filter, setFilter] = useState<FilterKey>('all');
  const groups = buildActivityGroups(events, filter);

  const filterLabels: Record<FilterKey, string> = {
    all: t.FILTER_ALL,
    errors: t.FILTER_ERRORS,
    tools: t.FILTER_TOOLS,
    agents: t.FILTER_AGENTS,
  };

  return (
    <div className="cli-pane">
      <div className="cli-pane-header">
        <span className="cli-pane-title">{t.ACTIVITY_STREAM}</span>
        <div className="flex gap-2 items-center">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`cli-btn !px-4 !py-1 ${filter === f ? 'active' : ''}`}
            >
              {filterLabels[f]}
            </button>
          ))}
          {onPopout && (
            <button onClick={onPopout} className="cli-btn !px-3 !py-1 ml-2" title="Popout">
              <span className="text-[14px] font-bold">↗</span>
            </button>
          )}
        </div>
      </div>

      <div className="cli-pane-content p-0 bg-[var(--bg)]">
        {groups.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--text-faint)] italic text-[15px] font-medium tracking-widest uppercase">
            {t.WAITING_FOR_STREAM}
          </div>
        ) : (
          <div className="space-y-10 p-8">
            {groups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-2 h-2 bg-[var(--neon-green)] rounded-full"></div>
                  <span className="text-[var(--fg)] font-bold tracking-wider uppercase text-[13px]">{group.owner}</span>
                  <div className="flex-1 h-px bg-[var(--border)]"></div>
                  <span className="text-[var(--text-muted)] font-medium mono text-[12px]">[{formatClock(group.items[0]?.ts)}]</span>
                </div>
                
                <div className="pl-5 space-y-3 border-l-2 border-[var(--border)] ml-1">
                  {group.items.map((item) => {
                    const isError = item.tone === 'error';
                    return (
                      <div key={item.id} className="flex gap-8 group hover:bg-[var(--surface)] px-3 py-2 rounded-md transition-colors">
                        <span className="text-[var(--text-muted)] shrink-0 w-16 font-medium text-[12px] mono">
                          {formatClock(item.ts)}
                        </span>
                        <span className={`shrink-0 w-24 text-[12px] font-bold tracking-wide ${isError ? 'text-[var(--neon-red)]' : 'text-[var(--neon-cyan)]'}`}>
                          [{item.kind.toUpperCase()}]
                        </span>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <span className={`font-bold ${isError ? 'text-[var(--neon-red)]' : 'text-[var(--fg)]'} text-[14px] leading-snug`}>
                            {item.title}
                          </span>
                          <span className="text-[var(--text-muted)] font-medium break-all text-[13px] leading-relaxed opacity-90 group-hover:opacity-100">
                            {item.detail}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
