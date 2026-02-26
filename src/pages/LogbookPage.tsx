import { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Table } from '../components/ui/Table';
import { formatDate } from '../utils/date';

export const LogbookPage = () => {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ aircraft: 'F-16C TS-1601', sortieType: 'Training', duration: '1.5', dayNight: 'Day', ifr: false, nvg: false, remarks: '' });

  const totals = useMemo(() => {
    const total = state.logbook.reduce((a, b) => a + b.duration, 0);
    const night = state.logbook.filter((e) => e.dayNight === 'Night').reduce((a, b) => a + b.duration, 0);
    const ifr = state.logbook.filter((e) => e.ifr).reduce((a, b) => a + b.duration, 0);
    return { total: total.toFixed(1), night: night.toFixed(1), ifr: ifr.toFixed(1) };
  }, [state.logbook]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">E-Logbook</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">Total Jam: {totals.total}</div>
        <div className="card">Jam Night: {totals.night}</div>
        <div className="card">Jam IFR: {totals.ifr}</div>
        <button
          className="rounded-xl bg-sky-700 px-3 py-2 font-semibold text-white"
          onClick={() => {
            const id = `L${state.logbook.length + 1}`;
            dispatch({
              type: 'ADD_LOGBOOK',
              payload: {
                id,
                pilotId: 'P001',
                date: new Date().toISOString(),
                aircraft: form.aircraft,
                sortieType: form.sortieType,
                duration: Number(form.duration),
                dayNight: form.dayNight as 'Day' | 'Night',
                ifr: form.ifr,
                nvg: form.nvg,
                remarks: form.remarks
              }
            });
          }}
        >
          Add Flight
        </button>
      </div>
      <div className="card grid gap-2 md:grid-cols-3">
        <input className="input" placeholder="Aircraft" value={form.aircraft} onChange={(e) => setForm((p) => ({ ...p, aircraft: e.target.value }))} />
        <input className="input" placeholder="Sortie Type" value={form.sortieType} onChange={(e) => setForm((p) => ({ ...p, sortieType: e.target.value }))} />
        <input className="input" placeholder="Duration" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
      </div>
      <Table headers={['Date', 'Aircraft', 'Type', 'Duration', 'Day/Night', 'IFR', 'NVG', 'Remarks']}>
        {state.logbook.slice(0, 20).map((item) => (
          <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
            <td className="px-3 py-2">{formatDate(item.date)}</td>
            <td className="px-3 py-2">{item.aircraft}</td>
            <td className="px-3 py-2">{item.sortieType}</td>
            <td className="px-3 py-2">{item.duration}</td>
            <td className="px-3 py-2">{item.dayNight}</td>
            <td className="px-3 py-2">{item.ifr ? 'Yes' : 'No'}</td>
            <td className="px-3 py-2">{item.nvg ? 'Yes' : 'No'}</td>
            <td className="px-3 py-2">{item.remarks}</td>
          </tr>
        ))}
      </Table>
    </section>
  );
};
