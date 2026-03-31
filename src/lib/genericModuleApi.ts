import { supabaseRest } from "./supabase";

export type SupabaseModuleRecordRow = {
  id: string;
  module_path: string;
  status: string;
  values: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type SupabaseModuleTaskRow = {
  id: string;
  module_path: string;
  text: string;
  done: boolean;
  owner: string;
  updated_at: string;
};

export type ModuleRecordPayload = {
  id: string;
  status: string;
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type ModuleTaskPayload = {
  id: string;
  text: string;
  done: boolean;
  owner: string;
};

const escapeValue = (value: string) => value.replace(/"/g, '\\"');

const buildInFilter = (ids: string[]) =>
  ids.map((item) => `"${escapeValue(item)}"`).join(",");

export const fetchModuleRecords = async (
  modulePath: string,
): Promise<ModuleRecordPayload[]> => {
  const rows = await supabaseRest<SupabaseModuleRecordRow[]>(
    `module_records?module_path=eq.${encodeURIComponent(modulePath)}&order=updated_at.desc`,
    { select: "*" },
  );

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    values: row.values ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const fetchModuleTasks = async (
  modulePath: string,
): Promise<ModuleTaskPayload[]> => {
  const rows = await supabaseRest<SupabaseModuleTaskRow[]>(
    `module_tasks?module_path=eq.${encodeURIComponent(modulePath)}&order=updated_at.desc`,
    { select: "*" },
  );

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    done: row.done,
    owner: row.owner,
  }));
};

export const upsertModuleRecords = async (
  modulePath: string,
  records: ModuleRecordPayload[],
): Promise<void> => {
  const ids = records.map((record) => record.id);
  if (ids.length > 0) {
    await supabaseRest(
      `module_records?module_path=eq.${encodeURIComponent(modulePath)}&id=not.in.(${buildInFilter(ids)})`,
      { method: "DELETE" },
    );
  } else {
    await supabaseRest(
      `module_records?module_path=eq.${encodeURIComponent(modulePath)}`,
      { method: "DELETE" },
    );
    return;
  }

  const payload = records.map((record) => ({
    id: record.id,
    module_path: modulePath,
    status: record.status,
    values: record.values,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  }));

  await supabaseRest("module_records?on_conflict=id", {
    method: "POST",
    body: payload,
  });
};

export const upsertModuleTasks = async (
  modulePath: string,
  tasks: ModuleTaskPayload[],
): Promise<void> => {
  const ids = tasks.map((task) => task.id);
  if (ids.length > 0) {
    await supabaseRest(
      `module_tasks?module_path=eq.${encodeURIComponent(modulePath)}&id=not.in.(${buildInFilter(ids)})`,
      { method: "DELETE" },
    );
  } else {
    await supabaseRest(
      `module_tasks?module_path=eq.${encodeURIComponent(modulePath)}`,
      { method: "DELETE" },
    );
    return;
  }

  const now = new Date().toISOString();
  const payload = tasks.map((task) => ({
    id: task.id,
    module_path: modulePath,
    text: task.text,
    done: task.done,
    owner: task.owner,
    updated_at: now,
  }));

  await supabaseRest("module_tasks?on_conflict=id", {
    method: "POST",
    body: payload,
  });
};
