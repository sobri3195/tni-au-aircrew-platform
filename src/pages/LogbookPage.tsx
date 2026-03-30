import { useEffect, useMemo, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useApp } from '../contexts/AppContext';
import { Table } from '../components/ui/Table';
import { formatDate } from '../utils/date';
import { useMasterData } from '../hooks/useMasterData';
import { useRoleAccess } from '../hooks/useRoleAccess';
import type { LogbookEntry } from '../types';
import { createLogbookEntry, deleteLogbookEntry, fetchLogbookEntries, updateLogbookEntry } from '../lib/logbookApi';
import { isSupabaseConfigured } from '../lib/supabase';

export const LogbookPage = () => {
  const { state, dispatch } = useApp();
  const { masterData } = useMasterData();
  const { canDoAction } = useRoleAccess();
  const canAddLogbook = canDoAction('ADD_LOGBOOK');
  const [syncMessage, setSyncMessage] = useState('');
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [form, setForm] = useLocalStorageState('draft-logbook-form', {
    aircraft: 'F-16C TS-1601',
    sortieType: 'Training',
    duration: '1.5',
    dayNight: 'Day',
    ifr: false,
    nvg: false,
    remarks: ''
  });
  const search = state.globalSearch.trim().toLowerCase();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSyncMessage('Supabase belum aktif. App tetap berjalan dengan local storage.');
      return;
    }

    const load = async () => {
      setIsLoadingSupabase(true);
      try {
        const data = await fetchLogbookEntries();
        dispatch({ type: 'SET_LOGBOOK', payload: data });
        setSyncMessage(`Terhubung ke Supabase. ${data.length} data logbook berhasil dimuat.`);
      } catch (error) {
        setSyncMessage(`Gagal ambil data Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoadingSupabase(false);
      }
    };

    load();
  }, [dispatch]);

  useEffect(() => {
    if (!masterData.aircraft.includes(form.aircraft)) {
      setForm((previous) => ({ ...previous, aircraft: masterData.aircraft[0] ?? '' }));
    }
    if (!masterData.sorties.includes(form.sortieType)) {
      setForm((previous) => ({ ...previous, sortieType: masterData.sorties[0] ?? '' }));
    }
  }, [form.aircraft, form.sortieType, masterData.aircraft, masterData.sorties, setForm]);

  const validationError = useMemo(() => {
    const duration = Number(form.duration);
    if (!form.aircraft.trim()) return 'Aircraft wajib diisi.';
    if (!form.sortieType.trim()) return 'Sortie type wajib diisi.';
    if (!Number.isFinite(duration) || duration <= 0) return 'Duration harus berupa angka lebih dari 0 jam.';
    if (duration > 12) return 'Duration maksimal 12 jam per flight.';
    if (form.nvg && form.dayNight !== 'Night') return 'Sortie NVG hanya bisa dicatat untuk Night flight.';
    if (duration >= 4 && !form.remarks.trim()) return 'Remarks wajib diisi untuk durasi 4 jam atau lebih.';
    return '';
  }, [form]);

  const totals = useMemo(() => {
    const total = state.logbook.reduce((a, b) => a + b.duration, 0);
    const night = state.logbook.filter((e) => e.dayNight === 'Night').reduce((a, b) => a + b.duration, 0);
    const ifr = state.logbook.filter((e) => e.ifr).reduce((a, b) => a + b.duration, 0);
    return { total: total.toFixed(1), night: night.toFixed(1), ifr: ifr.toFixed(1) };
  }, [state.logbook]);

  const visibleRows = useMemo(() => {
    const rows = state.logbook.slice(0, 20);
    if (!search) return rows;
    return rows.filter((item) => `${item.aircraft} ${item.sortieType} ${item.dayNight} ${item.remarks}`.toLowerCase().includes(search));
  }, [search, state.logbook]);

  const submitAdd = async () => {
    if (!canAddLogbook || validationError) {
      return;
    }

    const entry: LogbookEntry = {
      id: `L${Date.now()}`,
      pilotId: 'P001',
      date: new Date().toISOString(),
      aircraft: form.aircraft,
      sortieType: form.sortieType,
      duration: Number(form.duration),
      dayNight: form.dayNight as 'Day' | 'Night',
      ifr: form.ifr,
      nvg: form.nvg,
      remarks: form.remarks
    };

    if (!isSupabaseConfigured) {
      dispatch({ type: 'ADD_LOGBOOK', payload: entry });
      setSyncMessage('Data ditambah ke local storage. Hubungkan Supabase untuk sync cloud.');
      return;
    }

    try {
      const created = await createLogbookEntry(entry);
      dispatch({ type: 'ADD_LOGBOOK', payload: created });
      setSyncMessage(`Insert berhasil ke Supabase (ID: ${created.id}).`);
    } catch (error) {
      setSyncMessage(`Insert gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const submitDelete = async (entryId: string) => {
    if (!canAddLogbook) return;

    if (!isSupabaseConfigured) {
      dispatch({ type: 'DELETE_LOGBOOK', payload: entryId });
      setSyncMessage('Data dihapus dari local storage.');
      return;
    }

    try {
      await deleteLogbookEntry(entryId);
      dispatch({ type: 'DELETE_LOGBOOK', payload: entryId });
      setSyncMessage(`Delete berhasil untuk ID ${entryId}.`);
    } catch (error) {
      setSyncMessage(`Delete gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const submitQuickUpdate = async (item: LogbookEntry) => {
    if (!canAddLogbook) return;

    const newRemarks = window.prompt('Update remarks', item.remarks);
    if (newRemarks === null) return;

    const updatedEntry = { ...item, remarks: newRemarks };

    if (!isSupabaseConfigured) {
      dispatch({ type: 'UPDATE_LOGBOOK', payload: updatedEntry });
      setSyncMessage('Data diupdate di local storage.');
      return;
    }

    try {
      const updated = await updateLogbookEntry(updatedEntry);
      dispatch({ type: 'UPDATE_LOGBOOK', payload: updated });
      setSyncMessage(`Update berhasil untuk ID ${updated.id}.`);
    } catch (error) {
      setSyncMessage(`Update gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">E-Logbook</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">Total Jam: {totals.total}</div>
        <div className="card">Jam Night: {totals.night}</div>
        <div className="card">Jam IFR: {totals.ifr}</div>
        <button className="rounded-xl bg-sky-700 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(validationError) || !canAddLogbook} onClick={submitAdd}>
          Add Flight
        </button>
      </div>
      <div className="card grid gap-2 md:grid-cols-3">
        <select className="input" value={form.aircraft} onChange={(e) => setForm((p) => ({ ...p, aircraft: e.target.value }))}>
          {masterData.aircraft.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="input" value={form.sortieType} onChange={(e) => setForm((p) => ({ ...p, sortieType: e.target.value }))}>
          {masterData.sorties.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Duration" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
        <select className="input" value={form.dayNight} onChange={(e) => setForm((p) => ({ ...p, dayNight: e.target.value as 'Day' | 'Night' }))}>
          <option value="Day">Day</option>
          <option value="Night">Night</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ifr} onChange={(e) => setForm((p) => ({ ...p, ifr: e.target.checked }))} /> IFR</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.nvg} onChange={(e) => setForm((p) => ({ ...p, nvg: e.target.checked }))} /> NVG</label>
        <textarea className="input md:col-span-3" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
      </div>
      {!canAddLogbook && <p className="text-sm text-amber-600">Role saat ini hanya bisa melihat logbook.</p>}
      {validationError && <p className="text-sm text-rose-600">{validationError}</p>}
      <p className="text-sm text-slate-500">{isLoadingSupabase ? 'Memuat data dari Supabase...' : syncMessage}</p>
      <Table headers={['Date', 'Aircraft', 'Type', 'Duration', 'Day/Night', 'IFR', 'NVG', 'Remarks', 'Aksi']}>
        {visibleRows.map((item) => (
          <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
            <td className="px-3 py-2">{formatDate(item.date)}</td>
            <td className="px-3 py-2">{item.aircraft}</td>
            <td className="px-3 py-2">{item.sortieType}</td>
            <td className="px-3 py-2">{item.duration}</td>
            <td className="px-3 py-2">{item.dayNight}</td>
            <td className="px-3 py-2">{item.ifr ? 'Yes' : 'No'}</td>
            <td className="px-3 py-2">{item.nvg ? 'Yes' : 'No'}</td>
            <td className="px-3 py-2">{item.remarks}</td>
            <td className="px-3 py-2">
              <div className="flex gap-2">
                <button className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700" disabled={!canAddLogbook} onClick={() => submitQuickUpdate(item)}>
                  Edit
                </button>
                <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white disabled:opacity-60" disabled={!canAddLogbook} onClick={() => submitDelete(item.id)}>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
        {visibleRows.length === 0 && (
          <tr>
            <td className="px-3 py-5 text-center text-sm text-slate-500" colSpan={9}>
              Tidak ada data logbook yang sesuai dengan global search.
            </td>
          </tr>
        )}
      </Table>
    </section>
  );
};
