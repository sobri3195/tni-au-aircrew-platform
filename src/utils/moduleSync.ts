export type ModuleSyncSummary = {
  path: string;
  title: string;
  group: string;
  progress: number;
  openTasks: number;
  totalRecords: number;
  openRecords: number;
  updatedAt: string;
};

export const SHARED_MODULE_SYNC_STORAGE_KEY = 'feature-module-sync-v1';

export const getModuleOperationalStatus = (summary: Pick<ModuleSyncSummary, 'progress' | 'openTasks' | 'openRecords'>) => {
  const blockerCount = summary.openTasks + summary.openRecords;

  if (summary.progress >= 80 && blockerCount <= 1) {
    return { label: 'On Track', tone: 'green' as const };
  }

  if (summary.progress >= 55 && blockerCount <= 4) {
    return { label: 'Needs Push', tone: 'yellow' as const };
  }

  return { label: 'At Risk', tone: 'red' as const };
};
