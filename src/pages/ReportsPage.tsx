import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { exportCsv, exportSimplePdf } from '../utils/export';
import { calculateReadinessAlerts, calculateReadinessComponents, calculateReadinessScore } from '../utils/readiness';
import { getModuleOperationalStatus, ModuleSyncSummary, SHARED_MODULE_SYNC_STORAGE_KEY } from '../utils/moduleSync';

const getLastUpdatedLabel = (value: string) => {
  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));

  if (minutesAgo < 60) return `${minutesAgo} menit lalu`;
  if (minutesAgo < 1440) return `${Math.round(minutesAgo / 60)} jam lalu`;
  return `${Math.round(minutesAgo / 1440)} hari lalu`;
};

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [moduleSyncMap] = useLocalStorageState<Record<string, ModuleSyncSummary>>(SHARED_MODULE_SYNC_STORAGE_KEY, {});

  const monthly = useMemo(
    () => Array.from({ length: 6 }).map((_, i) => ({ month: `M-${i + 1}`, hours: state.logbook.slice(i * 5, i * 5 + 5).reduce((a, b) => a + b.duration, 0) })),
    [state.logbook]
  );

  const readinessComponents = useMemo(() => calculateReadinessComponents(state), [state]);
  const readinessAlerts = useMemo(() => calculateReadinessAlerts(state), [state]);
  const readinessScore = useMemo(() => calculateReadinessScore(state), [state]);

  const moduleSyncEntries = useMemo(
    () => Object.values(moduleSyncMap).sort((a, b) => a.progress - b.progress || b.openTasks + b.openRecords - (a.openTasks + a.openRecords)),
    [moduleSyncMap]
  );

  const syncOverview = useMemo(() => {
    const totalModules = moduleSyncEntries.length;
    const healthy = moduleSyncEntries.filter((item) => getModuleOperationalStatus(item).label === 'On Track').length;
    const atRisk = moduleSyncEntries.filter((item) => getModuleOperationalStatus(item).label === 'At Risk').length;
    const avgProgress = totalModules ? Math.round(moduleSyncEntries.reduce((sum, item) => sum + item.progress, 0) / totalModules) : 0;
    const openActions = moduleSyncEntries.reduce((sum, item) => sum + item.openTasks + item.openRecords, 0);

    return { totalModules, healthy, atRisk, avgProgress, openActions };
  }, [moduleSyncEntries]);

  const groupedModules = useMemo(
    () => Object.entries(moduleSyncEntries.reduce<Record<string, ModuleSyncSummary[]>>((acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), item];
      return acc;
    }, {})),
    [moduleSyncEntries]
  );

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

  const exportModuleSyncCsv = () => {
    if (moduleSyncEntries.length === 0) return;

    exportCsv(
      'module-sync-board.csv',
      moduleSyncEntries.map((item) => {
        const status = getModuleOperationalStatus(item);
        return {
          group: item.group,
          module: item.title,
          path: item.path,
          progress: item.progress,
          openTasks: item.openTasks,
          openRecords: item.openRecords,
          totalRecords: item.totalRecords,
          status: status.label,
          updatedAt: item.updatedAt
        };
      })
    );
  };

  const exportExecutivePdf = () => {
    const worstModules = moduleSyncEntries.slice(0, 5).map((item) => {
      const status = getModuleOperationalStatus(item);
      return `${item.title}: ${status.label}, progress ${item.progress}%, blocker ${item.openTasks + item.openRecords}`;
    });

    exportSimplePdf('Executive Readiness Brief', [
      `Unified readiness score: ${readinessScore}/100`,
      `Total module tracked: ${syncOverview.totalModules}`,
      `Average module progress: ${syncOverview.avgProgress}%`,
      `Open actions lintas modul: ${syncOverview.openActions}`,
      `At-risk modules: ${syncOverview.atRisk}`,
      ...worstModules
    ]);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Ringkasan readiness, trend logbook, dan papan sinkronisasi untuk semua modul yang sudah dijalankan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => exportCsv('logbook.csv', state.logbook.slice(0, 20))}>Export CSV</button>
          <button className="btn" onClick={exportReadinessCsv}>Export Readiness CSV</button>
          <button className="btn" onClick={exportModuleSyncCsv} disabled={moduleSyncEntries.length === 0}>Export Module Sync CSV</button>
          <button className="btn" onClick={exportExecutivePdf}>Export Executive PDF</button>
        </div>
      </div>

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

      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tracked Modules</p>
          <p className="mt-2 text-2xl font-bold">{syncOverview.totalModules}</p>
          <p className="mt-1 text-xs text-slate-500">Modul dengan progress sinkron ke local storage.</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg Progress</p>
          <p className="mt-2 text-2xl font-bold">{syncOverview.avgProgress}%</p>
          <p className="mt-1 text-xs text-slate-500">Rata-rata kesiapan alur lintas modul.</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Healthy Modules</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{syncOverview.healthy}</p>
          <p className="mt-1 text-xs text-slate-500">Modul on track dengan blocker minimal.</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open Actions</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{syncOverview.openActions}</p>
          <p className="mt-1 text-xs text-slate-500">Akumulasi record open dan workflow task.</p>
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

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Cross-Module Execution Board</h3>
            <p className="text-sm text-slate-500">Memantau progres semua modul generik agar penyempurnaan fitur tidak berhenti di satu halaman saja.</p>
          </div>
          {moduleSyncEntries.length > 0 && <Badge label={`${syncOverview.atRisk} at risk`} tone={syncOverview.atRisk > 0 ? 'red' : 'green'} />}
        </div>

        {moduleSyncEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
            Belum ada modul generik yang menghasilkan data sinkron. Buka salah satu modul penyempurnaan dan isi record/task agar papan eksekusi mulai terisi.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedModules.map(([group, modules]) => (
              <div key={group} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{group}</p>
                    <p className="text-xs text-slate-500">{modules.length} modul tercatat.</p>
                  </div>
                  <Badge
                    label={`${Math.round(modules.reduce((sum, item) => sum + item.progress, 0) / Math.max(modules.length, 1))}% group progress`}
                    tone={modules.some((item) => getModuleOperationalStatus(item).label === 'At Risk') ? 'yellow' : 'green'}
                  />
                </div>
                <div className="space-y-2">
                  {modules.map((item) => {
                    const status = getModuleOperationalStatus(item);
                    return (
                      <button
                        key={item.path}
                        type="button"
                        className="flex w-full flex-col rounded-lg border border-slate-200 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50/60 dark:border-slate-700 dark:hover:border-sky-700 dark:hover:bg-slate-900"
                        onClick={() => navigate(item.path)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.path} • update {getLastUpdatedLabel(item.updatedAt)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge label={status.label} tone={status.tone} />
                            <Badge label={`${item.progress}% progress`} tone={item.progress >= 80 ? 'green' : item.progress >= 55 ? 'yellow' : 'red'} />
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className={`h-full rounded-full ${item.progress >= 80 ? 'bg-emerald-500' : item.progress >= 55 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(item.progress, 100)}%` }} />
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                          <span>Record: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.totalRecords}</span></span>
                          <span>Open record: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.openRecords}</span></span>
                          <span>Open task: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.openTasks}</span></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
