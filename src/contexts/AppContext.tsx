import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { initialState } from '../data/mockData';
import type { AppState, AuditLogEntry, Incident, LogbookEntry, OrmAssessment, Role, ScheduleItem, Theme, TrainingItem } from '../types';
import { daysUntil } from '../utils/date';

type Action =
  | { type: 'LOGIN'; payload: Role }
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'ADD_LOGBOOK'; payload: LogbookEntry }
  | { type: 'ADD_SCHEDULE'; payload: ScheduleItem }
  | { type: 'ADD_ORM'; payload: OrmAssessment }
  | { type: 'ADD_TRAINING'; payload: TrainingItem }
  | { type: 'ADD_INCIDENT'; payload: Incident }
  | { type: 'ADD_AUDIT'; payload: Omit<AuditLogEntry, 'id' | 'timestamp'> }
  | { type: 'ACK_NOTAM'; payload: string };

const STORAGE_KEY = 'tni-au-aircrew-state';

const readState = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialState;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return initialState;
  }
};

const pushAudit = (state: AppState, payload: Omit<AuditLogEntry, 'id' | 'timestamp'>): AppState => ({
  ...state,
  auditLogs: [
    {
      ...payload,
      id: `A${state.auditLogs.length + 1}`,
      timestamp: new Date().toISOString()
    },
    ...state.auditLogs
  ]
});

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, role: action.payload, loggedIn: true };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SEARCH':
      return { ...state, globalSearch: action.payload };
    case 'ADD_LOGBOOK':
      return pushAudit({ ...state, logbook: [action.payload, ...state.logbook] }, { action: 'CREATE', entity: 'Logbook', detail: action.payload.id, role: state.role });
    case 'ADD_SCHEDULE':
      return pushAudit({ ...state, schedule: [action.payload, ...state.schedule] }, { action: 'CREATE', entity: 'Schedule', detail: action.payload.title, role: state.role });
    case 'ADD_ORM':
      return pushAudit({ ...state, orm: [action.payload, ...state.orm] }, { action: 'CREATE', entity: 'ORM', detail: action.payload.riskLevel, role: state.role });
    case 'ADD_TRAINING':
      return pushAudit({ ...state, trainings: [action.payload, ...state.trainings] }, { action: 'CREATE', entity: 'Training', detail: action.payload.type, role: state.role });
    case 'ADD_INCIDENT':
      return pushAudit({ ...state, incidents: [action.payload, ...state.incidents] }, { action: 'CREATE', entity: 'Incident', detail: action.payload.type, role: state.role });
    case 'ADD_AUDIT':
      return pushAudit(state, action.payload);
    case 'ACK_NOTAM':
      return pushAudit(
        {
          ...state,
          notams: state.notams.map((item) => (item.id === action.payload ? { ...item, acknowledged: true } : item))
        },
        { action: 'UPDATE', entity: 'NOTAM', detail: action.payload, role: state.role }
      );
    default:
      return state;
  }
};

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action>; readinessScore: number } | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState, readState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state]);

  const readinessScore = useMemo(() => {
    const last30 = state.logbook.filter((e) => Date.now() - new Date(e.date).getTime() < 1000 * 60 * 60 * 24 * 30).reduce((s, e) => s + e.duration, 0);
    const expiringTraining = state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length;
    const openIncident = state.incidents.filter((i) => i.status === 'New').length;
    const baseScore = Math.min(100, Math.round(last30 * 1.3));
    return Math.max(20, baseScore - expiringTraining * 4 - openIncident * 3);
  }, [state.logbook, state.trainings, state.incidents]);

  return <AppContext.Provider value={{ state, dispatch, readinessScore }}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
