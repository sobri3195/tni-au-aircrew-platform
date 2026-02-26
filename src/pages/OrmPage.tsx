import { useState } from 'react';
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
  const [form, setForm] = useState({ missionType: 'Training Sortie', crewRestHours: 8, weather: 'Good', aircraftStatus: 'FMC', threatLevel: 1 });
  const result = calcRisk(form.crewRestHours, form.weather, form.aircraftStatus, form.threatLevel);

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
    </section>
  );
};
