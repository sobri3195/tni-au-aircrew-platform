import { useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { useRoleAccess } from '../hooks/useRoleAccess';

export const SafetyReportingPage = () => {
  const { state, dispatch } = useApp();
  const { canDoAction } = useRoleAccess();
  const canAddIncident = canDoAction('ADD_INCIDENT');
  const search = state.globalSearch.trim().toLowerCase();
  const [title, setTitle] = useLocalStorageState('draft-safety-title', '');
  const [type, setType] = useLocalStorageState<'Hazard' | 'Near-Miss' | 'Incident'>('draft-safety-type', 'Hazard');
  const [anonymous, setAnonymous] = useLocalStorageState('draft-safety-anonymous', false);

  const trimmedTitle = title.trim();
  const validationError = useMemo(() => {
    if (!trimmedTitle) return 'Judul laporan wajib diisi.';
    if (trimmedTitle.length < 6) return 'Judul laporan minimal 6 karakter.';
    return '';
  }, [trimmedTitle]);

  const visibleIncidents = state.incidents.filter((item) => {
    if (!search) return true;
    return `${item.title} ${item.type} ${item.status}`.toLowerCase().includes(search);
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Flight Safety Reporting</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Laporan hazard/near-miss/incident termasuk anonymous option.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        <input className="input md:col-span-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul laporan" />
        <select className="input" value={type} onChange={(event) => setType(event.target.value as 'Hazard' | 'Near-Miss' | 'Incident')}>
          <option value="Hazard">Hazard</option>
          <option value="Near-Miss">Near-Miss</option>
          <option value="Incident">Incident</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
          Anonymous
        </label>
        <button
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={Boolean(validationError) || !canAddIncident}
          onClick={() => {
            if (!canAddIncident || validationError) return;
            dispatch({
              type: 'ADD_INCIDENT',
              payload: {
                id: `I${state.incidents.length + 1}`,
                title: trimmedTitle,
                type,
                date: new Date().toISOString(),
                status: 'New',
                anonymous
              }
            });
            setTitle('');
            setAnonymous(false);
          }}
        >
          Submit Report
        </button>
      </div>
      {!canAddIncident && <p className="text-sm text-amber-600">Role saat ini hanya bisa melihat incident.</p>}
      {validationError && <p className="text-sm text-rose-600">{validationError}</p>}

      <div className="space-y-2">
        {visibleIncidents.map((item) => (
          <div key={item.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-slate-500">{new Date(item.date).toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={item.type} tone={item.type === 'Incident' ? 'red' : item.type === 'Near-Miss' ? 'yellow' : 'blue'} />
              <Badge label={item.status} tone={item.status === 'New' ? 'yellow' : 'green'} />
              {item.anonymous && <Badge label="Anonymous" tone="slate" />}
            </div>
          </div>
        ))}
        {visibleIncidents.length === 0 && <div className="card text-sm text-slate-500">Tidak ada safety report yang sesuai global search.</div>}
      </div>
    </section>
  );
};
