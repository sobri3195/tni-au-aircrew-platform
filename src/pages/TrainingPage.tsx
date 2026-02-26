import { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { daysUntil } from '../utils/date';

export const TrainingPage = () => {
  const { state, dispatch } = useApp();
  const [type, setType] = useState('CRM');
  const compliance = useMemo(() => Math.round((state.trainings.filter((t) => daysUntil(t.expiryDate) > 0).length / state.trainings.length) * 100), [state.trainings]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Training & Currency Tracker</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">Compliance: <span className="text-xl font-bold">{compliance}%</span></div>
        <div className="card">Expiring &lt;30 hari: {state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length}</div>
        <button className="rounded-xl bg-sky-700 px-3 py-2 font-semibold text-white" onClick={() => dispatch({ type: 'ADD_TRAINING', payload: { id: `T${state.trainings.length + 1}`, pilotId: 'P001', type, completionDate: new Date().toISOString(), expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(), status: 'Valid' } })}>Add Training</button>
      </div>
      <input className="input max-w-sm" value={type} onChange={(e) => setType(e.target.value)} placeholder="Training type" />
      <Table headers={['Type', 'Pilot', 'Completion', 'Expiry', 'Status']}>
        {state.trainings.map((item) => {
          const days = daysUntil(item.expiryDate);
          return (
            <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
              <td className="px-3 py-2">{item.type}</td>
              <td className="px-3 py-2">{item.pilotId}</td>
              <td className="px-3 py-2">{new Date(item.completionDate).toLocaleDateString('id-ID')}</td>
              <td className="px-3 py-2">{new Date(item.expiryDate).toLocaleDateString('id-ID')}</td>
              <td className="px-3 py-2">{days < 0 ? <Badge label="Expired" tone="red" /> : days < 30 ? <Badge label="Expiring" tone="yellow" /> : <Badge label="Valid" tone="green" />}</td>
            </tr>
          );
        })}
      </Table>
    </section>
  );
};
