import { useEffect, useRef } from 'react';
import { usePulseStore, type PulseEvent, type SessionEntry } from '../stores/pulseStore.js';

const API_BASE = window.location.origin;

function getProjectFilter(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('project');
}

export function usePulseSSE() {
  const activeSessionId = usePulseStore((s) => s.activeSessionId);
  const setEvents = usePulseStore((s) => s.setEvents);
  const addEvent = usePulseStore((s) => s.addEvent);
  const setConnected = usePulseStore((s) => s.setConnected);
  const esRef = useRef<EventSource | null>(null);
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeSessionId) {
      setEvents([]);
      return;
    }

    sessionRef.current = activeSessionId;

    // Step 1: Fetch all events via REST
    fetch(`${API_BASE}/api/sessions/${activeSessionId}/events`)
      .then(r => r.json())
      .then((events: PulseEvent[]) => {
        if (sessionRef.current !== activeSessionId) return;
        setEvents(events);
      })
      .catch(() => {
        if (sessionRef.current === activeSessionId) setEvents([]);
      });

    // Step 2: SSE for live updates only
    const es = new EventSource(`${API_BASE}/api/sse?sessionId=${activeSessionId}`);
    esRef.current = es;
    let sseReady = false;

    es.addEventListener('heartbeat', () => {
      sseReady = true;
    });

    es.addEventListener('pulse-event', (e) => {
      if (!sseReady) return;
      if (sessionRef.current !== activeSessionId) return;
      try {
        const event = JSON.parse(e.data) as PulseEvent;
        addEvent(event);
      } catch { /* skip */ }
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setConnected(false);
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [activeSessionId, setEvents, addEvent, setConnected]);
}

export function useSessions() {
  const setSessions = usePulseStore((s) => s.setSessions);
  const setActiveSessionId = usePulseStore((s) => s.setActiveSessionId);
  const lastSessionsRef = useRef<string>('');
  const initializedRef = useRef(false);

  useEffect(() => {
    const project = getProjectFilter();
    const projectParam = project ? `?project=${encodeURIComponent(project)}` : '';

    const fetchSessions = () => {
      fetch(`${API_BASE}/api/sessions${projectParam}`)
        .then(r => r.json())
        .then((sessions: SessionEntry[]) => {
          // Only update state if data actually changed (prevent unnecessary re-renders)
          const key = JSON.stringify(sessions.map(s => s.id + s.toolCount + s.agentCount + s.errorCount + (s.endedAt ?? '')));
          if (key === lastSessionsRef.current) return;
          lastSessionsRef.current = key;
          setSessions(sessions);
        })
        .catch(() => {});
    };

    // Set active session only on first load
    if (!initializedRef.current) {
      initializedRef.current = true;
      // URL sessionId param takes priority (used by popout windows)
      const urlSessionId = new URLSearchParams(window.location.search).get('sessionId');
      if (urlSessionId) {
        setActiveSessionId(urlSessionId);
      } else {
        fetch(`${API_BASE}/api/sessions/active${projectParam}`)
          .then(r => r.json())
          .then(active => {
            if (active?.id) setActiveSessionId(active.id);
          })
          .catch(() => {});
      }
    }

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [setSessions, setActiveSessionId]);
}
