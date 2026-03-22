import { useEffect, useMemo, useRef, useState } from 'react';
import { readJsonStorage } from '../utils/storage';
import { useLocation } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { moduleBlueprints } from '../data/moduleBlueprints';
import { buildModuleAiProfiles } from '../data/moduleAiProfiles';
import { getModuleCrudSchema } from '../data/moduleCrudSchemas';
import { requestedFeatureModules } from '../data/featureModules';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { exportCsv, exportSimplePdf } from '../utils/export';

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
  owner: string;
};

type ModuleRecord = {
  id: string;
  status: string;
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type ModuleSyncSummary = {
  path: string;
  title: string;
  group: string;
  progress: number;
  openTasks: number;
  totalRecords: number;
  openRecords: number;
  updatedAt: string;
};

type FlowStage = {
  name: string;
  complete: boolean;
  detail: string;
};

type ImportPayload = {
  tasks?: ChecklistItem[];
  records?: ModuleRecord[];
};

const closedStatusPattern = /closed|done|resolved|synced|completed|validated/i;

const workflowPreset: Record<string, string[]> = {
  '/profile': ['Update profil penerbang', 'Validasi status currency', 'Kirim verifikasi ke komandan'],
  '/weather': ['Review METAR/TAF', 'Tandai cuaca kritis', 'Publish briefing cuaca'],
  '/duty-rest': ['Input duty period', 'Validasi jam istirahat', 'Konfirmasi status fit-to-fly'],
  '/incident-workspace': ['Buat laporan awal', 'Tambah evidence & timeline', 'Assign action owner']
};

const owners = ['Pilot', 'Ops Officer', 'Flight Safety Officer', 'Medical', 'Commander'];
const sharedModuleStorageKey = 'feature-module-sync-v1';
const moduleMetaMap = Object.fromEntries(requestedFeatureModules.map((module) => [module.path, { title: module.title, group: module.group }]));

const getStorageKey = (path: string) => `feature-flow-${path.replace(/\//g, '-') || 'root'}`;
const getCrudStorageKey = (path: string) => `feature-crud-${path.replace(/\//g, '-') || 'root'}`;

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

const parseRecords = (raw: string | null) => {
  if (!raw) return [] as ModuleRecord[];
  try {
    return JSON.parse(raw) as ModuleRecord[];
  } catch {
    return [] as ModuleRecord[];
  }
};

const parseModuleSyncMap = (raw: string | null): Record<string, ModuleSyncSummary> => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ModuleSyncSummary>;
  } catch {
    return {};
  }
};

export const GenericFeaturePage = ({ title, description }: { title: string; description: string }) => {
  const location = useLocation();
  const storageKey = useMemo(() => getStorageKey(location.pathname), [location.pathname]);
  const crudStorageKey = useMemo(() => getCrudStorageKey(location.pathname), [location.pathname]);
  const moduleBlueprint = moduleBlueprints[location.pathname];
  const schema = useMemo(() => getModuleCrudSchema(location.pathname), [location.pathname]);
  const { canWriteCurrentRoute } = useRoleAccess();
  const activeModuleMeta = moduleMetaMap[location.pathname] ?? { title, group: 'Core Module' };

  const [tasks, setTasks] = useLocalStorageState<ChecklistItem[]>(storageKey, defaultTask(location.pathname));
  const [records, setRecords] = useLocalStorageState<ModuleRecord[]>(crudStorageKey, []);
  const [newTask, setNewTask] = useLocalStorageState(`feature-draft-task-${location.pathname}`, '');
  const [taskOwner, setTaskOwner] = useLocalStorageState(`feature-draft-owner-${location.pathname}`, 'Pilot');
  const [filter, setFilter] = useLocalStorageState<'all' | 'open' | 'done'>(`feature-filter-${location.pathname}`, 'all');
  const [statusFilter, setStatusFilter] = useLocalStorageState(`feature-status-filter-${location.pathname}`, 'all');
  const [search, setSearch] = useLocalStorageState(`feature-search-${location.pathname}`, '');
  const [moduleSyncMap, setModuleSyncMap] = useLocalStorageState<Record<string, ModuleSyncSummary>>(sharedModuleStorageKey, {});
  const [editId, setEditId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [statusValue, setStatusValue] = useState(schema.defaultStatus ?? schema.statuses?.[0] ?? 'Open');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportRecordDataset = () => {
    if (records.length === 0) return;
    exportCsv(`${location.pathname.replace(/\//g, '-') || 'module'}-records.csv`, records.map((record) => ({
      id: record.id,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      ...record.values
    })));
  };

  const exportCommandBrief = () => {
    exportSimplePdf(`${title} Command Brief`, [
      `Route: ${location.pathname}`,
      `Progress workflow: ${progress}%`,
      `Total record: ${records.length}`,
      `Open record: ${openRecordCount}`,
      `Open task: ${openTaskCount}`,
      `Generated: ${new Date().toLocaleString('id-ID')}`
    ]);
  };

  const exportModuleJson = () => {
    const payload = {
      module: location.pathname,
      title,
      exportedAt: new Date().toISOString(),
      records,
      tasks
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${location.pathname.replace(/\//g, '-') || 'module'}-snapshot.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importModuleData = (payload: ImportPayload) => {
    if (!canWriteCurrentRoute) return;

    if (Array.isArray(payload.records)) {
      const sanitizedRecords = payload.records.filter((record) => record?.id && record?.status && record?.values);
      saveRecords(sanitizedRecords);
    }

    if (Array.isArray(payload.tasks)) {
      const sanitizedTasks = payload.tasks
        .filter((task) => task?.id && task?.text)
        .map((task) => ({
          ...task,
          owner: owners.includes(task.owner) ? task.owner : 'Ops Officer',
          done: Boolean(task.done)
        }));
      saveTasks(sanitizedTasks);
    }
  };

  const resetModuleData = () => {
    if (!canWriteCurrentRoute) return;
    saveRecords([]);
    saveTasks(defaultTask(location.pathname));
    resetForm();
  };

  useEffect(() => {
    const storedTasks = readJsonStorage<ChecklistItem[]>(storageKey, defaultTask(location.pathname));
    const storedRecords = readJsonStorage<ModuleRecord[]>(crudStorageKey, []);
    setTasks(parseTasks(JSON.stringify(storedTasks), location.pathname));
    setRecords(parseRecords(JSON.stringify(storedRecords)));
    const emptyForm = Object.fromEntries(schema.fields.map((field) => [field.key, '']));
    setFormValues(emptyForm);
    setStatusValue(schema.defaultStatus ?? schema.statuses?.[0] ?? 'Open');
    setEditId(null);
  }, [crudStorageKey, location.pathname, schema, setRecords, setTasks, storageKey]);

  const doneTask = tasks.filter((task) => task.done).length;
  const progress = Math.round((doneTask / Math.max(tasks.length, 1)) * 100);
  const filteredTasks = filter === 'all' ? tasks : tasks.filter((task) => (filter === 'done' ? task.done : !task.done));
  const openTaskCount = tasks.length - doneTask;
  const openRecordCount = records.filter((record) => !closedStatusPattern.test(record.status)).length;
  const moduleHealthScore = Math.max(0, Math.round(progress - openRecordCount * 4 - openTaskCount * 3 + (records.length > 0 ? 5 : 0)));

  const statusCounts = useMemo(() => records.reduce<Record<string, number>>((acc, record) => {
    acc[record.status] = (acc[record.status] ?? 0) + 1;
    return acc;
  }, {}), [records]);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    const values = Object.values(record.values).join(' ').toLowerCase();
    const matchSearch = !search.trim() || values.includes(search.toLowerCase()) || record.status.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [records, statusFilter, search]);

  const moduleAiProfiles = useMemo(() => buildModuleAiProfiles({
    path: location.pathname,
    title: activeModuleMeta.title,
    group: activeModuleMeta.group,
    description
  }), [activeModuleMeta.group, activeModuleMeta.title, description, location.pathname]);

  const aiInsight = useMemo(() => {
    const openTasks = tasks.filter((task) => !task.done);
    const confidence = Math.max(65, 95 - openTasks.length * 3);

    const recommendations = moduleAiProfiles.map((profile, index) => ({
      text: `${profile.name}: ${profile.automation}.`,
      owner: owners[index % owners.length]
    }));

    const narrative = progress >= 80 ? 'Workflow hampir siap eksekusi.' : 'Masih ada dependency penting yang perlu ditutup.';

    return { confidence, recommendations, narrative };
  }, [moduleAiProfiles, progress, tasks]);

  useEffect(() => {
    const moduleMeta = moduleMetaMap[location.pathname];
    const nextSummary: ModuleSyncSummary = {
      path: location.pathname,
      title: moduleMeta?.title ?? title,
      group: moduleMeta?.group ?? 'Core Module',
      progress,
      openTasks: openTaskCount,
      totalRecords: records.length,
      openRecords: openRecordCount,
      updatedAt: new Date().toISOString()
    };

    const current = moduleSyncMap[location.pathname];
    if (
      current &&
      current.progress === nextSummary.progress &&
      current.openTasks === nextSummary.openTasks &&
      current.totalRecords === nextSummary.totalRecords &&
      current.openRecords === nextSummary.openRecords &&
      current.title === nextSummary.title &&
      current.group === nextSummary.group
    ) {
      return;
    }

    setModuleSyncMap({
      ...moduleSyncMap,
      [location.pathname]: nextSummary
    });
  }, [location.pathname, moduleSyncMap, openRecordCount, openTaskCount, progress, records.length, setModuleSyncMap, title]);

  const flowStages = useMemo<FlowStage[]>(() => {
    const hasRecords = records.length > 0;
    const hasOpenRecords = openRecordCount > 0;
    const hasOpenTasks = openTaskCount > 0;

    return [
      { name: 'Planning', complete: hasRecords, detail: hasRecords ? `${records.length} record sudah diinisiasi.` : 'Belum ada record, mulai dari input data inti.' },
      { name: 'Validation', complete: !hasOpenRecords && hasRecords, detail: hasOpenRecords ? `${openRecordCount} record masih open.` : 'Semua record sudah tervalidasi.' },
      { name: 'Workflow Closure', complete: !hasOpenTasks && tasks.length > 0, detail: hasOpenTasks ? `${openTaskCount} task belum selesai.` : 'Semua task workflow sudah ditutup.' },
      { name: 'Command Gate', complete: progress >= 80 && !hasOpenRecords, detail: progress >= 80 && !hasOpenRecords ? 'Layak diajukan ke komandan.' : 'Perlu peningkatan progress atau penutupan record open.' }
    ];
  }, [openRecordCount, openTaskCount, progress, records.length, tasks.length]);

  const relatedModuleSummaries = useMemo(() => {
    const moduleMeta = moduleMetaMap[location.pathname];
    const entries = Object.values(parseModuleSyncMap(JSON.stringify(moduleSyncMap))).filter((item) => item.path !== location.pathname);
    const prioritized = moduleMeta ? entries.filter((item) => item.group === moduleMeta.group) : entries;

    return (prioritized.length > 0 ? prioritized : entries)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 4);
  }, [location.pathname, moduleSyncMap]);

  const commandRecommendation = useMemo(() => {
    const allModules = Object.values(parseModuleSyncMap(JSON.stringify(moduleSyncMap)));
    const aggregate = [
      ...allModules.filter((item) => item.path !== location.pathname),
      {
        path: location.pathname,
        title,
        group: moduleMetaMap[location.pathname]?.group ?? 'Core Module',
        progress,
        openTasks: openTaskCount,
        totalRecords: records.length,
        openRecords: openRecordCount,
        updatedAt: new Date().toISOString()
      }
    ];

    const avgProgress = aggregate.length ? Math.round(aggregate.reduce((sum, item) => sum + item.progress, 0) / aggregate.length) : progress;
    const totalOpen = aggregate.reduce((sum, item) => sum + item.openTasks + item.openRecords, 0);
    const status = avgProgress >= 80 && totalOpen <= Math.max(aggregate.length, 1) ? 'GREEN' : avgProgress >= 55 ? 'AMBER' : 'RED';

    return {
      moduleCount: aggregate.length,
      avgProgress,
      totalOpen,
      status,
      message: status === 'GREEN'
        ? 'Seluruh alur lintas modul relatif stabil. Rekomendasi: lanjutkan eksekusi misi.'
        : status === 'AMBER'
          ? 'Ada beberapa dependency lintas modul yang perlu ditutup sebelum eksekusi penuh.'
          : 'Banyak dependency kritis belum terselesaikan. Prioritaskan closure sebelum approval komandan.'
    };
  }, [location.pathname, moduleSyncMap, openRecordCount, openTaskCount, progress, records.length, title]);

  const saveTasks = (next: ChecklistItem[]) => {
    setTasks(next);
  };

  const saveRecords = (next: ModuleRecord[]) => {
    setRecords(next);
  };

  const resetForm = () => {
    setFormValues(Object.fromEntries(schema.fields.map((field) => [field.key, ''])));
    setStatusValue(schema.defaultStatus ?? schema.statuses?.[0] ?? 'Open');
    setEditId(null);
    setFormError('');
  };

  const submitRecord = () => {
    const hasRequiredMissing = schema.fields.some((field) => field.required && !formValues[field.key]?.trim());
    if (hasRequiredMissing) {
      setFormError('Field wajib belum lengkap. Lengkapi input yang bertanda required.');
      return;
    }

    setFormError('');

    const now = new Date().toISOString();
    if (editId) {
      const next = records.map((record) => (record.id === editId ? { ...record, status: statusValue, values: formValues, updatedAt: now } : record));
      saveRecords(next);
      resetForm();
      return;
    }

    const nextRecord: ModuleRecord = {
      id: `${Date.now()}`,
      status: statusValue,
      values: formValues,
      createdAt: now,
      updatedAt: now
    };
    saveRecords([nextRecord, ...records]);
    resetForm();
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

      {!canWriteCurrentRoute && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
          Role Anda hanya memiliki akses baca untuk modul ini.
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={exportRecordDataset} disabled={records.length === 0}>
            Export CSV
          </button>
          <button className="rounded-md bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800" onClick={exportCommandBrief}>
            Export Command Brief
          </button>
          <button className="rounded-md bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800" onClick={exportModuleJson}>
            Export JSON
          </button>
          <button
            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canWriteCurrentRoute}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </button>
          <button
            className="rounded-md bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canWriteCurrentRoute}
            onClick={resetModuleData}
          >
            Reset Modul
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const parsed = JSON.parse(String(reader.result)) as ImportPayload;
                  importModuleData(parsed);
                } catch {
                  // ignore invalid payload
                }
              };
              reader.readAsText(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">{schema.entityName} Total</p>
          <p className="mt-2 text-2xl font-bold">{records.length}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status Dominan</p>
          <p className="mt-2 text-2xl font-bold">{Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open Items</p>
          <p className="mt-2 text-2xl font-bold">{openRecordCount}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Storage</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">localStorage key: <span className="font-semibold">{crudStorageKey}</span></p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Module Health</p>
          <p className="mt-2 text-2xl font-bold">{moduleHealthScore}</p>
          <p className="mt-1 text-xs text-slate-500">Kalkulasi dari progress, open task, dan open record.</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">CRUD {schema.entityName}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input className="input w-full sm:w-40" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select className="input w-full sm:w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All Status</option>
                {(schema.statuses ?? []).map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  {schema.fields.slice(0, 3).map((field) => <th key={field.key} className="px-3 py-2">{field.label}</th>)}
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2"><Badge label={record.status} tone={/critical|red|alert|violation|expired|conflict/i.test(record.status) ? 'red' : /watch|amber|pending|review/i.test(record.status) ? 'yellow' : 'green'} /></td>
                    {schema.fields.slice(0, 3).map((field) => <td key={field.key} className="px-3 py-2">{record.values[field.key] || '-'}</td>)}
                    <td className="px-3 py-2 text-xs">{new Date(record.updatedAt).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 text-xs">
                        <button
                          className="rounded bg-sky-100 px-2 py-1 text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!canWriteCurrentRoute}
                          onClick={() => {
                            setEditId(record.id);
                            setFormValues(record.values);
                            setStatusValue(record.status);
                          }}
                        >
                          Edit
                        </button>
                        <button className="rounded bg-rose-100 px-2 py-1 text-rose-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canWriteCurrentRoute} onClick={() => canWriteCurrentRoute && saveRecords(records.filter((item) => item.id !== record.id))}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">{editId ? `Edit ${schema.entityName}` : `Tambah ${schema.entityName}`}</h3>
          {(schema.statuses ?? ['Open']).length > 0 && (
            <select className="input" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
              {(schema.statuses ?? ['Open']).map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          )}
          {schema.fields.map((field) => {
            if (field.type === 'select') {
              return (
                <select key={field.key} className="input" value={formValues[field.key] ?? ''} onChange={(event) => setFormValues({ ...formValues, [field.key]: event.target.value })}>
                  <option value="">{field.label}</option>
                  {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              );
            }

            if (field.type === 'textarea') {
              return (
                <textarea key={field.key} className="input min-h-[76px]" placeholder={field.label} value={formValues[field.key] ?? ''} onChange={(event) => setFormValues({ ...formValues, [field.key]: event.target.value })} />
              );
            }

            return (
              <input
                key={field.key}
                className="input"
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                placeholder={field.label}
                value={formValues[field.key] ?? ''}
                onChange={(event) => setFormValues({ ...formValues, [field.key]: event.target.value })}
              />
            );
          })}
          {formError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-200">{formError}</p>}
          <button className="w-full rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canWriteCurrentRoute} onClick={() => canWriteCurrentRoute && submitRecord()}>{editId ? 'Update Record' : 'Create Record'}</button>
          {editId && <button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Command Flow Gate</h3>
            <Badge label={`State ${commandRecommendation.status}`} tone={commandRecommendation.status === 'GREEN' ? 'green' : commandRecommendation.status === 'AMBER' ? 'yellow' : 'red'} />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{commandRecommendation.message}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge label={`Modul Aktif ${commandRecommendation.moduleCount}`} tone="green" />
            <Badge label={`Average Progress ${commandRecommendation.avgProgress}%`} tone={commandRecommendation.avgProgress >= 80 ? 'green' : commandRecommendation.avgProgress >= 55 ? 'yellow' : 'red'} />
            <Badge label={`Total Open Dependency ${commandRecommendation.totalOpen}`} tone={commandRecommendation.totalOpen === 0 ? 'green' : commandRecommendation.totalOpen > commandRecommendation.moduleCount * 2 ? 'red' : 'yellow'} />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {flowStages.map((stage) => (
            <div key={stage.name} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{stage.name}</p>
                <Badge label={stage.complete ? 'Done' : 'Pending'} tone={stage.complete ? 'green' : 'yellow'} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{stage.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Koneksi Antar Modul (localStorage)</h3>
          <p className="text-xs text-slate-500">Shared key: {sharedModuleStorageKey}</p>
        </div>
        {relatedModuleSummaries.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada modul lain yang aktif. Buka modul lain untuk mulai sinkronisasi lintas modul.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {relatedModuleSummaries.map((item) => (
              <div key={item.path} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.group}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge label={`Progress ${item.progress}%`} tone={item.progress >= 80 ? 'green' : item.progress >= 50 ? 'yellow' : 'red'} />
                  <Badge label={`Open Task ${item.openTasks}`} tone={item.openTasks === 0 ? 'green' : item.openTasks > 3 ? 'red' : 'yellow'} />
                  <Badge label={`Open Record ${item.openRecords}`} tone={item.openRecords === 0 ? 'green' : item.openRecords > 3 ? 'red' : 'yellow'} />
                </div>
              </div>
            ))}
          </div>
        )}
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

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Alur Kerja Operasional</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canWriteCurrentRoute || tasks.length === 0}
                onClick={() => canWriteCurrentRoute && saveTasks(tasks.map((task) => ({ ...task, done: true })))}
              >
                Close All
              </button>
              <button
                className="rounded-md bg-amber-100 px-2 py-1 text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canWriteCurrentRoute || tasks.length === 0}
                onClick={() => canWriteCurrentRoute && saveTasks(tasks.map((task) => ({ ...task, done: false })))}
              >
                Reopen All
              </button>
              {['all', 'open', 'done'].map((item) => (
                <button key={item} className={`rounded-md px-2 py-1 ${filter === item ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`} onClick={() => setFilter(item as 'all' | 'open' | 'done')}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredTasks.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700">Tidak ada task pada filter ini.</p>}
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
                      if (!canWriteCurrentRoute) return;
                      const next = tasks.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item));
                      saveTasks(next);
                    }}
                  />
                  <button className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canWriteCurrentRoute} onClick={() => canWriteCurrentRoute && saveTasks(tasks.filter((item) => item.id !== task.id))}>
                    Hapus
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Kontrol Workflow</h3>
          <input className="input" placeholder="Tambah task" value={newTask} disabled={!canWriteCurrentRoute} onChange={(event) => setNewTask(event.target.value)} />
          <select className="input" value={taskOwner} disabled={!canWriteCurrentRoute} onChange={(event) => setTaskOwner(event.target.value)}>
            {owners.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button
            className="w-full rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canWriteCurrentRoute}
            onClick={() => {
              if (!canWriteCurrentRoute || !newTask.trim()) return;
              saveTasks([{ id: `${Date.now()}`, text: newTask.trim(), owner: taskOwner, done: false }, ...tasks]);
              setNewTask('');
            }}
          >
            Tambah Task
          </button>
          <p className="rounded-lg bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{moduleBlueprint?.slaTarget ?? 'SLA belum ditentukan untuk modul ini.'}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {moduleAiProfiles.map((profile, index) => {
          const toneStyles = profile.tone === 'sky'
            ? 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-700/40 dark:bg-sky-900/20 dark:text-sky-100'
            : profile.tone === 'emerald'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-100'
              : 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-100';

          return (
            <div key={profile.id} className={`card border ${toneStyles}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] opacity-75">AI Modul {index + 1}</p>
                  <h3 className="mt-1 font-semibold">{profile.name}</h3>
                </div>
                <Badge label={profile.role} tone={index === 0 ? 'blue' : index === 1 ? 'green' : 'slate'} />
              </div>
              <p className="mt-3 text-sm opacity-90">{profile.objective}</p>
              <div className="mt-3 rounded-lg border border-current/15 bg-white/40 p-3 text-sm dark:bg-slate-950/20">
                <p className="font-medium">Fokus AI</p>
                <p className="mt-1 opacity-90">{profile.focus}</p>
              </div>
              <p className="mt-3 text-xs opacity-80">Automation: {profile.automation}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">AI Workflow Optimizer</h3>
          <Badge label={`Confidence ${aiInsight.confidence}%`} tone={aiInsight.confidence >= 80 ? 'green' : 'yellow'} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{aiInsight.narrative}</p>
        <button
          className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canWriteCurrentRoute}
          onClick={() => {
            if (!canWriteCurrentRoute) return;
            const generated = aiInsight.recommendations.map((item, index) => ({ id: `ai-${Date.now()}-${index}`, text: `[AI] ${item.text}`, owner: item.owner, done: false }));
            const existing = new Set(tasks.map((task) => task.text.trim().toLowerCase()));
            const uniqueGenerated = generated.filter((task) => !existing.has(task.text.trim().toLowerCase()));
            saveTasks([...uniqueGenerated, ...tasks]);
          }}
        >
          Generate Task Otomatis dari AI
        </button>
      </div>
    </section>
  );
};
