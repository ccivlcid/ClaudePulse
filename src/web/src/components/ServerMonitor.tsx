import { useState, useEffect } from 'react';

interface ServerLog {
  ts: string;
  level: string;
  source: string;
  text: string;
}

const API_BASE = window.location.origin;

export default function ServerMonitor() {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const activeRes = await fetch(`${API_BASE}/api/sessions/active`);
        if (!activeRes.ok) { setLoading(false); return; }
        const active = await activeRes.json();

        const logsRes = await fetch(`${API_BASE}/api/sessions/${active.id}/server-logs?lines=50`);
        const data = await logsRes.json();
        setLogs(data);
      } catch { /* ignore */ }
      setLoading(false);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card h-[360px] flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Server</h2>
        <span className="text-[12px] nums" style={{ color: 'var(--text-faint)' }}>{logs.length} lines</span>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-[11px]">
        {loading ? (
          <p className="text-[13px] pt-8 text-center font-sans" style={{ color: 'var(--text-faint)' }}>Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-[13px] pt-8 text-center font-sans" style={{ color: 'var(--text-faint)' }}>
            No server running
          </p>
        ) : (
          <table className="w-full">
            <tbody>
              {logs.map((log, i) => {
                const time = new Date(log.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const isError = log.level === 'error';
                const isWarn = log.level === 'warn';
                return (
                  <tr key={i}>
                    <td className="py-[2px] pr-2 nums whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>{time}</td>
                    {(isError || isWarn) && (
                      <td className="py-[2px] pr-2 whitespace-nowrap" style={{ color: isError ? 'var(--red)' : 'var(--accent)' }}>
                        {isError ? 'ERR' : 'WRN'}
                      </td>
                    )}
                    <td
                      className="py-[2px]"
                      style={{ color: isError ? 'var(--red)' : isWarn ? 'var(--accent)' : 'var(--text-muted)' }}
                      colSpan={isError || isWarn ? 1 : 2}
                    >
                      {log.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
