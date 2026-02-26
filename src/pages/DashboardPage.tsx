import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { daysUntil } from '../utils/date';
import { Badge } from '../components/ui/Badge';

const Card = ({ label, value }: { label: string; value: string | number }) => (
  <div className="card">
    <p className="text-xs uppercase text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

export const DashboardPage = () => {
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

  const pendingIncident = state.incidents.filter((i) => i.status === 'New').length;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Dashboard Readiness</h2>
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Card label="Flight Hours (30 days)" value={kpi.hours30} />
        <Card label="Sorties This Week" value={kpi.sortiesWeek} />
        <Card label="Aircraft Availability" value={kpi.aircraftAvailability} />
        <Card label="Medical Validity" value={kpi.medicalValidity} />
        <Card label="Currency Status" value={kpi.currency} />
      </div>
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Readiness Score</p>
          <p className="text-3xl font-bold">{readinessScore}/100</p>
        </div>
        <Badge label={readinessScore > 75 ? 'MISSION READY' : readinessScore > 55 ? 'CAUTION' : 'LIMITED'} tone={readinessScore > 75 ? 'green' : readinessScore > 55 ? 'yellow' : 'red'} />
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
            <p className="text-sm" key={log.id}>{log.timestamp.slice(0, 16)} - [{log.action}] {log.entity}: {log.detail}</p>
          ))}
        </div>
      </div>
    </section>
  );
};
