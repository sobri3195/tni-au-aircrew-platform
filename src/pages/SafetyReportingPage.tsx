import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';

export const SafetyReportingPage = () => {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Hazard' | 'Near-Miss' | 'Incident'>('Hazard');
  const [anonymous, setAnonymous] = useState(false);

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
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
          onClick={() => {
            if (!title) return;
            dispatch({
              type: 'ADD_INCIDENT',
              payload: {
                id: `I${state.incidents.length + 1}`,
                title,
                type,
                date: new Date().toISOString(),
                status: 'New',
                anonymous
              }
            });
            setTitle('');
          }}
        >
          Submit Report
        </button>
      </div>

      <div className="space-y-2">
        {state.incidents.map((item) => (
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
      </div>
    </section>
  );
};
