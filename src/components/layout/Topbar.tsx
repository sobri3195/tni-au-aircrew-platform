import { useEffect, useMemo, useState } from 'react';
import type { Role } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { daysUntil } from '../../utils/date';

type TopbarProps = {
  onMenuToggle: () => void;
};

const roles: Role[] = ['Pilot', 'Flight Safety Officer', 'Ops Officer', 'Medical', 'Commander/Admin'];

export const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const { state, dispatch } = useApp();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const notifCount =
    state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length +
    state.orm.filter((o) => o.riskLevel === 'High').length +
    state.incidents.filter((i) => i.status === 'New').length +
    state.notams.filter((n) => !n.acknowledged).length;

  const readinessTone = notifCount >= 10 ? 'text-rose-700 bg-rose-100 dark:text-rose-200 dark:bg-rose-900/40' : notifCount >= 5 ? 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40' : 'text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/40';

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const localTime = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(currentTime),
    [currentTime]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 p-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <button className="btn lg:hidden" onClick={onMenuToggle} aria-label="Buka menu navigasi">
          ☰ Menu
        </button>

        <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1">
          <input
            id="global-search-input"
            className="input lg:max-w-md"
            value={state.globalSearch}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            placeholder="Global Search (Ctrl/Cmd+K)"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {localTime}
        </div>

        <select className="input w-full sm:w-52 lg:w-48" value={state.role} onChange={(e) => dispatch({ type: 'SET_ROLE', payload: e.target.value as Role })}>
          {roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>

        <button className="btn" onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}>
          {state.theme === 'dark' ? '☾ Dark' : '☀ Light'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden rounded-lg bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700 lg:block dark:bg-cyan-900/50 dark:text-cyan-200">
            Hardware Gateway Connected • Semua Modul
          </div>
          <div className={`hidden rounded-lg px-2 py-1 text-xs font-semibold lg:block ${readinessTone}`}>Readiness Online</div>
          <div className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">Alerts: {notifCount}</div>
        </div>
      </div>
    </header>
  );
};
