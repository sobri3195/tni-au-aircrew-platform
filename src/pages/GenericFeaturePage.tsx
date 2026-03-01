import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';

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
  '/incident-workspace': ['Buat laporan awal', 'Tambah evidence & timeline', 'Assign action owner'],
  '/documents': ['Cari dokumen SOP', 'Baca revisi terbaru', 'Tandai sebagai favorite'],
  '/checklist': ['Pilih template checklist', 'Run checklist step-by-step', 'Simpan hasil eksekusi'],
  '/fatigue': ['Isi self-assessment', 'Hitung skor kelelahan', 'Terbitkan rekomendasi go/no-go'],
  '/inventory': ['Input serial equipment', 'Update serviceability', 'Jadwalkan penggantian'],
  '/maintenance': ['Import status armada', 'Prioritaskan aircraft NMC', 'Sinkronkan jadwal inspeksi'],
  '/messaging': ['Buat pesan internal', 'Tag urgent/info', 'Lacak pesan terbaca']
};

const getStorageKey = (path: string) => `feature-flow-${path.replace(/\//g, '-') || 'root'}`;

const defaultTask = (path: string): ChecklistItem[] =>
  (workflowPreset[path] ?? ['Inisiasi data', 'Review operasional', 'Final approval']).map((text, index) => ({
    id: `${path}-seed-${index + 1}`,
    text,
    owner: index === 1 ? 'Ops Officer' : 'Pilot',
    done: false
  }));

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

  const [tasks, setTasks] = useState<ChecklistItem[]>(() => parseTasks(localStorage.getItem(storageKey), location.pathname));
  const [newTask, setNewTask] = useState('');
  const [owner, setOwner] = useState('Pilot');

  useEffect(() => {
    setTasks(parseTasks(localStorage.getItem(storageKey), location.pathname));
  }, [location.pathname, storageKey]);

  const progress = Math.round((tasks.filter((task) => task.done).length / Math.max(tasks.length, 1)) * 100);

  const saveTasks = (next: ChecklistItem[]) => {
    setTasks(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return (
    <section className="space-y-4">
      <div className="card bg-gradient-to-r from-sky-700 to-cyan-600 text-white dark:border-sky-500">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-sky-100">{description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge label="Fitur Aktif" tone="green" />
          <p className="text-sm">Progress alur: <span className="font-semibold">{progress}%</span></p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-3 font-semibold">Alur Kerja Operasional</h3>
          <div className="mb-4 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-2 rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div>
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
                  <button
                    className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    onClick={() => saveTasks(tasks.filter((item) => item.id !== task.id))}
                  >
                    Hapus
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Tambah Langkah Baru</h3>
          <input className="input" placeholder="Contoh: Verifikasi data pilot" value={newTask} onChange={(event) => setNewTask(event.target.value)} />
          <select className="input" value={owner} onChange={(event) => setOwner(event.target.value)}>
            {['Pilot', 'Ops Officer', 'Flight Safety Officer', 'Medical'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
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
          <button
            className="btn w-full justify-center"
            onClick={() => {
              const reset = defaultTask(location.pathname);
              saveTasks(reset);
            }}
          >
            Reset ke Template
          </button>
        </div>
      </div>
    </section>
  );
};
