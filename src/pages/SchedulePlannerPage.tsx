import { useEffect, useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { useMasterData } from '../hooks/useMasterData';
import { daysUntil } from '../utils/date';

const isOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

type CrewAssignment = {
  pilotId: string;
  notes: string;
};

type FitCheckResult = {
  status: 'Fit' | 'Conditional' | 'No-Go';
  reasons: string[];
  score: number;
};

const evaluateCrewFit = (
  pilotId: string,
  state: ReturnType<typeof useApp>['state'],
  itemStartIso: string
): FitCheckResult => {
  const profile = state.profiles.find((entry) => entry.id === pilotId);
  if (!profile) {
    return { status: 'No-Go', reasons: ['Profil aircrew tidak ditemukan.'], score: 20 };
  }

  const reasons: string[] = [];
  let score = 100;
  const itemStart = new Date(itemStartIso).getTime();
  const pilotTrainings = state.trainings.filter((training) => training.pilotId === pilotId);
  const expiredTrainings = pilotTrainings.filter((training) => daysUntil(training.expiryDate) <= 0).length;
  const expiringTrainings = pilotTrainings.filter((training) => daysUntil(training.expiryDate) > 0 && daysUntil(training.expiryDate) < 30).length;
  const hours7d = state.logbook
    .filter((entry) => entry.pilotId === pilotId && Date.now() - new Date(entry.date).getTime() <= 1000 * 60 * 60 * 24 * 7)
    .reduce((sum, entry) => sum + entry.duration, 0);
  const nightCurrency = daysUntil(profile.nvgCurrencyUntil);
  const ifrCurrency = daysUntil(profile.ifrCurrencyUntil);
  const overlapping = state.schedule.filter((scheduleItem) => {
    const scheduleStart = new Date(scheduleItem.start).getTime();
    return Math.abs(scheduleStart - itemStart) <= 1000 * 60 * 60 * 6;
  }).length;

  if (profile.status === 'Grounded') {
    reasons.push('Status profile Grounded.');
    score -= 60;
  } else if (profile.status === 'Limited') {
    reasons.push('Status profile Limited butuh approval tambahan.');
    score -= 25;
  }

  if (expiredTrainings > 0) {
    reasons.push(`${expiredTrainings} training sudah expired.`);
    score -= 30;
  }
  if (expiringTrainings > 0) {
    reasons.push(`${expiringTrainings} training expiring <30 hari.`);
    score -= 12;
  }
  if (nightCurrency <= 7) {
    reasons.push(`NVG currency tinggal ${nightCurrency} hari.`);
    score -= 10;
  }
  if (ifrCurrency <= 7) {
    reasons.push(`IFR currency tinggal ${ifrCurrency} hari.`);
    score -= 10;
  }
  if (hours7d > 18) {
    reasons.push(`Jam terbang 7 hari ${hours7d.toFixed(1)} jam.`);
    score -= 12;
  }
  if (state.orm.some((orm) => orm.riskLevel === 'High' && orm.crewRestHours < 8)) {
    reasons.push('Ada ORM high-risk dengan crew rest <8 jam.');
    score -= 15;
  }
  if (state.notams.filter((notam) => !notam.acknowledged).length > 4) {
    reasons.push('NOTAM prioritas masih banyak yang belum di-ack.');
    score -= 8;
  }
  if (overlapping > 2) {
    reasons.push('Pilot sudah dekat dengan 2+ event lain di window 6 jam.');
    score -= 15;
  }

  if (score <= 45) return { status: 'No-Go', reasons, score: Math.max(20, score) };
  if (score <= 75) return { status: 'Conditional', reasons, score };
  return { status: 'Fit', reasons: reasons.length ? reasons : ['Semua indikator readiness dalam batas aman.'], score };
};

export const SchedulePlannerPage = () => {
  const { state, dispatch } = useApp();
  const { canDoAction } = useRoleAccess();
  const canAddSchedule = canDoAction('ADD_SCHEDULE');
  const { masterData } = useMasterData();
  const search = state.globalSearch.trim().toLowerCase();
  const [title, setTitle] = useLocalStorageState('draft-schedule-title', '');
  const [category, setCategory] = useLocalStorageState<'Sortie' | 'Training' | 'Briefing'>('draft-schedule-category', 'Sortie');
  const [base, setBase] = useLocalStorageState('draft-schedule-base', 'Lanud Iswahjudi');
  const [start, setStart] = useLocalStorageState('draft-schedule-start', '');
  const [end, setEnd] = useLocalStorageState('draft-schedule-end', '');
  const [selectedPilotId, setSelectedPilotId] = useLocalStorageState('draft-schedule-pilot', state.profiles[0]?.id ?? 'P001');
  const [assignmentNotes, setAssignmentNotes] = useLocalStorageState('draft-schedule-notes', '');
  const [assignments, setAssignments] = useLocalStorageState<Record<string, CrewAssignment>>('schedule-assignments-v1', {});

  useEffect(() => {
    if (!masterData.bases.includes(base)) {
      setBase(masterData.bases[0] ?? '');
    }
  }, [base, masterData.bases, setBase]);

  const weeklyItems = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const items = state.schedule
      .filter((item) => {
        const itemStart = new Date(item.start);
        return itemStart >= weekStart && itemStart < weekEnd;
      })
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
    if (!search) return items;
    return items.filter((item) => `${item.title} ${item.category} ${item.base}`.toLowerCase().includes(search));
  }, [search, state.schedule]);

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

  const validationError = useMemo(() => {
    if (!title.trim()) return 'Judul kegiatan wajib diisi.';
    if (!start || !end) return 'Waktu mulai dan selesai wajib diisi.';
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Format waktu tidak valid.';
    if (endDate <= startDate) return 'Waktu selesai harus lebih besar dari waktu mulai.';
    if (!base.trim()) return 'Base wajib dipilih.';
    if (!selectedPilotId) return 'Aircrew assignment wajib dipilih.';
    return '';
  }, [base, end, selectedPilotId, start, title]);

  const selectedFit = useMemo(() => {
    if (!start || !selectedPilotId) return null;
    return evaluateCrewFit(selectedPilotId, state, new Date(start).toISOString());
  }, [selectedPilotId, start, state]);

  const plannerOverview = useMemo(() => {
    const assignedCount = weeklyItems.filter((item) => assignments[item.id]?.pilotId).length;
    const blockedCount = weeklyItems.filter((item) => {
      const pilotId = assignments[item.id]?.pilotId;
      return pilotId ? evaluateCrewFit(pilotId, state, item.start).status === 'No-Go' : false;
    }).length;
    return { assignedCount, blockedCount };
  }, [assignments, state, weeklyItems]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Schedule & Sortie Planner</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Kalender mingguan mock, deteksi konflik overlap, assignment crew, dan fit-check readiness sebelum sortie.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="card">Assigned minggu ini: <span className="text-xl font-bold">{plannerOverview.assignedCount}</span></div>
        <div className="card">Conflict overlap: <span className="text-xl font-bold text-amber-600">{conflictIds.size}</span></div>
        <div className="card">Crew blocked: <span className="text-xl font-bold text-rose-600">{plannerOverview.blockedCount}</span></div>
        <div className="card">NOTAM pending: <span className="text-xl font-bold">{state.notams.filter((item) => !item.acknowledged).length}</span></div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-6">
        <input className="input md:col-span-2" placeholder="Judul kegiatan" value={title} onChange={(event) => setTitle(event.target.value)} />
        <select className="input" value={category} onChange={(event) => setCategory(event.target.value as 'Sortie' | 'Training' | 'Briefing')}>
          <option value="Sortie">Sortie</option>
          <option value="Training">Training</option>
          <option value="Briefing">Briefing</option>
        </select>
        <input className="input" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
        <input className="input" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
        <select className="input" value={base} onChange={(event) => setBase(event.target.value)}>
          {masterData.bases.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="input md:col-span-2" value={selectedPilotId} onChange={(event) => setSelectedPilotId(event.target.value)}>
          {state.profiles.map((pilot) => (
            <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
          ))}
        </select>
        <textarea className="input md:col-span-3" placeholder="Assignment note / mission intent" value={assignmentNotes} onChange={(event) => setAssignmentNotes(event.target.value)} />
        <button
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={Boolean(validationError) || !canAddSchedule}
          onClick={() => {
            if (!canAddSchedule || validationError) return;
            const newItemId = `S${state.schedule.length + 1}`;
            dispatch({
              type: 'ADD_SCHEDULE',
              payload: {
                id: newItemId,
                title,
                category,
                base,
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString()
              }
            });
            setAssignments((current) => ({
              ...current,
              [newItemId]: {
                pilotId: selectedPilotId,
                notes: assignmentNotes
              }
            }));
            dispatch({ type: 'ADD_AUDIT', payload: { action: 'UPDATE', entity: 'CrewAssignment', detail: `${newItemId}:${selectedPilotId}`, role: state.role } });
            setTitle('');
            setStart('');
            setEnd('');
            setAssignmentNotes('');
          }}
        >
          Tambah Kegiatan
        </button>
      </div>
      {!canAddSchedule && <p className="text-sm text-amber-600">Role saat ini hanya bisa melihat jadwal.</p>}
      {validationError && <p className="text-sm text-rose-600">{validationError}</p>}

      {selectedFit && (
        <div className="card">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">Crew Fit Check</h3>
            <Badge label={`${selectedFit.status} • ${selectedFit.score}/100`} tone={selectedFit.status === 'Fit' ? 'green' : selectedFit.status === 'Conditional' ? 'yellow' : 'red'} />
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            {selectedFit.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {weeklyItems.map((item) => {
          const assignment = assignments[item.id];
          const pilot = state.profiles.find((profile) => profile.id === assignment?.pilotId);
          const fitCheck = assignment?.pilotId ? evaluateCrewFit(assignment.pilotId, state, item.start) : null;
          return (
            <div key={item.id} className="card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.start).toLocaleString('id-ID')} - {new Date(item.end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {item.base}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={item.category} tone="blue" />
                  {conflictIds.has(item.id) && <Badge label="Overlap" tone="red" />}
                  {fitCheck && <Badge label={fitCheck.status} tone={fitCheck.status === 'Fit' ? 'green' : fitCheck.status === 'Conditional' ? 'yellow' : 'red'} />}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  {assignment ? (
                    <>
                      <p className="font-semibold">Assigned: {pilot?.name ?? assignment.pilotId}</p>
                      <p className="text-xs text-slate-500">{assignment.notes || 'Tidak ada catatan assignment.'}</p>
                      {fitCheck && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                          {fitCheck.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500">Belum ada crew assignment.</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 md:min-w-56">
                  <select
                    className="input"
                    value={assignment?.pilotId ?? ''}
                    onChange={(event) => {
                      const pilotId = event.target.value;
                      setAssignments((current) => ({
                        ...current,
                        [item.id]: { pilotId, notes: current[item.id]?.notes ?? assignmentNotes }
                      }));
                      dispatch({ type: 'ADD_AUDIT', payload: { action: 'UPDATE', entity: 'CrewAssignment', detail: `${item.id}:${pilotId}`, role: state.role } });
                    }}
                    disabled={!canAddSchedule}
                  >
                    <option value="">Pilih aircrew</option>
                    {state.profiles.map((pilotOption) => (
                      <option key={pilotOption.id} value={pilotOption.id}>{pilotOption.name}</option>
                    ))}
                  </select>
                  <button
                    className="btn disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canAddSchedule || !assignment}
                    onClick={() => {
                      if (!canAddSchedule || !assignment) return;
                      setAssignments((current) => ({
                        ...current,
                        [item.id]: {
                          ...assignment,
                          notes: `${assignment.notes || 'No note'} • Reviewed ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                        }
                      }));
                    }}
                  >
                    Mark Reviewed
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {weeklyItems.length === 0 && <div className="card text-sm text-slate-500">Tidak ada jadwal minggu ini yang sesuai pencarian.</div>}
      </div>
    </section>
  );
};
