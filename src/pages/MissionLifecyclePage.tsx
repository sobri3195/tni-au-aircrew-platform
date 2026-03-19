import { useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useApp } from '../contexts/AppContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { Badge } from '../components/ui/Badge';
import { daysUntil } from '../utils/date';

const missionStages = ['Draft', 'Briefing', 'ORM Review', 'Go/No-Go', 'Approved', 'Airborne', 'Debrief', 'Closed'] as const;
type MissionStage = (typeof missionStages)[number];

type MissionApproval = {
  role: string;
  approved: boolean;
  dueHours: number;
};

type MissionRecord = {
  id: string;
  title: string;
  missionType: string;
  base: string;
  assignedPilotId: string;
  scheduledStart: string;
  stage: MissionStage;
  objective: string;
  riskSummary: string;
  goNoGoDecision: 'Pending' | 'Go' | 'Conditional Go' | 'No-Go';
  actionOwner: string;
  evidenceCount: number;
  approvals: MissionApproval[];
};

const missionSeed = (now = new Date()): MissionRecord[] => [
  {
    id: 'MIS-001',
    title: 'Night Intercept Window',
    missionType: 'High-Risk Ops',
    base: 'Lanud Iswahjudi',
    assignedPilotId: 'P001',
    scheduledStart: new Date(now.getTime() + 1000 * 60 * 60 * 6).toISOString(),
    stage: 'Go/No-Go',
    objective: 'Intercept training dengan fokus weather diversion dan low-light recovery.',
    riskSummary: 'Crew rest borderline, NOTAM restriction aktif, mitigation fuel reserve sudah diusulkan.',
    goNoGoDecision: 'Pending',
    actionOwner: 'Ops Officer',
    evidenceCount: 3,
    approvals: [
      { role: 'Pilot', approved: true, dueHours: 0 },
      { role: 'Flight Safety Officer', approved: true, dueHours: 0 },
      { role: 'Ops Officer', approved: false, dueHours: 2 },
      { role: 'Commander/Admin', approved: false, dueHours: 3 }
    ]
  },
  {
    id: 'MIS-002',
    title: 'Routine Navigation Sortie',
    missionType: 'Routine Ops',
    base: 'Lanud Halim',
    assignedPilotId: 'P003',
    scheduledStart: new Date(now.getTime() + 1000 * 60 * 60 * 20).toISOString(),
    stage: 'Briefing',
    objective: 'Navigation route validation dan instrument approach recurrent.',
    riskSummary: 'Profil risiko normal, evidence pre-brief belum lengkap.',
    goNoGoDecision: 'Pending',
    actionOwner: 'Pilot',
    evidenceCount: 1,
    approvals: [
      { role: 'Pilot', approved: false, dueHours: 8 },
      { role: 'Ops Officer', approved: false, dueHours: 10 }
    ]
  }
];

const stageTone = (stage: MissionStage) => {
  if (stage === 'Closed') return 'green' as const;
  if (stage === 'Airborne' || stage === 'Approved') return 'blue' as const;
  if (stage === 'Go/No-Go' || stage === 'ORM Review') return 'yellow' as const;
  return 'slate' as const;
};

const decisionTone = (decision: MissionRecord['goNoGoDecision']) => {
  if (decision === 'Go') return 'green' as const;
  if (decision === 'Conditional Go') return 'yellow' as const;
  if (decision === 'No-Go') return 'red' as const;
  return 'slate' as const;
};

export const MissionLifecyclePage = () => {
  const { state, dispatch } = useApp();
  const { canWriteCurrentRoute } = useRoleAccess();
  const [missions, setMissions] = useLocalStorageState<MissionRecord[]>('mission-lifecycle-board-v1', missionSeed());
  const [title, setTitle] = useLocalStorageState('mission-lifecycle-title', '');
  const [missionType, setMissionType] = useLocalStorageState<'Training' | 'Routine Ops' | 'High-Risk Ops'>('mission-lifecycle-type', 'Routine Ops');
  const [assignedPilotId, setAssignedPilotId] = useLocalStorageState('mission-lifecycle-pilot', state.profiles[0]?.id ?? 'P001');
  const [scheduledStart, setScheduledStart] = useLocalStorageState('mission-lifecycle-start', '');
  const [objective, setObjective] = useLocalStorageState('mission-lifecycle-objective', '');
  const [riskSummary, setRiskSummary] = useLocalStorageState('mission-lifecycle-risk', '');

  const missionOverview = useMemo(() => {
    const pendingGoNoGo = missions.filter((mission) => mission.stage === 'Go/No-Go' && mission.goNoGoDecision === 'Pending').length;
    const overdueApprovals = missions.flatMap((mission) => mission.approvals.filter((approval) => !approval.approved && approval.dueHours <= 0)).length;
    const activeMissions = missions.filter((mission) => mission.stage !== 'Closed').length;
    return { pendingGoNoGo, overdueApprovals, activeMissions };
  }, [missions]);

  const validationError = useMemo(() => {
    if (!title.trim()) return 'Judul misi wajib diisi.';
    if (!scheduledStart) return 'Waktu misi wajib diisi.';
    if (!objective.trim()) return 'Objective misi wajib diisi.';
    return '';
  }, [objective, scheduledStart, title]);

  const updateMission = (missionId: string, updater: (mission: MissionRecord) => MissionRecord) => {
    setMissions((current) => current.map((mission) => (mission.id === missionId ? updater(mission) : mission)));
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Mission Lifecycle Board</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Workflow pre-brief → go/no-go → airborne → debrief dengan SLA approval dan evidence tracking.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">Mission aktif: <span className="text-xl font-bold">{missionOverview.activeMissions}</span></div>
        <div className="card">Pending Go/No-Go: <span className="text-xl font-bold text-amber-600">{missionOverview.pendingGoNoGo}</span></div>
        <div className="card">Approval overdue: <span className="text-xl font-bold text-rose-600">{missionOverview.overdueApprovals}</span></div>
      </div>

      <div className="card grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input className="input xl:col-span-2" placeholder="Judul misi" value={title} onChange={(event) => setTitle(event.target.value)} />
        <select className="input" value={missionType} onChange={(event) => setMissionType(event.target.value as 'Training' | 'Routine Ops' | 'High-Risk Ops')}>
          <option value="Training">Training</option>
          <option value="Routine Ops">Routine Ops</option>
          <option value="High-Risk Ops">High-Risk Ops</option>
        </select>
        <select className="input" value={assignedPilotId} onChange={(event) => setAssignedPilotId(event.target.value)}>
          {state.profiles.map((pilot) => (
            <option key={pilot.id} value={pilot.id}>{pilot.name}</option>
          ))}
        </select>
        <input className="input" type="datetime-local" value={scheduledStart} onChange={(event) => setScheduledStart(event.target.value)} />
        <button
          className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canWriteCurrentRoute || Boolean(validationError)}
          onClick={() => {
            if (!canWriteCurrentRoute || validationError) return;
            const newMission: MissionRecord = {
              id: `MIS-${missions.length + 1}`,
              title,
              missionType,
              base: 'Lanud Iswahjudi',
              assignedPilotId,
              scheduledStart: new Date(scheduledStart).toISOString(),
              stage: 'Draft',
              objective,
              riskSummary: riskSummary.trim() || 'Risk assessment awal belum diisi.',
              goNoGoDecision: 'Pending',
              actionOwner: 'Pilot',
              evidenceCount: 0,
              approvals: [
                { role: 'Pilot', approved: false, dueHours: 12 },
                { role: 'Ops Officer', approved: false, dueHours: 18 },
                { role: 'Commander/Admin', approved: false, dueHours: 24 }
              ]
            };
            setMissions((current) => [newMission, ...current]);
            dispatch({ type: 'ADD_AUDIT', payload: { action: 'CREATE', entity: 'MissionLifecycle', detail: newMission.id, role: state.role } });
            setTitle('');
            setScheduledStart('');
            setObjective('');
            setRiskSummary('');
          }}
        >
          Tambah Misi
        </button>
        <textarea className="input md:col-span-2 xl:col-span-3" placeholder="Objective misi" value={objective} onChange={(event) => setObjective(event.target.value)} />
        <textarea className="input md:col-span-2 xl:col-span-3" placeholder="Risk summary / evidence note" value={riskSummary} onChange={(event) => setRiskSummary(event.target.value)} />
      </div>
      {!canWriteCurrentRoute && <p className="text-sm text-amber-600">Role saat ini hanya bisa memonitor mission board.</p>}
      {validationError && <p className="text-sm text-rose-600">{validationError}</p>}

      <div className="space-y-3">
        {missions.map((mission) => {
          const pilot = state.profiles.find((item) => item.id === mission.assignedPilotId);
          const pilotTrainingRisk = state.trainings.filter((item) => item.pilotId === mission.assignedPilotId && daysUntil(item.expiryDate) < 30).length;
          const pilotHighRiskOrm = state.orm.filter((item) => item.riskLevel === 'High').length;
          const pendingApprovals = mission.approvals.filter((approval) => !approval.approved).length;
          const nextStageIndex = missionStages.indexOf(mission.stage);

          return (
            <div key={mission.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{mission.title}</h3>
                    <Badge label={mission.stage} tone={stageTone(mission.stage)} />
                    <Badge label={mission.goNoGoDecision} tone={decisionTone(mission.goNoGoDecision)} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{mission.id} • {mission.base} • {pilot?.name ?? mission.assignedPilotId} • {new Date(mission.scheduledStart).toLocaleString('id-ID')}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{mission.objective}</p>
                </div>
                <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Action owner</p>
                  <p className="font-semibold">{mission.actionOwner}</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Risk & package summary</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{mission.riskSummary}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                      <p className="text-xs text-slate-500">Evidence</p>
                      <p className="text-xl font-bold">{mission.evidenceCount}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                      <p className="text-xs text-slate-500">Pending approval</p>
                      <p className="text-xl font-bold">{pendingApprovals}</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                      <p className="text-xs text-slate-500">Readiness blockers</p>
                      <p className="text-xl font-bold">{pilotTrainingRisk + pilotHighRiskOrm}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Approval chain</p>
                  <div className="mt-2 space-y-2">
                    {mission.approvals.map((approval) => (
                      <div key={`${mission.id}-${approval.role}`} className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                        <div>
                          <p className="font-medium">{approval.role}</p>
                          <p className="text-xs text-slate-500">SLA {approval.dueHours <= 0 ? 'overdue' : `${approval.dueHours}h`}</p>
                        </div>
                        {approval.approved ? (
                          <Badge label="Approved" tone="green" />
                        ) : (
                          <button
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600"
                            disabled={!canWriteCurrentRoute}
                            onClick={() => {
                              if (!canWriteCurrentRoute) return;
                              updateMission(mission.id, (current) => ({
                                ...current,
                                approvals: current.approvals.map((item) => item.role === approval.role ? { ...item, approved: true, dueHours: 0 } : item),
                                actionOwner: current.approvals.find((item) => item.role !== approval.role && !item.approved)?.role ?? 'Commander/Admin'
                              }));
                              dispatch({ type: 'ADD_AUDIT', payload: { action: 'UPDATE', entity: 'MissionApproval', detail: `${mission.id}:${approval.role}`, role: state.role } });
                            }}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {missionStages.map((stage, index) => (
                  <div key={`${mission.id}-${stage}`} className={`rounded-full px-3 py-1 text-xs font-semibold ${index <= nextStageIndex ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {stage}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canWriteCurrentRoute || nextStageIndex >= missionStages.length - 1}
                  onClick={() => {
                    if (!canWriteCurrentRoute || nextStageIndex >= missionStages.length - 1) return;
                    updateMission(mission.id, (current) => ({
                      ...current,
                      stage: missionStages[Math.min(missionStages.indexOf(current.stage) + 1, missionStages.length - 1)],
                      evidenceCount: current.evidenceCount + 1
                    }));
                    dispatch({ type: 'ADD_AUDIT', payload: { action: 'UPDATE', entity: 'MissionStage', detail: mission.id, role: state.role } });
                  }}
                >
                  Lanjut Stage
                </button>
                {(['Go', 'Conditional Go', 'No-Go'] as const).map((decision) => (
                  <button
                    key={decision}
                    className="btn disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canWriteCurrentRoute}
                    onClick={() => {
                      if (!canWriteCurrentRoute) return;
                      updateMission(mission.id, (current) => ({ ...current, goNoGoDecision: decision, stage: decision === 'No-Go' ? 'Go/No-Go' : current.stage }));
                      dispatch({ type: 'ADD_AUDIT', payload: { action: 'UPDATE', entity: 'MissionDecision', detail: `${mission.id}:${decision}`, role: state.role } });
                    }}
                  >
                    {decision}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
