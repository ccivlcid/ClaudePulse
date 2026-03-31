import { create } from 'zustand';

export interface PulseEvent {
  id: string;
  ts: string;
  sessionId: string;
  projectDir: string;
  type: string;
  toolName?: string;
  toolUseId?: string;
  toolInput?: Record<string, unknown>;
  filePath?: string;
  toolResponse?: { stdout?: string; stderr?: string; interrupted?: boolean };
  message?: string;
  agentId?: string;
  agentType?: string;
  lastAgentMessage?: string;
}

export interface SessionEntry {
  id: string;
  project: string;
  startedAt: string;
  endedAt: string | null;
  toolCount: number;
  agentCount: number;
  errorCount: number;
}

type Theme = 'dark' | 'light';
type Language = 'en' | 'ko';

interface PulseState {
  events: PulseEvent[];
  sessions: SessionEntry[];
  activeSessionId: string | null;
  connected: boolean;
  theme: Theme;
  language: Language;
  addEvent: (event: PulseEvent) => void;
  setEvents: (events: PulseEvent[]) => void;
  setSessions: (sessions: SessionEntry[]) => void;
  setActiveSessionId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
}

const savedTheme = (typeof localStorage !== 'undefined'
  ? localStorage.getItem('pulse-theme') as Theme | null
  : null) ?? 'dark';

const savedLanguage = (typeof localStorage !== 'undefined'
  ? localStorage.getItem('pulse-lang') as Language | null
  : null) ?? 'en';

export const usePulseStore = create<PulseState>((set) => ({
  events: [],
  sessions: [],
  activeSessionId: null,
  connected: false,
  theme: savedTheme,
  language: savedLanguage,
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  setEvents: (events) => set({ events }),
  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setConnected: (connected) => set({ connected }),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pulse-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
  toggleLanguage: () => set((state) => {
    const next = state.language === 'en' ? 'ko' : 'en';
    localStorage.setItem('pulse-lang', next);
    return { language: next };
  }),
}));
