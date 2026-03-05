import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { moduleBlueprints } from '../data/moduleBlueprints';

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
  owner: string;
};

const workflowPreset: Record<string, string[]> = {
  '/profile': ['Update profil penerbang', 'Validasi status currency', 'Kirim verifikasi ke komandan'],
  '/weather': ['Review METAR/TAF', 'Tandai cuaca kritis', 'Publish briefing cuaca'],
  '/duty-rest': ['Input duty period', 'Validasi jam istirahat', 'Konfirmasi status fit-to-fly'],
  '/incident-workspace': ['Buat laporan awal', 'Tambah evidence & timeline', 'Assign action owner']
};

const owners = ['Pilot', 'Ops Officer', 'Flight Safety Officer', 'Medical', 'Commander'];

const getStorageKey = (path: string) => `feature-flow-${path.replace(/\//g, '-') || 'root'}`;

const defaultTask = (path: string): ChecklistItem[] => {
  const modulePreset = moduleBlueprints[path]?.workflow;
  const seedTasks = workflowPreset[path] ?? modulePreset ?? ['Inisiasi data', 'Review operasional', 'Final approval'];

  return seedTasks.map((text, index) => ({
    id: `${path}-seed-${index + 1}`,
    text,
    owner: index === 1 ? 'Ops Officer' : 'Pilot',
    done: false
  }));
};

const parseTasks = (raw: string | null, path: string) => {
  if (!raw) return defaultTask(path);
  try {
    return JSON.parse(raw) as ChecklistItem[];
  } catch {
    return defaultTask(path);
  }
};

export const GenericFeaturePage = ({ title, description }: { title: string; description: string }) => {
  const location = useLocation();
  const storageKey = useMemo(() => getStorageKey(location.pathname), [location.pathname]);
  const moduleBlueprint = moduleBlueprints[location.pathname];

  const [tasks, setTasks] = useState<ChecklistItem[]>(() => parseTasks(localStorage.getItem(storageKey), location.pathname));
  const [newTask, setNewTask] = useState('');
  const [owner, setOwner] = useState('Pilot');
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  useEffect(() => {
    setTasks(parseTasks(localStorage.getItem(storageKey), location.pathname));
  }, [location.pathname, storageKey]);

  const doneTask = tasks.filter((task) => task.done).length;
  const progress = Math.round((doneTask / Math.max(tasks.length, 1)) * 100);
  const filteredTasks = filter === 'all' ? tasks : tasks.filter((task) => (filter === 'done' ? task.done : !task.done));

  const aiInsight = useMemo(() => {
    const openTasks = tasks.filter((task) => !task.done);
    const confidence = Math.max(65, 95 - openTasks.length * 3);

    const recommendations = [
      { text: 'Prioritaskan task yang memengaruhi status fit-to-fly.', owner: 'Ops Officer' },
      { text: 'Pastikan evidence dan approval sudah terlampir.', owner: 'Flight Safety Officer' },
      { text: 'Review ulang dependency lintas medical-training-ops.', owner: 'Commander' }
    ];

    const narrative = progress >= 80 ? 'Workflow hampir siap eksekusi.' : 'Masih ada dependency penting yang perlu ditutup.';

    return { confidence, recommendations, narrative };
  }, [progress, tasks]);

  const saveTasks = (next: ChecklistItem[]) => {
    setTasks(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <section className="space-y-4">
      <div className="card border-0 bg-gradient-to-r from-sky-700 to-cyan-600 text-white dark:border-sky-500">
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-sky-100">{description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge label="Fitur Aktif" tone="green" />
          <p className="text-sm">Progress alur: <span className="font-semibold">{progress}%</span></p>
          <Badge label={progress >= 80 ? 'Siap Eksekusi' : progress >= 50 ? 'On Progress' : 'Perlu Tindak Lanjut'} tone={progress >= 80 ? 'green' : progress >= 50 ? 'yellow' : 'red'} />
        </div>
      </div>

      {moduleBlueprint && (
        <div className="grid gap-3 lg:grid-cols-3">
          {moduleBlueprint.kpis.map((kpi) => (
            <div key={kpi.label} className="card">
              <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
              <Badge label={kpi.status === 'good' ? 'Normal' : kpi.status === 'watch' ? 'Watch' : 'Critical'} tone={kpi.status === 'good' ? 'green' : kpi.status === 'watch' ? 'yellow' : 'red'} />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Alur Kerja Operasional</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {['all', 'open', 'done'].map((item) => (
                <button key={item} className={`rounded-md px-2 py-1 ${filter === item ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`} onClick={() => setFilter(item as 'all' | 'open' | 'done')}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <label key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="min-w-0 flex-1">
                  <p className={task.done ? 'line-through opacity-60' : ''}>{task.text}</p>
                  <p className="text-xs text-slate-500">Owner: {task.owner}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => {
                      const next = tasks.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item));
                      saveTasks(next);
                    }}
                  />
                  <button className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" onClick={() => saveTasks(tasks.filter((item) => item.id !== task.id))}>
                    Hapus
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Kontrol Workflow</h3>
          <input className="input" placeholder="Tambah task" value={newTask} onChange={(event) => setNewTask(event.target.value)} />
          <select className="input" value={owner} onChange={(event) => setOwner(event.target.value)}>
            {owners.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button
            className="w-full rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            onClick={() => {
              if (!newTask.trim()) return;
              saveTasks([{ id: `${Date.now()}`, text: newTask.trim(), owner, done: false }, ...tasks]);
              setNewTask('');
            }}
          >
            Tambah Task
          </button>
          <p className="rounded-lg bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{moduleBlueprint?.slaTarget ?? 'SLA belum ditentukan untuk modul ini.'}</p>
        </div>
      </div>

      {moduleBlueprint && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="card space-y-2">
            <h3 className="font-semibold">Early Warning Alerts</h3>
            {moduleBlueprint.alerts.map((alert) => (
              <div key={alert} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-100">{alert}</div>
            ))}
          </div>
          <div className="card space-y-2">
            <h3 className="font-semibold">Compliance Gate</h3>
            {moduleBlueprint.complianceChecks.map((item) => (
              <div key={item} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-100">{item}</div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">AI Workflow Optimizer</h3>
          <Badge label={`Confidence ${aiInsight.confidence}%`} tone={aiInsight.confidence >= 80 ? 'green' : 'yellow'} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{aiInsight.narrative}</p>
        <button
          className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          onClick={() => {
            const generated = aiInsight.recommendations.map((item, index) => ({ id: `ai-${Date.now()}-${index}`, text: `[AI] ${item.text}`, owner: item.owner, done: false }));
            saveTasks([...generated, ...tasks]);
          }}
        >
          Generate Task Otomatis dari AI
        </button>
      </div>
    </section>
  );
};
