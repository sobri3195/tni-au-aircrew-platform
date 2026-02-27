import { useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';

const isOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

export const SchedulePlannerPage = () => {
  const { state, dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Sortie' | 'Training' | 'Briefing'>('Sortie');
  const [base, setBase] = useState('Lanud Iswahjudi');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const weeklyItems = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return state.schedule
      .filter((item) => {
        const itemStart = new Date(item.start);
        return itemStart >= weekStart && itemStart < weekEnd;
      })
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [state.schedule]);

  const conflictIds = useMemo(() => {
    const flagged = new Set<string>();
    weeklyItems.forEach((item, index) => {
      const itemStart = new Date(item.start);
      const itemEnd = new Date(item.end);
      weeklyItems.slice(index + 1).forEach((other) => {
        const otherStart = new Date(other.start);
        const otherEnd = new Date(other.end);
        if (itemStart.toDateString() === otherStart.toDateString() && isOverlap(itemStart, itemEnd, otherStart, otherEnd)) {
          flagged.add(item.id);
          flagged.add(other.id);
        }
      });
    });
    return flagged;
  }, [weeklyItems]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Schedule & Sortie Planner</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Kalender mingguan mock, deteksi konflik overlap, serta manajemen sortie/training.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
        <input className="input md:col-span-2" placeholder="Judul kegiatan" value={title} onChange={(event) => setTitle(event.target.value)} />
        <select className="input" value={category} onChange={(event) => setCategory(event.target.value as 'Sortie' | 'Training' | 'Briefing')}>
          <option value="Sortie">Sortie</option>
          <option value="Training">Training</option>
          <option value="Briefing">Briefing</option>
        </select>
        <input className="input" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
        <input className="input" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
        <input className="input" placeholder="Base" value={base} onChange={(event) => setBase(event.target.value)} />
        <button
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
          onClick={() => {
            if (!title || !start || !end) return;
            dispatch({
              type: 'ADD_SCHEDULE',
              payload: {
                id: `S${state.schedule.length + 1}`,
                title,
                category,
                base,
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString()
              }
            });
            setTitle('');
          }}
        >
          Tambah Kegiatan
        </button>
      </div>

      <div className="space-y-2">
        {weeklyItems.map((item) => (
          <div key={item.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.start).toLocaleString('id-ID')} - {new Date(item.end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {item.base}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={item.category} tone="blue" />
              {conflictIds.has(item.id) && <Badge label="Overlap" tone="red" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
