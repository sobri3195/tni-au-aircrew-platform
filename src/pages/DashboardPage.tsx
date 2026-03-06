import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { daysUntil } from '../utils/date';
import { calculateReadinessAlerts, calculateReadinessComponents } from '../utils/readiness';
import { Badge } from '../components/ui/Badge';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { initialRikkesRecords, calculateRikkesSummary } from '../data/rikkesData';

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
  const [rikkesRecords] = useLocalStorageState('aircrew-rikkes-data-v1', initialRikkesRecords);
  const rikkesSummary = useMemo(() => calculateRikkesSummary(rikkesRecords), [rikkesRecords]);

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

  const readinessBreakdown = useMemo(() => calculateReadinessComponents(state), [state]);

  const readinessAlerts = useMemo(() => calculateReadinessAlerts(state), [state]);

  const pendingIncident = state.incidents.filter((i) => i.status === 'New').length;
  const urgencyList = readinessAlerts.map((alert) => ({
    id: alert.id,
    label: alert.message,
    value: alert.value,
    onClick: () => navigate(alert.route),
    severity: alert.severity
  }));

  const missionState = statusTone(readinessScore);

  const aiCopilot = useMemo(() => {
    const unackedNotam = state.notams.filter((notam) => !notam.acknowledged).length;
    const highRiskOrm = state.orm.filter((item) => item.riskLevel === 'High').length;
    const expiringTrainings = state.trainings.filter((item) => daysUntil(item.expiryDate) < 30).length;
    const nightSorties7d = state.logbook.filter(
      (entry) => entry.dayNight === 'Night' && Date.now() - new Date(entry.date).getTime() <= 1000 * 60 * 60 * 24 * 7
    ).length;

    const riskIndex = Math.min(100, highRiskOrm * 20 + expiringTrainings * 7 + unackedNotam * 5 + nightSorties7d * 2);
    const confidence = Math.max(62, 96 - Math.floor(riskIndex / 3));

    const recommendations = [
      {
        label: `Acknowledge ${unackedNotam} NOTAM prioritas sebelum briefing berikutnya`,
        active: unackedNotam > 0,
        action: () => navigate('/notam')
      },
      {
        label: `Review ${highRiskOrm} ORM high-risk dengan mitigation checklist AI`,
        active: highRiskOrm > 0,
        action: () => navigate('/orm')
      },
      {
        label: `Lock slot training untuk ${expiringTrainings} item yang hampir kedaluwarsa`,
        active: expiringTrainings > 0,
        action: () => navigate('/training')
      }
    ].filter((item) => item.active);

    const narrative =
      riskIndex >= 70
        ? 'AI menandai tren risiko meningkat. Komandan disarankan memprioritaskan kontrol risiko sebelum sortie kompleks.'
        : riskIndex >= 45
          ? 'AI mendeteksi risiko moderat dengan bottleneck pada compliance dan NOTAM acknowledgment.'
          : 'AI menilai posture stabil. Fokuskan optimasi pada efisiensi briefing dan readiness training.';

    return {
      riskIndex,
      confidence,
      narrative,
      recommendations
    };
  }, [state.notams, state.orm, state.trainings, state.logbook, navigate]);

  return (
    <section className="space-y-4">
      <div className="card border-0 bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-600 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Command Center</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Dashboard Readiness</h2>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">Ringkasan kesiapan misi lintas personel, risiko, dan status armada.</p>
          </div>
          <div className={`rounded-xl px-4 py-3 ${missionState.style}`}>
            <p className="text-xs font-semibold uppercase">Mission State</p>
            <p className="text-2xl font-bold">{missionState.label}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Flight Hours (30 days)" value={kpi.hours30} />
        <Card label="Sorties This Week" value={kpi.sortiesWeek} />
        <Card label="Aircraft Availability" value={kpi.aircraftAvailability} />
        <Card label="Medical Validity" value={kpi.medicalValidity} />
        <Card label="Currency Status" value={kpi.currency} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
                  <div>
                  <p>{item.label}</p>
                  <p className="text-xs text-slate-500">{item.note}</p>
                </div>
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
            {urgencyList.length === 0 && <p className="text-sm text-slate-500">Tidak ada alert prioritas tinggi saat ini.</p>}
            {urgencyList.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={item.onClick}
              >
                <span>{item.label}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${item.severity === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : item.severity === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{item.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">AI Mission Copilot</h3>
            <Badge label={`Confidence ${aiCopilot.confidence}%`} tone={aiCopilot.confidence >= 80 ? 'green' : 'yellow'} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{aiCopilot.narrative}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Composite Risk Index</p>
          <p className="text-2xl font-bold">{aiCopilot.riskIndex}/100</p>
          <div className="mt-3 space-y-2">
            {aiCopilot.recommendations.map((item) => (
              <button
                key={item.label}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={item.action}
              >
                <span>{item.label}</span>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Eksekusi</span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold">Rule-based Alerts & Early Warning</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Training expiry &lt;30 hari: {state.trainings.filter((t) => daysUntil(t.expiryDate) < 30).length}</li>
            <li>Rest violation: 2 (mock)</li>
            <li>ORM High Risk: {state.orm.filter((o) => o.riskLevel === 'High').length}</li>
            <li>Incident pending review: {pendingIncident}</li>
            <li>Prediksi overload sortie minggu ini: {state.schedule.filter((item) => item.category === 'Sortie').length > 9 ? 'High' : 'Normal'}</li>
          </ul>
        </div>
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Status Rikkes TNI AU</h3>
            <button onClick={() => navigate('/rikkes')} className="text-sm text-sky-600 hover:text-sky-700">Lihat Detail →</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{rikkesSummary.fitToFly}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Fit to Fly</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{rikkesSummary.fitWithRestriction}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">With Restriction</p>
            </div>
            <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{rikkesSummary.unfit}</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">Unfit</p>
            </div>
            <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{rikkesSummary.expiringSoon}</p>
              <p className="text-xs text-sky-700 dark:text-sky-300">Expiring Soon</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1">Distribusi Kategori Kesehatan</p>
            <div className="flex h-2 rounded-full overflow-hidden">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((kategori) => {
                const count = rikkesSummary[`kategori${kategori}` as keyof typeof rikkesSummary] as number;
                const total = rikkesSummary.totalPemeriksaan || 1;
                const width = (count / total) * 100;
                const colors = {
                  A: 'bg-emerald-500',
                  B: 'bg-sky-500',
                  C: 'bg-amber-500',
                  D: 'bg-orange-500',
                  E: 'bg-rose-500'
                };
                return width > 0 ? (
                  <div key={kategori} className={colors[kategori]} style={{ width: `${width}%` }} title={`Kategori ${kategori}: ${count}`} />
                ) : null;
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Kat A</span>
              <span>Kat B</span>
              <span>Kat C</span>
              <span>Kat D</span>
              <span>Kat E</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2 font-semibold">Audit Log Terbaru</h3>
          <div className="space-y-1">
            {state.auditLogs.slice(0, 5).map((log) => (
              <p className="text-sm" key={log.id}>
                {log.timestamp.slice(0, 16)} - [{log.action}] {log.entity}: {log.detail}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
