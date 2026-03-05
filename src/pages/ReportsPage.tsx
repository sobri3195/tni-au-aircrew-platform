import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { exportCsv, exportSimplePdf } from '../utils/export';
import { calculateReadinessAlerts, calculateReadinessComponents, calculateReadinessScore } from '../utils/readiness';

export const ReportsPage = () => {
  const { state } = useApp();

  const monthly = useMemo(
    () => Array.from({ length: 6 }).map((_, i) => ({ month: `M-${i + 1}`, hours: state.logbook.slice(i * 5, i * 5 + 5).reduce((a, b) => a + b.duration, 0) })),
    [state.logbook]
  );

  const readinessComponents = useMemo(() => calculateReadinessComponents(state), [state]);
  const readinessAlerts = useMemo(() => calculateReadinessAlerts(state), [state]);
  const readinessScore = useMemo(() => calculateReadinessScore(state), [state]);

  const exportReadinessCsv = () => {
    const rows = readinessComponents.map((item) => ({
      component: item.label,
      score: item.score,
      weight: item.weight,
      note: item.note,
      generatedAt: new Date().toISOString()
    }));
    exportCsv('readiness-breakdown.csv', rows);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Reports & Analytics</h2>

      <div className="card">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Unified Readiness Snapshot</p>
            <p className="text-3xl font-bold">{readinessScore}/100</p>
          </div>
          <p className="text-sm text-slate-500">Alert aktif: {readinessAlerts.length}</p>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {readinessComponents.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-semibold">{item.score}%</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 font-semibold">Mock Chart Jam Terbang / Bulan</h3>
        <div className="space-y-2">
          {monthly.map((m) => (
            <div key={m.month} className="flex items-center gap-2 text-sm">
              <span className="w-16">{m.month}</span>
              <div className="h-3 rounded bg-sky-600" style={{ width: `${m.hours * 10}px` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => exportCsv('logbook.csv', state.logbook.slice(0, 20))}>Export CSV</button>
        <button className="btn" onClick={exportReadinessCsv}>Export Readiness CSV</button>
        <button
          className="btn"
          onClick={() =>
            exportSimplePdf('Aircrew Report', [
              `Unified readiness score: ${readinessScore}/100`,
              `Total incident: ${state.incidents.length}`,
              `Training compliance records: ${state.trainings.length}`,
              `Active alerts: ${readinessAlerts.length}`
            ])
          }
        >
          Export PDF
        </button>
      </div>
    </section>
  );
};
