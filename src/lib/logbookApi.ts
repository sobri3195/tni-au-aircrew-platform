import type { LogbookEntry } from '../types';
import { supabaseRest } from './supabase';

interface SupabaseLogbookRow {
  id: string;
  pilot_id: string;
  date: string;
  aircraft: string;
  sortie_type: string;
  duration: number;
  day_night: 'Day' | 'Night';
  ifr: boolean;
  nvg: boolean;
  remarks: string;
}

const mapRowToEntry = (row: SupabaseLogbookRow): LogbookEntry => ({
  id: row.id,
  pilotId: row.pilot_id,
  date: row.date,
  aircraft: row.aircraft,
  sortieType: row.sortie_type,
  duration: row.duration,
  dayNight: row.day_night,
  ifr: row.ifr,
  nvg: row.nvg,
  remarks: row.remarks
});

const mapEntryToRow = (entry: LogbookEntry): SupabaseLogbookRow => ({
  id: entry.id,
  pilot_id: entry.pilotId,
  date: entry.date,
  aircraft: entry.aircraft,
  sortie_type: entry.sortieType,
  duration: entry.duration,
  day_night: entry.dayNight,
  ifr: entry.ifr,
  nvg: entry.nvg,
  remarks: entry.remarks
});

export const fetchLogbookEntries = async (): Promise<LogbookEntry[]> => {
  const rows = await supabaseRest<SupabaseLogbookRow[]>('logbook_entries?order=date.desc', { select: '*' });
  return rows.map(mapRowToEntry);
};

export const createLogbookEntry = async (entry: LogbookEntry): Promise<LogbookEntry> => {
  const rows = await supabaseRest<SupabaseLogbookRow[]>('logbook_entries', { method: 'POST', body: mapEntryToRow(entry) });
  return mapRowToEntry(rows[0]);
};

export const updateLogbookEntry = async (entry: LogbookEntry): Promise<LogbookEntry> => {
  const rows = await supabaseRest<SupabaseLogbookRow[]>(`logbook_entries?id=eq.${encodeURIComponent(entry.id)}`, {
    method: 'PATCH',
    body: mapEntryToRow(entry)
  });
  return mapRowToEntry(rows[0]);
};

export const deleteLogbookEntry = async (id: string): Promise<void> => {
  await supabaseRest<SupabaseLogbookRow[]>(`logbook_entries?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
};
