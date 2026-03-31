import { formatClock, type AlertItem } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';
import { translations } from '../lib/translations.js';

interface AlertCenterProps {
  alerts: AlertItem[];
  onPopout?: () => void;
}

export default function AlertCenter({ alerts, onPopout }: AlertCenterProps) {
  const language = usePulseStore((state) => state.language);
  const t = translations[language];
  const critical = alerts.filter(a => a.severity === 'ERROR').length;

  return (
    <div className="cli-pane">
      <div className="cli-pane-header">
        <span className="cli-pane-title">{t.ALERT_CENTER}</span>
        <div className="flex items-center gap-3">
          <span className={`${critical > 0 ? 'text-[var(--neon-red)] font-bold' : 'text-[var(--text-muted)] font-semibold'} text-[12px] uppercase tracking-wider`}>
            {critical} {t.CRITICAL}
          </span>
          {onPopout && <button onClick={onPopout} className="cli-btn !px-3 !py-1" title="Popout"><span className="text-[14px] font-bold">↗</span></button>}
        </div>
      </div>

      <div className="cli-pane-content font-mono bg-[var(--bg)] p-8">
        {alerts.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-40">
            <span className="text-[14px] font-bold text-[var(--text-faint)] uppercase tracking-[0.2em]">{t.ZERO_ANOMALIES}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {alerts.map((alert) => (
              <div key={alert.id} className="group border-b border-[var(--border)] pb-5 last:border-0">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm leading-none ${
                      alert.severity === 'ERROR' ? 'bg-[var(--neon-red)]/20 text-[var(--neon-red)] border border-[var(--neon-red)]/30' : 'bg-[var(--neon-amber)]/20 text-[var(--neon-amber)] border border-[var(--neon-amber)]/30'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[var(--fg)] font-bold text-[14px] leading-tight tracking-tight">{alert.title}</span>
                  </div>
                  <span className="text-[var(--text-faint)] font-medium text-[11px] mono uppercase">{formatClock(alert.ts)}</span>
                </div>
                <div className="text-[var(--text-muted)] text-[13px] pl-1 font-medium leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
