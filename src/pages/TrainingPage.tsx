import { useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useApp } from '../contexts/AppContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { daysUntil } from '../utils/date';

const trainingTypes = ['CRM', 'Egress', 'SAR', 'Weapon System', 'Emergency Procedure', 'Flight Physiology', 'NVG Recurrent', 'IFR Check', 'Simulator'];

export const TrainingPage = () => {
  const { state, dispatch } = useApp();
  const { canDoAction } = useRoleAccess();
  const canAddTraining = canDoAction('ADD_TRAINING');
  const [type, setType] = useLocalStorageState('draft-training-type', 'CRM');
  const [selectedPilotId, setSelectedPilotId] = useLocalStorageState('draft-training-pilot', state.profiles[0]?.id ?? 'P001');
  const [missionFocus, setMissionFocus] = useLocalStorageState<'Training' | 'Routine Ops' | 'High-Risk Ops'>('draft-training-focus', state.missionProfile);
  const search = state.globalSearch.trim().toLowerCase();
  const normalizedType = type.trim();
  const validationError = useMemo(() => {
    if (!selectedPilotId) return 'Pilot wajib dipilih.';
    if (!normalizedType) return 'Jenis training wajib diisi.';
    if (normalizedType.length < 3) return 'Jenis training minimal 3 karakter.';
    return '';
  }, [normalizedType, selectedPilotId]);

  const compliance = useMemo(() => {
    if (state.trainings.length === 0) return 0;
    return Math.round((state.trainings.filter((t) => daysUntil(t.expiryDate) > 0).length / state.trainings.length) * 100);
  }, [state.trainings]);

  const forecast = useMemo(() => {
    const days = state.trainings.map((item) => daysUntil(item.expiryDate));
    return {
      d30: days.filter((value) => value >= 0 && value < 30).length,
      d60: days.filter((value) => value >= 30 && value < 60).length,
      d90: days.filter((value) => value >= 60 && value < 90).length,
      expired: days.filter((value) => value < 0).length
    };
  }, [state.trainings]);

  const plannerRows = useMemo(() => state.profiles.map((pilot) => {
    const trainings = state.trainings.filter((item) => item.pilotId === pilot.id);
    const expiringSoon = trainings.filter((item) => daysUntil(item.expiryDate) < 30).length;
    const expired = trainings.filter((item) => daysUntil(item.expiryDate) <= 0).length;
    const recentHours = state.logbook
      .filter((entry) => entry.pilotId === pilot.id && Date.now() - new Date(entry.date).getTime() <= 1000 * 60 * 60 * 24 * 30)
      .reduce((sum, entry) => sum + entry.duration, 0);
    const missionWeight = missionFocus === 'High-Risk Ops' ? 15 : missionFocus === 'Routine Ops' ? 10 : 6;
    const nvgUrgency = daysUntil(pilot.nvgCurrencyUntil) < 21 ? 12 : 0;
    const ifrUrgency = daysUntil(pilot.ifrCurrencyUntil) < 21 ? 12 : 0;
    const lowRecentExposure = recentHours < 10 ? 8 : 0;
    const priorityScore = expiringSoon * 18 + expired * 25 + missionWeight + nvgUrgency + ifrUrgency + lowRecentExposure + (pilot.status !== 'Active' ? 8 : 0);

    const recommendation = expired > 0
      ? 'Lock slot recurrent minggu ini.'
      : expiringSoon > 1
        ? 'Prioritaskan 2 item currency berikutnya.'
        : recentHours < 10
          ? 'Tambahkan simulator / check sortie.'
          : 'Monitor normal.';

    return {
      pilot,
      priorityScore,
      expiringSoon,
      expired,
      recentHours,
      recommendation
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore), [missionFocus, state.logbook, state.profiles, state.trainings]);

  const visibleTrainings = useMemo(() => {
    const sorted = [...state.trainings].sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate));
    if (!search) return sorted;
    return sorted.filter((item) => `${item.type} ${item.pilotId} ${item.status}`.toLowerCase().includes(search));
  }, [search, state.trainings]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Training & Currency Tracker</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">Compliance: <span className="text-xl font-bold">{compliance}%</span></div>
        <div className="card">Expiry 30 hari: <span className="text-xl font-bold text-amber-600">{forecast.d30}</span></div>
        <div className="card">Expiry 60–90 hari: <span className="text-xl font-bold">{forecast.d60 + forecast.d90}</span></div>
        <div className="card">Expired: <span className="text-xl font-bold text-rose-600">{forecast.expired}</span></div>
      </div>

      <div className="card grid gap-3 md:grid-cols-5">
        <select className="input" value={selectedPilotId} onChange={(event) => setSelectedPilotId(event.target.value)}>
          {state.profiles.map((pilot) => (
            <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
          ))}
        </select>
        <select className="input" value={missionFocus} onChange={(event) => setMissionFocus(event.target.value as 'Training' | 'Routine Ops' | 'High-Risk Ops')}>
          <option value="Training">Training focus</option>
          <option value="Routine Ops">Routine Ops focus</option>
          <option value="High-Risk Ops">High-Risk Ops focus</option>
        </select>
        <input className="input" value={type} onChange={(e) => setType(e.target.value)} placeholder="Training type" list="training-types" />
        <datalist id="training-types">
          {trainingTypes.map((item) => <option key={item} value={item} />)}
        </datalist>
        <button
          className="rounded-xl bg-sky-700 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={Boolean(validationError) || !canAddTraining}
          onClick={() => {
            if (!canAddTraining || validationError) return;
            dispatch({
              type: 'ADD_TRAINING',
              payload: {
                id: `T${state.trainings.length + 1}`,
                pilotId: selectedPilotId,
                type: normalizedType,
                completionDate: new Date().toISOString(),
                expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
                status: 'Valid'
              }
            });
            dispatch({ type: 'ADD_AUDIT', payload: { action: 'CREATE', entity: 'AdaptiveTrainingPlan', detail: `${selectedPilotId}:${normalizedType}`, role: state.role } });
            setType('');
          }}
        >
          Add Training
        </button>
      </div>
      {!canAddTraining && <p className="text-sm text-amber-600">Role saat ini hanya bisa melihat data training.</p>}
      {validationError && <p className="text-sm text-rose-600">{validationError}</p>}

      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Adaptive Training Planner</h3>
            <p className="text-sm text-slate-500">Prioritas otomatis berbasis expiry, mission focus, currency, dan exposure 30 hari.</p>
          </div>
          <Badge label={`Mission Focus • ${missionFocus}`} tone={missionFocus === 'High-Risk Ops' ? 'red' : missionFocus === 'Routine Ops' ? 'blue' : 'yellow'} />
        </div>
        <div className="space-y-2">
          {plannerRows.slice(0, 4).map((row) => (
            <div key={row.pilot.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.pilot.name}</p>
                  <p className="text-xs text-slate-500">{row.expiringSoon} expiring • {row.expired} expired • {row.recentHours.toFixed(1)} jam / 30 hari</p>
                </div>
                <Badge label={`Priority ${row.priorityScore}`} tone={row.priorityScore >= 55 ? 'red' : row.priorityScore >= 35 ? 'yellow' : 'green'} />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{row.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      <Table headers={['Type', 'Pilot', 'Completion', 'Expiry', 'Status']}>
        {visibleTrainings.map((item) => {
          const days = daysUntil(item.expiryDate);
          const pilot = state.profiles.find((profile) => profile.id === item.pilotId);
          return (
            <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
              <td className="px-3 py-2">{item.type}</td>
              <td className="px-3 py-2">{pilot?.name ?? item.pilotId}</td>
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
