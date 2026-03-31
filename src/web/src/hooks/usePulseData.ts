import { useEffect, useRef, useCallback } from 'react';
import { usePulseStore, type PulseEvent } from '../stores/pulseStore.js';

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

    // Step 1: Fetch all events via REST (reliable, complete)
    fetch(`${API_BASE}/api/sessions/${activeSessionId}/events`)
      .then(r => r.json())
      .then((events: PulseEvent[]) => {
        // Guard against stale response
        if (sessionRef.current !== activeSessionId) return;
        setEvents(events);
      })
      .catch(() => {
        if (sessionRef.current === activeSessionId) setEvents([]);
      });

    // Step 2: Connect SSE for live updates only
    const es = new EventSource(`${API_BASE}/api/sse?sessionId=${activeSessionId}`);
    esRef.current = es;
    let sseReady = false;

    es.addEventListener('heartbeat', () => {
      // First heartbeat means initial batch is done — switch to live mode
      sseReady = true;
    });

    es.addEventListener('pulse-event', (e) => {
      if (!sseReady) return; // Skip initial batch (we already loaded via REST)
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
  const activeSessionId = usePulseStore((s) => s.activeSessionId);

  const fetchSessions = useCallback(() => {
    const project = getProjectFilter();
    const projectParam = project ? `?project=${encodeURIComponent(project)}` : '';

    fetch(`${API_BASE}/api/sessions${projectParam}`)
      .then(r => r.json())
      .then(sessions => setSessions(sessions))
      .catch(() => {});
  }, [setSessions]);

  useEffect(() => {
    const project = getProjectFilter();
    const projectParam = project ? `?project=${encodeURIComponent(project)}` : '';

    // Only set active session on first load (don't override user's selection)
    if (!activeSessionId) {
      fetch(`${API_BASE}/api/sessions/active${projectParam}`)
        .then(r => r.json())
        .then(active => {
          if (active?.id) setActiveSessionId(active.id);
        })
        .catch(() => {});
    }

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions, setActiveSessionId, activeSessionId]);
}
