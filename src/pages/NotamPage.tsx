import { useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';

export const NotamPage = () => {
  const { state, dispatch } = useApp();
  const [areaFilter, setAreaFilter] = useState('All');
  const [baseFilter, setBaseFilter] = useState('All');

  const areas = useMemo(() => ['All', ...new Set(state.notams.map((item) => item.area))], [state.notams]);
  const bases = useMemo(() => ['All', ...new Set(state.notams.map((item) => item.base))], [state.notams]);

  const filtered = state.notams.filter((item) => (areaFilter === 'All' || item.area === areaFilter) && (baseFilter === 'All' || item.base === baseFilter));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">NOTAM & Airspace Notes</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">List NOTAM dengan filter area/base dan tombol acknowledge.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="input">
          {areas.map((area) => (
            <option key={area} value={area}>
              Area: {area}
            </option>
          ))}
        </select>
        <select value={baseFilter} onChange={(event) => setBaseFilter(event.target.value)} className="input">
          {bases.map((base) => (
            <option key={base} value={base}>
              Base: {base}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="font-semibold">{item.id}</span>
                <span className="text-slate-500">{item.area}</span>
                <span className="text-slate-500">• {item.base}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{item.content}</p>
            </div>
            {item.acknowledged ? (
              <Badge label="Acknowledged" tone="green" />
            ) : (
              <button className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white" onClick={() => dispatch({ type: 'ACK_NOTAM', payload: item.id })}>
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
