import { useApp } from '../contexts/AppContext';
import { exportCsv, exportSimplePdf } from '../utils/export';

export const ReportsPage = () => {
  const { state } = useApp();
  const monthly = Array.from({ length: 6 }).map((_, i) => ({ month: `M-${i + 1}`, hours: state.logbook.slice(i * 5, i * 5 + 5).reduce((a, b) => a + b.duration, 0) }));

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Reports & Analytics</h2>
      <div className="card">
        <h3 className="mb-2 font-semibold">Mock Chart Jam Terbang / Bulan</h3>
        <div className="space-y-2">
          {monthly.map((m) => <div key={m.month} className="flex items-center gap-2 text-sm"><span className="w-16">{m.month}</span><div className="h-3 rounded bg-sky-600" style={{ width: `${m.hours * 10}px` }} /></div>)}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={() => exportCsv('logbook.csv', state.logbook.slice(0, 20))}>Export CSV</button>
        <button className="btn" onClick={() => exportSimplePdf('Aircrew Report', [`Total incident: ${state.incidents.length}`, `Training compliance records: ${state.trainings.length}`])}>Export PDF</button>
      </div>
    </section>
  );
};
