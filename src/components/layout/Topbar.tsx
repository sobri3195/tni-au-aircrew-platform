import type { Role } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { daysUntil } from '../../utils/date';

const roles: Role[] = ['Pilot', 'Flight Safety Officer', 'Ops Officer', 'Medical', 'Commander/Admin'];

export const Topbar = () => {
  const { state, dispatch } = useApp();
  const notifCount =
    state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length +
    state.orm.filter((o) => o.riskLevel === 'High').length +
    state.incidents.filter((i) => i.status === 'New').length +
    2;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <input
        className="input max-w-md"
        value={state.globalSearch}
        onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
        placeholder="Global Search (Ctrl/Cmd+K)"
      />
      <select className="input w-48" value={state.role} onChange={(e) => dispatch({ type: 'SET_ROLE', payload: e.target.value as Role })}>
        {roles.map((role) => <option key={role}>{role}</option>)}
      </select>
      <button className="btn" onClick={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' })}>
        Theme: {state.theme}
      </button>
      <div className="ml-auto text-sm text-slate-500">Notifications: {notifCount}</div>
    </header>
  );
};
