import { useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useApp } from '../contexts/AppContext';
import { Badge } from '../components/ui/Badge';

const calcRisk = (rest: number, weather: string, status: string, threat: number) => {
  let score = 0;
  if (rest < 8) score += 3;
  if (weather === 'Marginal') score += 2;
  if (weather === 'Poor') score += 4;
  if (status === 'PMC') score += 2;
  if (status === 'NMC') score += 4;
  score += threat;
  if (score >= 9) return { riskLevel: 'High' as const, mitigation: 'Delay mission, reinforce supervision, apply additional crew.' };
  if (score >= 5) return { riskLevel: 'Medium' as const, mitigation: 'Proceed with mitigation and strict go/no-go gate.' };
  return { riskLevel: 'Low' as const, mitigation: 'Proceed as planned with normal monitoring.' };
};

export const OrmPage = () => {
  const { state, dispatch } = useApp();
  const [form, setForm] = useLocalStorageState('draft-orm-form', { missionType: 'Training Sortie', crewRestHours: 8, weather: 'Good', aircraftStatus: 'FMC', threatLevel: 1 });
  const search = state.globalSearch.trim().toLowerCase();
  const result = calcRisk(form.crewRestHours, form.weather, form.aircraftStatus, form.threatLevel);
  const stats = useMemo(
    () => ({
      high: state.orm.filter((item) => item.riskLevel === 'High').length,
      medium: state.orm.filter((item) => item.riskLevel === 'Medium').length,
      low: state.orm.filter((item) => item.riskLevel === 'Low').length
    }),
    [state.orm]
  );

  const visibleAssessments = useMemo(() => {
    const recent = state.orm.slice(0, 8);
    if (!search) return recent;
    return recent.filter((item) => `${item.missionType} ${item.weather} ${item.aircraftStatus} ${item.riskLevel} ${item.mitigation}`.toLowerCase().includes(search));
  }, [search, state.orm]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Operational Risk Management (ORM)</h2>
      <div className="card grid gap-3 md:grid-cols-2">
        <input className="input" value={form.missionType} onChange={(e) => setForm((p) => ({ ...p, missionType: e.target.value }))} />
        <input className="input" type="number" value={form.crewRestHours} onChange={(e) => setForm((p) => ({ ...p, crewRestHours: Number(e.target.value) }))} />
        <select className="input" value={form.weather} onChange={(e) => setForm((p) => ({ ...p, weather: e.target.value }))}><option>Good</option><option>Marginal</option><option>Poor</option></select>
        <select className="input" value={form.aircraftStatus} onChange={(e) => setForm((p) => ({ ...p, aircraftStatus: e.target.value }))}><option>FMC</option><option>PMC</option><option>NMC</option></select>
        <input className="input" type="number" min={1} max={5} value={form.threatLevel} onChange={(e) => setForm((p) => ({ ...p, threatLevel: Number(e.target.value) }))} />
        <button
          className="rounded-lg bg-sky-700 px-3 py-2 font-semibold text-white"
          onClick={() => {
            dispatch({
              type: 'ADD_ORM',
              payload: {
                id: `ORM${state.orm.length + 1}`,
                missionType: form.missionType,
                crewRestHours: form.crewRestHours,
                weather: form.weather as 'Good' | 'Marginal' | 'Poor',
                aircraftStatus: form.aircraftStatus as 'FMC' | 'PMC' | 'NMC',
                threatLevel: form.threatLevel,
                riskLevel: result.riskLevel,
                mitigation: result.mitigation,
                createdAt: new Date().toISOString()
              }
            });
          }}
        >Save ORM</button>
      </div>
      <div className="card">
        <p className="mb-2">Risk Level: <Badge label={result.riskLevel} tone={result.riskLevel === 'High' ? 'red' : result.riskLevel === 'Medium' ? 'yellow' : 'green'} /></p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Mitigation: {result.mitigation}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">High Risk: <span className="font-bold text-rose-600">{stats.high}</span></div>
        <div className="card">Medium Risk: <span className="font-bold text-amber-600">{stats.medium}</span></div>
        <div className="card">Low Risk: <span className="font-bold text-emerald-600">{stats.low}</span></div>
      </div>

      <div className="card space-y-2">
        <h3 className="font-semibold">Riwayat Assessment Terbaru</h3>
        {visibleAssessments.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-semibold">{item.missionType}</p>
              <Badge label={item.riskLevel} tone={item.riskLevel === 'High' ? 'red' : item.riskLevel === 'Medium' ? 'yellow' : 'green'} />
            </div>
            <p className="text-xs text-slate-500">Weather: {item.weather} • Aircraft: {item.aircraftStatus} • Threat: {item.threatLevel}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Mitigasi: {item.mitigation}</p>
          </div>
        ))}
        {visibleAssessments.length === 0 && <p className="text-sm text-slate-500">Belum ada data ORM yang cocok dengan global search.</p>}
      </div>
    </section>
  );
};
