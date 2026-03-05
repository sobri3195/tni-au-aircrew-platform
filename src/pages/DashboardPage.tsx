import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { daysUntil } from '../utils/date';
import { Badge } from '../components/ui/Badge';

const Card = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="card border-slate-200/80 bg-white/90 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

const statusTone = (score: number) => {
  if (score >= 80) return { label: 'GREEN', tone: 'green' as const, style: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' };
  if (score >= 60) return { label: 'AMBER', tone: 'yellow' as const, style: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
  return { label: 'RED', tone: 'red' as const, style: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' };
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { state, readinessScore } = useApp();

  const kpi = useMemo(() => {
    const hours30 = state.logbook
      .filter((e) => Date.now() - new Date(e.date).getTime() <= 1000 * 60 * 60 * 24 * 30)
      .reduce((sum, e) => sum + e.duration, 0)
      .toFixed(1);
    const sortiesWeek = state.logbook.filter((e) => Date.now() - new Date(e.date).getTime() <= 1000 * 60 * 60 * 24 * 7).length;
    const aircraftAvailability = '78%';
    const medicalValidity = `${state.profiles.filter((p) => p.status === 'Active').length}/${state.profiles.length}`;
    const currency = `${state.profiles.filter((p) => daysUntil(p.ifrCurrencyUntil) > 0).length}/${state.profiles.length}`;
    return { hours30, sortiesWeek, aircraftAvailability, medicalValidity, currency };
  }, [state.logbook, state.profiles]);

  const readinessBreakdown = useMemo(() => {
    const profileCount = Math.max(state.profiles.length, 1);
    const medical = Math.round((state.profiles.filter((p) => p.status === 'Active').length / profileCount) * 100);
    const training = Math.max(20, 100 - state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length * 12);
    const risk = Math.max(20, 100 - state.orm.filter((item) => item.riskLevel === 'High').length * 20);
    const safety = Math.max(20, 100 - state.incidents.filter((i) => i.status === 'New').length * 10);
    const availability = 78;
    return [
      { label: 'Medical', score: medical },
      { label: 'Training', score: training },
      { label: 'Operational Risk', score: risk },
      { label: 'Safety Posture', score: safety },
      { label: 'Fleet Availability', score: availability }
    ];
  }, [state.profiles, state.trainings, state.orm, state.incidents]);

  const pendingIncident = state.incidents.filter((i) => i.status === 'New').length;
  const urgencyList = [
    {
      id: 'urgent-training',
      label: 'Training expiry < 30 hari',
      value: state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length,
      onClick: () => navigate('/training')
    },
    { id: 'urgent-orm', label: 'ORM high risk', value: state.orm.filter((o) => o.riskLevel === 'High').length, onClick: () => navigate('/orm') },
    { id: 'urgent-incident', label: 'Incident pending review', value: pendingIncident, onClick: () => navigate('/safety') }
  ];

  const missionState = statusTone(readinessScore);

  return (
    <section className="space-y-4">
      <div className="card border-0 bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-600 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Command Center</p>
            <h2 className="mt-1 text-2xl font-bold">Dashboard Readiness</h2>
            <p className="mt-2 text-sm text-cyan-50">Ringkasan kesiapan misi lintas personel, risiko, dan status armada.</p>
          </div>
          <div className={`rounded-xl px-4 py-3 ${missionState.style}`}>
            <p className="text-xs font-semibold uppercase">Mission State</p>
            <p className="text-2xl font-bold">{missionState.label}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Card label="Flight Hours (30 days)" value={kpi.hours30} />
        <Card label="Sorties This Week" value={kpi.sortiesWeek} />
        <Card label="Aircraft Availability" value={kpi.aircraftAvailability} />
        <Card label="Medical Validity" value={kpi.medicalValidity} />
        <Card label="Currency Status" value={kpi.currency} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Unified Readiness Score</p>
              <p className="text-3xl font-bold">{readinessScore}/100</p>
            </div>
            <Badge label={readinessScore > 75 ? 'MISSION READY' : readinessScore > 55 ? 'CAUTION' : 'LIMITED'} tone={missionState.tone} />
          </div>
          <div className="space-y-3">
            {readinessBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <p>{item.label}</p>
                  <p className="font-semibold">{item.score}%</p>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-2 rounded-full transition-all ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Priority Actions</h3>
          <div className="space-y-2">
            {urgencyList.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={item.onClick}
              >
                <span>{item.label}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">{item.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 font-semibold">Rule-based Alerts</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Training expiry &lt;30 hari: {state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length}</li>
            <li>Rest violation: 2 (mock)</li>
            <li>ORM High Risk: {state.orm.filter((o) => o.riskLevel === 'High').length}</li>
            <li>Incident pending review: {pendingIncident}</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold">Audit Log Terbaru</h3>
          {state.auditLogs.slice(0, 5).map((log) => (
            <p className="text-sm" key={log.id}>
              {log.timestamp.slice(0, 16)} - [{log.action}] {log.entity}: {log.detail}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};
