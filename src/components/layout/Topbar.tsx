import { useMemo } from 'react';
import type { Role } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { daysUntil } from '../../utils/date';

type TopbarProps = {
  onMenuToggle: () => void;
};

const roles: Role[] = ['Pilot', 'Flight Safety Officer', 'Ops Officer', 'Medical', 'Commander/Admin'];

export const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const { state, dispatch } = useApp();
  const notifCount =
    state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length +
    state.orm.filter((o) => o.riskLevel === 'High').length +
    state.incidents.filter((i) => i.status === 'New').length +
    2;

  const localTime = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date()),
    []
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 p-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <button className="btn md:hidden" onClick={onMenuToggle} aria-label="Buka menu navigasi">
          ☰ Menu
        </button>
        <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
          <input
            className="input md:max-w-md"
            value={state.globalSearch}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
            placeholder="Global Search (Ctrl/Cmd+K)"
          />
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {localTime}
        </div>
        <select className="input w-full sm:w-52 md:w-48" value={state.role} onChange={(e) => dispatch({ type: 'SET_ROLE', payload: e.target.value as Role })}>
          {roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <button className="btn" onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}>
          {state.theme === 'dark' ? '☾ Dark' : '☀ Light'}
        </button>
        <div className="md:ml-auto">
          <div className="rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">Alerts: {notifCount}</div>
        </div>
      </div>
    </header>
  );
};
