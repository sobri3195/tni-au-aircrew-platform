import { useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useApp } from '../contexts/AppContext';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { daysUntil } from '../utils/date';

export const TrainingPage = () => {
  const { state, dispatch } = useApp();
  const [type, setType] = useLocalStorageState('draft-training-type', 'CRM');
  const search = state.globalSearch.trim().toLowerCase();
  const normalizedType = type.trim();
  const validationError = useMemo(() => {
    if (!normalizedType) return 'Jenis training wajib diisi.';
    if (normalizedType.length < 3) return 'Jenis training minimal 3 karakter.';
    return '';
  }, [normalizedType]);

  const compliance = useMemo(() => {
    if (state.trainings.length === 0) return 0;
    return Math.round((state.trainings.filter((t) => daysUntil(t.expiryDate) > 0).length / state.trainings.length) * 100);
  }, [state.trainings]);

  const visibleTrainings = useMemo(() => {
    const sorted = [...state.trainings].sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate));
    if (!search) return sorted;
    return sorted.filter((item) => `${item.type} ${item.pilotId} ${item.status}`.toLowerCase().includes(search));
  }, [search, state.trainings]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Training & Currency Tracker</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">Compliance: <span className="text-xl font-bold">{compliance}%</span></div>
        <div className="card">Expiring &lt;30 hari: {state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length}</div>
        <button
          className="rounded-xl bg-sky-700 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={Boolean(validationError)}
          onClick={() => {
            if (validationError) return;
            dispatch({
              type: 'ADD_TRAINING',
              payload: {
                id: `T${state.trainings.length + 1}`,
                pilotId: 'P001',
                type: normalizedType,
                completionDate: new Date().toISOString(),
                expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
                status: 'Valid'
              }
            });
            setType('');
          }}
        >
          Add Training
        </button>
      </div>
      <input className="input max-w-sm" value={type} onChange={(e) => setType(e.target.value)} placeholder="Training type" />
      {validationError && <p className="text-sm text-rose-600">{validationError}</p>}
      <Table headers={['Type', 'Pilot', 'Completion', 'Expiry', 'Status']}>
        {visibleTrainings.map((item) => {
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
        {visibleTrainings.length === 0 && (
          <tr>
            <td className="px-3 py-5 text-center text-sm text-slate-500" colSpan={5}>
              Tidak ada data training yang sesuai dengan global search.
            </td>
          </tr>
        )}
      </Table>
    </section>
  );
};
