import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import type { MissionProfile } from "../types";
import { daysUntil } from "../utils/date";
import {
  calculateReadinessAlerts,
  calculateReadinessComponents,
} from "../utils/readiness";
import { Badge } from "../components/ui/Badge";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import {
  initialRikkesRecords,
  calculateRikkesSummary,
} from "../data/rikkesData";
import { Modal } from "../components/ui/Modal";

const Card = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="card border-slate-200/80 bg-white/90 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

type ReadinessOverride = {
  id: string;
  targetType: "Crew" | "Mission";
  targetLabel: string;
  decision: "No-Go" | "Conditional Go" | "Exceptional Go";
  reason: string;
  mitigation: string;
  createdAt: string;
  expiresAt: string;
  role: string;
};

type PredictiveAlert = {
  id: string;
  crewId: string;
  crewName: string;
  score: number;
  tier: "Normal" | "Monitor" | "FSO Review" | "Command Attention";
  reasons: string[];
  actions: string[];
};

type WingReadiness = {
  wing: string;
  averageScore: number;
  aircrew: number;
  limitedCrew: number;
  expiringItems: number;
};

type UpcomingMissionBoardItem = {
  id: string;
  title: string;
  start: string;
  base: string;
  assignedCrew: string;
  crewScore: number;
  recommendation: "GO" | "CONDITIONAL GO" | "NO-GO";
  riskFactors: string[];
};

const statusTone = (score: number) => {
  if (score >= 80)
    return {
      label: "GREEN",
      tone: "green" as const,
      style: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    };
  if (score >= 60)
    return {
      label: "AMBER",
      tone: "yellow" as const,
      style: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    };
  return {
    label: "RED",
    tone: "red" as const,
    style: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  };
};

const getPilotReadiness = (
  pilotId: string,
  state: ReturnType<typeof useApp>["state"],
) => {
  const pilot = state.profiles.find((profile) => profile.id === pilotId);
  if (!pilot) {
    return {
      score: 20,
      tone: "red" as const,
      breakdown: [
        {
          label: "Data quality",
          value: 20,
          note: "Profil aircrew tidak ditemukan.",
        },
      ],
    };
  }

  const pilotTrainings = state.trainings.filter(
    (item) => item.pilotId === pilotId,
  );
  const recentFlights = state.logbook.filter(
    (item) =>
      item.pilotId === pilotId &&
      Date.now() - new Date(item.date).getTime() <= 1000 * 60 * 60 * 24 * 30,
  );
  const hours7d = state.logbook
    .filter(
      (item) =>
        item.pilotId === pilotId &&
        Date.now() - new Date(item.date).getTime() <= 1000 * 60 * 60 * 24 * 7,
    )
    .reduce((sum, item) => sum + item.duration, 0);
  const expiredTrainings = pilotTrainings.filter(
    (item) => daysUntil(item.expiryDate) <= 0,
  ).length;
  const expiringTrainings = pilotTrainings.filter(
    (item) => daysUntil(item.expiryDate) > 0 && daysUntil(item.expiryDate) < 30,
  ).length;
  const medical =
    pilot.status === "Active" ? 96 : pilot.status === "Limited" ? 62 : 25;
  const training = Math.max(
    25,
    100 - expiredTrainings * 28 - expiringTrainings * 10,
  );
  const fatigue = Math.max(
    30,
    100 -
      Math.max(0, hours7d - 18) * 3.2 -
      recentFlights.filter((flight) => flight.dayNight === "Night").length * 4,
  );
  const qualification = Math.max(
    35,
    100 -
      Math.max(0, 14 - recentFlights.length) * 3 -
      (daysUntil(pilot.ifrCurrencyUntil) < 14 ? 12 : 0) -
      (daysUntil(pilot.nvgCurrencyUntil) < 14 ? 12 : 0),
  );
  const score = Math.round(
    medical * 0.3 + training * 0.28 + fatigue * 0.2 + qualification * 0.22,
  );

  return {
    score,
    tone:
      score >= 80
        ? ("green" as const)
        : score >= 60
          ? ("yellow" as const)
          : ("red" as const),
    breakdown: [
      { label: "Medical", value: medical, note: `Status ${pilot.status}` },
      {
        label: "Training",
        value: training,
        note: `${expiredTrainings} expired • ${expiringTrainings} expiring`,
      },
      {
        label: "Fatigue",
        value: fatigue,
        note: `${hours7d.toFixed(1)} jam / 7 hari`,
      },
      {
        label: "Qualification",
        value: qualification,
        note: `${recentFlights.length} sortie / 30 hari`,
      },
    ],
  };
};

const buildWingReadiness = (
  state: ReturnType<typeof useApp>["state"],
): WingReadiness[] => {
  const grouped = state.profiles.reduce<Record<string, typeof state.profiles>>(
    (acc, pilot) => {
      acc[pilot.wing] = [...(acc[pilot.wing] ?? []), pilot];
      return acc;
    },
    {},
  );

  return Object.entries(grouped)
    .map(([wing, pilots]) => {
      const averageScore = Math.round(
        pilots.reduce(
          (sum, pilot) => sum + getPilotReadiness(pilot.id, state).score,
          0,
        ) / Math.max(pilots.length, 1),
      );
      const limitedCrew = pilots.filter(
        (pilot) => pilot.status !== "Active",
      ).length;
      const expiringItems = state.trainings.filter(
        (item) =>
          pilots.some((pilot) => pilot.id === item.pilotId) &&
          daysUntil(item.expiryDate) < 30,
      ).length;

      return {
        wing,
        averageScore,
        aircrew: pilots.length,
        limitedCrew,
        expiringItems,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore);
};

const buildUpcomingMissionBoard = (
  state: ReturnType<typeof useApp>["state"],
  overrides: ReadinessOverride[],
): UpcomingMissionBoardItem[] =>
  state.schedule
    .filter((item) => item.category === "Sortie")
    .filter((item) => {
      const start = new Date(item.start).getTime();
      return start >= Date.now() && start <= Date.now() + 1000 * 60 * 60 * 72;
    })
    .slice(0, 6)
    .map((item, index) => {
      const assignedPilot = state.profiles[index % state.profiles.length];
      const crewScore = getPilotReadiness(assignedPilot.id, state).score;
      const override = overrides.find(
        (entry) => entry.targetLabel === assignedPilot.name,
      );
      const riskFactors = [
        crewScore < 60 ? `Crew score ${crewScore}/100` : null,
        assignedPilot.status !== "Active"
          ? `Crew status ${assignedPilot.status}`
          : null,
        state.notams.filter((notam) => !notam.acknowledged).length > 4
          ? "NOTAM backlog tinggi"
          : null,
        state.orm.filter((orm) => orm.riskLevel === "High").length > 0
          ? "Ada ORM high-risk aktif"
          : null,
        override ? `Override ${override.decision}` : null,
      ].filter(Boolean) as string[];

      const recommendation: UpcomingMissionBoardItem["recommendation"] =
        override?.decision === "No-Go"
          ? "NO-GO"
          : crewScore >= 80 && riskFactors.length <= 1
            ? "GO"
            : crewScore >= 60
              ? "CONDITIONAL GO"
              : "NO-GO";

      return {
        id: item.id,
        title: item.title,
        start: item.start,
        base: item.base,
        assignedCrew: assignedPilot.name,
        crewScore,
        recommendation,
        riskFactors: riskFactors.length
          ? riskFactors
          : ["Posture stabil dan tidak ada blocker utama."],
      };
    });

const buildPredictiveAlerts = (
  state: ReturnType<typeof useApp>["state"],
): PredictiveAlert[] =>
  state.profiles
    .map((pilot) => {
      const pilotFlights7d = state.logbook.filter(
        (item) =>
          item.pilotId === pilot.id &&
          Date.now() - new Date(item.date).getTime() <= 1000 * 60 * 60 * 24 * 7,
      );
      const flightHours7d = pilotFlights7d.reduce(
        (sum, item) => sum + item.duration,
        0,
      );
      const fatigueSignals = flightHours7d > 18 ? 25 : 0;
      const trainingSignals =
        state.trainings.filter(
          (item) =>
            item.pilotId === pilot.id && daysUntil(item.expiryDate) < 30,
        ).length * 12;
      const notamSignals =
        state.notams.filter((item) => !item.acknowledged).length > 4 ? 20 : 0;
      const ormSignals =
        state.orm.filter((item) => item.riskLevel === "High").length >= 2
          ? 30
          : 0;
      const combinedEscalation =
        [fatigueSignals, trainingSignals, notamSignals, ormSignals].filter(
          (item) => item > 0,
        ).length >= 2
          ? 15
          : 0;
      const score = Math.min(
        100,
        fatigueSignals +
          trainingSignals +
          notamSignals +
          ormSignals +
          combinedEscalation +
          (pilot.status !== "Active" ? 10 : 0),
      );
      const reasons = [
        fatigueSignals > 0
          ? `Tempo tinggi ${flightHours7d.toFixed(1)} jam/7 hari`
          : null,
        trainingSignals > 0
          ? "Currency item mendekati/masuk expiry window"
          : null,
        notamSignals > 0 ? "NOTAM exposure tinggi dengan ack backlog" : null,
        ormSignals > 0 ? "Riwayat ORM high-risk berulang" : null,
        combinedEscalation > 0 ? "Multi-factor escalation aktif" : null,
        pilot.status !== "Active" ? `Status ${pilot.status}` : null,
      ].filter(Boolean) as string[];
      const tier: PredictiveAlert["tier"] =
        score >= 70
          ? "Command Attention"
          : score >= 50
            ? "FSO Review"
            : score >= 30
              ? "Monitor"
              : "Normal";
      const actions = [
        fatigueSignals > 0 ? "Pertimbangkan mandatory rest 12h." : null,
        trainingSignals > 0
          ? "Kunci slot recurrent training minggu ini."
          : null,
        notamSignals > 0 ? "Lakukan focused NOTAM briefing." : null,
        ormSignals > 0 ? "Lengkapi mitigasi ORM sebelum sortie release." : null,
      ].filter(Boolean) as string[];

      return {
        id: `PSE-${pilot.id}`,
        crewId: pilot.id,
        crewName: pilot.name,
        score,
        tier,
        reasons: reasons.length
          ? reasons
          : ["Tidak ada sinyal early warning kritikal."],
        actions: actions.length ? actions : ["Monitor normal."],
      };
    })
    .sort((a, b) => b.score - a.score);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { state, readinessScore, dispatch } = useApp();
  const [rikkesRecords] = useLocalStorageState(
    "aircrew-rikkes-data-v1",
    initialRikkesRecords,
  );
  const [overrides, setOverrides] = useLocalStorageState<ReadinessOverride[]>(
    "readiness-overrides-v1",
    [],
  );
  const [acknowledgedSafetyAlerts, setAcknowledgedSafetyAlerts] =
    useLocalStorageState<string[]>("predictive-safety-ack-v1", []);
  const [overrideTarget, setOverrideTarget] = useState(
    state.profiles[0]?.id ?? "P001",
  );
  const [overrideDecision, setOverrideDecision] =
    useState<ReadinessOverride["decision"]>("Conditional Go");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideMitigation, setOverrideMitigation] = useState("");
  const [selectedPilotId, setSelectedPilotId] = useState<string | null>(
    state.profiles[0]?.id ?? null,
  );
  const missionProfiles: MissionProfile[] = [
    "Training",
    "Routine Ops",
    "High-Risk Ops",
  ];
  const rikkesSummary = useMemo(
    () => calculateRikkesSummary(rikkesRecords),
    [rikkesRecords],
  );

  const kpi = useMemo(() => {
    const hours30 = state.logbook
      .filter(
        (e) =>
          Date.now() - new Date(e.date).getTime() <= 1000 * 60 * 60 * 24 * 30,
      )
      .reduce((sum, e) => sum + e.duration, 0)
      .toFixed(1);
    const sortiesWeek = state.logbook.filter(
      (e) => Date.now() - new Date(e.date).getTime() <= 1000 * 60 * 60 * 24 * 7,
    ).length;
    const aircraftAvailability = "78%";
    const medicalValidity = `${state.profiles.filter((p) => p.status === "Active").length}/${state.profiles.length}`;
    const currency = `${state.profiles.filter((p) => daysUntil(p.ifrCurrencyUntil) > 0).length}/${state.profiles.length}`;
    return {
      hours30,
      sortiesWeek,
      aircraftAvailability,
      medicalValidity,
      currency,
    };
  }, [state.logbook, state.profiles]);

  const readinessBreakdown = useMemo(
    () => calculateReadinessComponents(state),
    [state],
  );
  const readinessAlerts = useMemo(
    () => calculateReadinessAlerts(state),
    [state],
  );
  const predictiveAlerts = useMemo(() => buildPredictiveAlerts(state), [state]);
  const activePredictiveAlerts = predictiveAlerts.filter(
    (alert) =>
      alert.tier !== "Normal" && !acknowledgedSafetyAlerts.includes(alert.id),
  );
  const wingReadiness = useMemo(() => buildWingReadiness(state), [state]);
  const upcomingMissionBoard = useMemo(
    () => buildUpcomingMissionBoard(state, overrides),
    [overrides, state],
  );
  const selectedPilot = state.profiles.find(
    (pilot) => pilot.id === selectedPilotId,
  );
  const selectedPilotReadiness = useMemo(
    () => (selectedPilotId ? getPilotReadiness(selectedPilotId, state) : null),
    [selectedPilotId, state],
  );

  const pendingIncident = state.incidents.filter(
    (i) => i.status === "New",
  ).length;
  const restViolations = state.orm.filter(
    (item) => item.crewRestHours < 8,
  ).length;
  const upcomingSorties24h = state.schedule.filter(
    (item) =>
      item.category === "Sortie" &&
      new Date(item.start).getTime() - Date.now() <= 1000 * 60 * 60 * 24 &&
      new Date(item.start).getTime() >= Date.now(),
  ).length;
  const urgencyList = readinessAlerts.map((alert) => ({
    id: alert.id,
    label: alert.message,
    value: alert.value,
    onClick: () => navigate(alert.route),
    severity: alert.severity,
  }));

  const missionState = statusTone(readinessScore);

  const aiCopilot = useMemo(() => {
    const unackedNotam = state.notams.filter(
      (notam) => !notam.acknowledged,
    ).length;
    const highRiskOrm = state.orm.filter(
      (item) => item.riskLevel === "High",
    ).length;
    const expiringTrainings = state.trainings.filter(
      (item) => daysUntil(item.expiryDate) < 30,
    ).length;
    const nightSorties7d = state.logbook.filter(
      (entry) =>
        entry.dayNight === "Night" &&
        Date.now() - new Date(entry.date).getTime() <= 1000 * 60 * 60 * 24 * 7,
    ).length;

    const riskIndex = Math.min(
      100,
      highRiskOrm * 20 +
        expiringTrainings * 7 +
        unackedNotam * 5 +
        nightSorties7d * 2,
    );
    const confidence = Math.max(62, 96 - Math.floor(riskIndex / 3));

    const recommendations = [
      {
        label: `Acknowledge ${unackedNotam} NOTAM prioritas sebelum briefing berikutnya`,
        active: unackedNotam > 0,
        action: () => navigate("/notam"),
      },
      {
        label: `Review ${highRiskOrm} ORM high-risk dengan mitigation checklist AI`,
        active: highRiskOrm > 0,
        action: () => navigate("/orm"),
      },
      {
        label: `Lock slot training untuk ${expiringTrainings} item yang hampir kedaluwarsa`,
        active: expiringTrainings > 0,
        action: () => navigate("/training"),
      },
    ].filter((item) => item.active);

    const narrative =
      riskIndex >= 70
        ? "AI menandai tren risiko meningkat. Komandan disarankan memprioritaskan kontrol risiko sebelum sortie kompleks."
        : riskIndex >= 45
          ? "AI mendeteksi risiko moderat dengan bottleneck pada compliance dan NOTAM acknowledgment."
          : "AI menilai posture stabil. Fokuskan optimasi pada efisiensi briefing dan readiness training.";

    return {
      riskIndex,
      confidence,
      narrative,
      recommendations,
    };
  }, [state.notams, state.orm, state.trainings, state.logbook, navigate]);

  return (
    <section className="space-y-4">
      <div className="card border-0 bg-gradient-to-r from-sky-700 via-cyan-700 to-teal-600 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
              Command Center
            </p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              Dashboard Readiness
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-cyan-50">
              Ringkasan kesiapan misi lintas personel, risiko, status armada,
              dan early warning safety.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-cyan-100">Mission Profile:</span>
              <div className="flex items-center gap-2">
                {missionProfiles.map((profile) => (
                  <button
                    key={profile}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${state.missionProfile === profile ? "bg-white text-sky-700" : "bg-white/20 text-white hover:bg-white/30"}`}
                    onClick={() =>
                      dispatch({
                        type: "SET_MISSION_PROFILE",
                        payload: profile,
                      })
                    }
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={`rounded-xl px-4 py-3 ${missionState.style}`}>
            <p className="text-xs font-semibold uppercase">Mission State</p>
            <p className="text-2xl font-bold">{missionState.label}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-cyan-100">
              Upcoming Sortie (24h)
            </p>
            <p className="mt-1 text-2xl font-bold">{upcomingSorties24h}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-cyan-100">
              Open Incidents
            </p>
            <p className="mt-1 text-2xl font-bold">{pendingIncident}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-cyan-100">
              Crew Rest Violations
            </p>
            <p className="mt-1 text-2xl font-bold">{restViolations}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-cyan-100">
              Predictive Alerts
            </p>
            <p className="mt-1 text-2xl font-bold">
              {activePredictiveAlerts.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Flight Hours (30 days)" value={kpi.hours30} />
        <Card label="Sorties This Week" value={kpi.sortiesWeek} />
        <Card label="Aircraft Availability" value={kpi.aircraftAvailability} />
        <Card label="Medical Validity" value={kpi.medicalValidity} />
        <Card label="Currency Status" value={kpi.currency} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">
                Unified Readiness Snapshot
              </p>
              <p className="text-3xl font-bold">{readinessScore}/100</p>
            </div>
            <Badge
              label={
                readinessScore > 75
                  ? "MISSION READY"
                  : readinessScore > 55
                    ? "CAUTION"
                    : "LIMITED"
              }
              tone={missionState.tone}
            />
          </div>
          <div className="space-y-3">
            {readinessBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div>
                    <p>{item.label}</p>
                    <p className="text-xs text-slate-500">{item.note}</p>
                  </div>
                  <p className="font-semibold">
                    {item.score}%{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (bobot {(item.weight * 100).toFixed(0)}%)
                    </span>
                  </p>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-2 rounded-full transition-all ${item.score >= 80 ? "bg-emerald-500" : item.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Priority Actions</h3>
          <div className="space-y-2">
            {urgencyList.length === 0 && (
              <p className="text-sm text-slate-500">
                Tidak ada alert prioritas tinggi saat ini.
              </p>
            )}
            {urgencyList.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={item.onClick}
              >
                <span>{item.label}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${item.severity === "critical" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : item.severity === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
                >
                  {item.value}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Readiness Drill-Down</h3>
              <p className="text-sm text-slate-500">
                Skor individual untuk mendukung command override dan
                re-assignment.
              </p>
            </div>
            <button className="btn" onClick={() => navigate("/schedule")}>
              Buka planner
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {state.profiles.map((pilot) => {
              const pilotReadiness = getPilotReadiness(pilot.id, state);
              return (
                <button
                  key={pilot.id}
                  className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-sky-500 dark:border-slate-700"
                  onClick={() => setSelectedPilotId(pilot.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{pilot.name}</p>
                      <p className="text-xs text-slate-500">
                        {pilot.aircraftType} • {pilot.status}
                      </p>
                    </div>
                    <Badge
                      label={`${pilotReadiness.score}/100`}
                      tone={pilotReadiness.tone}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {pilotReadiness.breakdown[1]?.note}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card space-y-3">
          <div>
            <h3 className="font-semibold">Command Override Desk</h3>
            <p className="text-sm text-slate-500">
              No-Go, Conditional Go, atau Exceptional Go dengan alasan dan
              mitigasi wajib.
            </p>
          </div>
          <select
            className="input"
            value={overrideTarget}
            onChange={(event) => setOverrideTarget(event.target.value)}
          >
            {state.profiles.map((pilot) => (
              <option key={pilot.id} value={pilot.id}>
                {pilot.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={overrideDecision}
            onChange={(event) =>
              setOverrideDecision(
                event.target.value as ReadinessOverride["decision"],
              )
            }
          >
            <option value="Conditional Go">Conditional Go</option>
            <option value="No-Go">No-Go</option>
            <option value="Exceptional Go">Exceptional Go</option>
          </select>
          <textarea
            className="input"
            placeholder="Alasan override"
            value={overrideReason}
            onChange={(event) => setOverrideReason(event.target.value)}
          />
          <textarea
            className="input"
            placeholder="Mitigasi / guardrail"
            value={overrideMitigation}
            onChange={(event) => setOverrideMitigation(event.target.value)}
          />
          <button
            className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!overrideReason.trim() || !overrideMitigation.trim()}
            onClick={() => {
              const pilot = state.profiles.find(
                (item) => item.id === overrideTarget,
              );
              if (
                !pilot ||
                !overrideReason.trim() ||
                !overrideMitigation.trim()
              )
                return;
              const override: ReadinessOverride = {
                id: `OVR-${overrides.length + 1}`,
                targetType: "Crew",
                targetLabel: pilot.name,
                decision: overrideDecision,
                reason: overrideReason,
                mitigation: overrideMitigation,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(
                  Date.now() + 1000 * 60 * 60 * 12,
                ).toISOString(),
                role: state.role,
              };
              setOverrides((current) => [override, ...current]);
              dispatch({
                type: "ADD_AUDIT",
                payload: {
                  action: "UPDATE",
                  entity: "CommandOverride",
                  detail: `${override.targetLabel}:${override.decision}`,
                  role: state.role,
                },
              });
              setOverrideReason("");
              setOverrideMitigation("");
            }}
          >
            Simpan Override
          </button>
          <div className="space-y-2">
            {overrides.slice(0, 3).map((override) => (
              <div
                key={override.id}
                className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{override.targetLabel}</p>
                  <Badge
                    label={override.decision}
                    tone={
                      override.decision === "Exceptional Go"
                        ? "red"
                        : override.decision === "Conditional Go"
                          ? "yellow"
                          : "slate"
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Berlaku sampai{" "}
                  {new Date(override.expiresAt).toLocaleString("id-ID")}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {override.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Wing Readiness Heatmap</h3>
              <p className="text-sm text-slate-500">
                Agregasi kesiapan per skadron untuk membantu komando menentukan
                fokus intervensi.
              </p>
            </div>
            <Badge label={`${wingReadiness.length} wing`} tone="blue" />
          </div>
          <div className="space-y-3">
            {wingReadiness.map((wing) => (
              <div
                key={wing.wing}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{wing.wing}</p>
                    <p className="text-xs text-slate-500">
                      {wing.aircrew} aircrew • {wing.limitedCrew}{" "}
                      limited/grounded • {wing.expiringItems} item mendekati
                      expiry
                    </p>
                  </div>
                  <Badge
                    label={`${wing.averageScore}/100`}
                    tone={
                      wing.averageScore >= 80
                        ? "green"
                        : wing.averageScore >= 60
                          ? "yellow"
                          : "red"
                    }
                  />
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-2 rounded-full ${wing.averageScore >= 80 ? "bg-emerald-500" : wing.averageScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${wing.averageScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">72H Sortie Go / No-Go Board</h3>
              <p className="text-sm text-slate-500">
                Decision support untuk sortie terdekat berdasarkan crew score,
                ORM, dan backlog NOTAM.
              </p>
            </div>
            <button className="btn" onClick={() => navigate("/schedule")}>
              Open Schedule
            </button>
          </div>
          <div className="space-y-3">
            {upcomingMissionBoard.length === 0 && (
              <p className="text-sm text-slate-500">
                Tidak ada sortie dalam 72 jam ke depan.
              </p>
            )}
            {upcomingMissionBoard.map((mission) => (
              <div
                key={mission.id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{mission.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(mission.start).toLocaleString("id-ID")} •{" "}
                      {mission.base}
                    </p>
                  </div>
                  <Badge
                    label={mission.recommendation}
                    tone={
                      mission.recommendation === "GO"
                        ? "green"
                        : mission.recommendation === "CONDITIONAL GO"
                          ? "yellow"
                          : "red"
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge label={mission.assignedCrew} tone="slate" />
                  <Badge
                    label={`Crew ${mission.crewScore}/100`}
                    tone={
                      mission.crewScore >= 80
                        ? "green"
                        : mission.crewScore >= 60
                          ? "yellow"
                          : "red"
                    }
                  />
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                  {mission.riskFactors.slice(0, 3).map((factor) => (
                    <li key={factor}>{factor}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">AI Mission Copilot</h3>
            <Badge
              label={`Confidence ${aiCopilot.confidence}%`}
              tone={aiCopilot.confidence >= 80 ? "green" : "yellow"}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {aiCopilot.narrative}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
            Composite Risk Index
          </p>
          <p className="text-2xl font-bold">{aiCopilot.riskIndex}/100</p>
          <div className="mt-3 space-y-2">
            {aiCopilot.recommendations.length === 0 && (
              <p className="text-sm text-slate-500">
                Tidak ada rekomendasi kritis saat ini. Pertahankan posture
                operasi saat ini.
              </p>
            )}
            {aiCopilot.recommendations.map((item) => (
              <button
                key={item.label}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={item.action}
              >
                <span>{item.label}</span>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                  Eksekusi
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">Predictive Safety Engine</h3>
            <Badge
              label={`${activePredictiveAlerts.length} aktif`}
              tone={activePredictiveAlerts.length > 0 ? "red" : "green"}
            />
          </div>
          <div className="space-y-2">
            {predictiveAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{alert.crewName}</p>
                    <p className="text-xs text-slate-500">{alert.tier}</p>
                  </div>
                  <Badge
                    label={`${alert.score}/100`}
                    tone={
                      alert.score >= 70
                        ? "red"
                        : alert.score >= 50
                          ? "yellow"
                          : alert.score >= 30
                            ? "blue"
                            : "green"
                    }
                  />
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                  {alert.reasons.slice(0, 2).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="btn"
                    onClick={() =>
                      setAcknowledgedSafetyAlerts((current) => [
                        ...new Set([...current, alert.id]),
                      ])
                    }
                  >
                    Acknowledge
                  </button>
                  <button
                    className="btn"
                    onClick={() => navigate("/mission-intake-hub")}
                  >
                    Assign Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Status Rikkes TNI AU</h3>
            <button
              onClick={() => navigate("/rikkes")}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Lihat Detail →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {rikkesSummary.fitToFly}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Fit to Fly
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-900/20">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {rikkesSummary.fitWithRestriction}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                With Restriction
              </p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-center dark:bg-rose-900/20">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {rikkesSummary.unfit}
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300">Unfit</p>
            </div>
            <div className="rounded-lg bg-sky-50 p-3 text-center dark:bg-sky-900/20">
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {rikkesSummary.expiringSoon}
              </p>
              <p className="text-xs text-sky-700 dark:text-sky-300">Due Soon</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold">
            Rule-based Alerts & Early Warning
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              Training expiry &lt;30 hari:{" "}
              {
                state.trainings.filter((t) => daysUntil(t.expiryDate) < 30)
                  .length
              }
            </li>
            <li>Rest violation (&lt;8 jam): {restViolations}</li>
            <li>
              ORM High Risk:{" "}
              {state.orm.filter((o) => o.riskLevel === "High").length}
            </li>
            <li>Incident pending review: {pendingIncident}</li>
            <li>Predictive safety active: {activePredictiveAlerts.length}</li>
          </ul>
        </div>
      </div>

      <Modal
        open={Boolean(selectedPilot && selectedPilotReadiness)}
        title={
          selectedPilot
            ? `Readiness Drill-Down — ${selectedPilot.name}`
            : "Readiness Drill-Down"
        }
        onClose={() => setSelectedPilotId(null)}
      >
        {selectedPilot && selectedPilotReadiness && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Skor personal readiness
                </p>
                <p className="text-3xl font-bold">
                  {selectedPilotReadiness.score}/100
                </p>
              </div>
              <Badge
                label={selectedPilot.status}
                tone={
                  selectedPilot.status === "Active"
                    ? "green"
                    : selectedPilot.status === "Limited"
                      ? "yellow"
                      : "red"
                }
              />
            </div>
            <div className="space-y-2">
              {selectedPilotReadiness.breakdown.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{item.label}</p>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  <p className="text-xs text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => navigate("/schedule")}>
                Reassign Crew
              </button>
              <button className="btn" onClick={() => navigate("/training")}>
                Request Training
              </button>
              <button className="btn" onClick={() => navigate("/medical")}>
                Medical Review
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};
