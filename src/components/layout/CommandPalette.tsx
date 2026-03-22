import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { useApp } from "../../contexts/AppContext";
import { requestedFeatureModules } from "../../data/featureModules";
import { hasRouteAccess } from "../../utils/rbac";
import { calculateReadinessAlerts } from "../../utils/readiness";

const routeCatalog = [
  {
    path: "/",
    title: "Dashboard Readiness",
    description: "Command center kesiapan misi dan predictive safety.",
  },
  {
    path: "/logbook",
    title: "E-Logbook",
    description: "Sortie history, hours, dan remark operasional.",
  },
  {
    path: "/orm",
    title: "Risk Assessment ORM",
    description: "Scoring risiko pra-misi dan mitigasi.",
  },
  {
    path: "/training",
    title: "Training Tracker",
    description: "Currency, recurrent training, dan expiry.",
  },
  {
    path: "/schedule",
    title: "Schedule Planner",
    description: "Mission board, briefing, dan penugasan kru.",
  },
  {
    path: "/notam",
    title: "NOTAM",
    description: "Acknowledge dan review pembatasan penerbangan.",
  },
  {
    path: "/safety",
    title: "Safety Reporting",
    description: "Hazard, near-miss, incident, dan corrective action.",
  },
  {
    path: "/medical",
    title: "Medical Readiness",
    description: "Medical fit status dan evaluasi aeromedis.",
  },
  {
    path: "/rikkes",
    title: "Rikkes TNI AU",
    description: "Ringkasan status fit to fly dan due medical.",
  },
  {
    path: "/reports",
    title: "Reports",
    description: "Rekap analitik komando dan ekspor laporan.",
  },
  {
    path: "/mission-intake-hub",
    title: "Mission Lifecycle",
    description: "Workflow pre-brief hingga debrief.",
  },
  {
    path: "/frames",
    title: "FRAMES",
    description: "Blueprint fatigue risk assessment dan medical advice.",
  },
  ...requestedFeatureModules,
];

const uniqueRoutes = routeCatalog.filter(
  (route, index, items) =>
    items.findIndex((item) => item.path === route.path) === index,
);

export const CommandPalette = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery(state.globalSearch);
  }, [open, state.globalSearch]);

  const normalizedQuery = query.trim().toLowerCase();

  const accessibleRoutes = useMemo(
    () =>
      uniqueRoutes.filter((route) => hasRouteAccess(state.role, route.path)),
    [state.role],
  );

  const routeMatches = useMemo(
    () =>
      accessibleRoutes
        .filter((route) => {
          if (!normalizedQuery) return true;
          return `${route.title} ${route.description} ${route.path}`
            .toLowerCase()
            .includes(normalizedQuery);
        })
        .slice(0, 8),
    [accessibleRoutes, normalizedQuery],
  );

  const crewMatches = useMemo(
    () =>
      state.profiles
        .filter((pilot) => {
          if (!normalizedQuery) return true;
          return `${pilot.name} ${pilot.rank} ${pilot.wing} ${pilot.aircraftType} ${pilot.status}`
            .toLowerCase()
            .includes(normalizedQuery);
        })
        .slice(0, 5),
    [normalizedQuery, state.profiles],
  );

  const alertMatches = useMemo(
    () =>
      calculateReadinessAlerts(state)
        .filter((alert) => {
          if (!normalizedQuery) return true;
          return `${alert.message} ${alert.route} ${alert.severity}`
            .toLowerCase()
            .includes(normalizedQuery);
        })
        .slice(0, 5),
    [normalizedQuery, state],
  );

  const openRoute = (path: string) => {
    navigate(path);
    onClose();
  };

  const applyPilotSearch = (pilotName: string, targetRoute: string) => {
    dispatch({ type: "SET_SEARCH", payload: pilotName });
    navigate(targetRoute);
    onClose();
  };

  const totalResults =
    routeMatches.length + crewMatches.length + alertMatches.length;

  return (
    <Modal open={open} title="Quick Ops Command Palette" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-700/40 dark:bg-sky-900/20 dark:text-sky-100">
          Cari route, kru, atau alert prioritas. Tekan{" "}
          <span className="font-semibold">Enter</span> pada hasil untuk
          berpindah cepat lintas modul.
        </div>

        <div className="space-y-2">
          <input
            autoFocus
            className="input"
            placeholder="Cari modul, kru, route, atau alert..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              className="btn"
              onClick={() => dispatch({ type: "SET_SEARCH", payload: query })}
            >
              Sync ke Global Search
            </button>
            <button className="btn" onClick={() => openRoute("/")}>
              Buka Dashboard
            </button>
            <button
              className="btn"
              onClick={() => openRoute("/mission-intake-hub")}
            >
              Mission Hub
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold">Routes</h4>
              <Badge label={`${routeMatches.length}`} tone="blue" />
            </div>
            <div className="space-y-2">
              {routeMatches.length === 0 && (
                <p className="text-sm text-slate-500">
                  Tidak ada route yang cocok.
                </p>
              )}
              {routeMatches.map((route) => (
                <button
                  key={route.path}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  onClick={() => openRoute(route.path)}
                >
                  <p className="font-semibold">{route.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {route.description}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-sky-600 dark:text-sky-300">
                    {route.path}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold">Crew Intelligence</h4>
              <Badge label={`${crewMatches.length}`} tone="green" />
            </div>
            <div className="space-y-2">
              {crewMatches.length === 0 && (
                <p className="text-sm text-slate-500">
                  Tidak ada kru yang cocok.
                </p>
              )}
              {crewMatches.map((pilot) => (
                <div
                  key={pilot.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{pilot.name}</p>
                      <p className="text-xs text-slate-500">
                        {pilot.rank} • {pilot.aircraftType}
                      </p>
                    </div>
                    <Badge
                      label={pilot.status}
                      tone={
                        pilot.status === "Active"
                          ? "green"
                          : pilot.status === "Limited"
                            ? "yellow"
                            : "red"
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{pilot.wing}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      className="btn"
                      onClick={() => applyPilotSearch(pilot.name, "/training")}
                    >
                      Cari di Training
                    </button>
                    <button
                      className="btn"
                      onClick={() => applyPilotSearch(pilot.name, "/schedule")}
                    >
                      Cari di Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="font-semibold">Readiness Alerts</h4>
              <Badge
                label={`${alertMatches.length}`}
                tone={alertMatches.length > 0 ? "yellow" : "green"}
              />
            </div>
            <div className="space-y-2">
              {alertMatches.length === 0 && (
                <p className="text-sm text-slate-500">
                  Tidak ada alert yang cocok.
                </p>
              )}
              {alertMatches.map((alert) => (
                <button
                  key={alert.id}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-sky-500 hover:bg-sky-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  onClick={() => openRoute(alert.route)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      label={alert.severity.toUpperCase()}
                      tone={
                        alert.severity === "critical"
                          ? "red"
                          : alert.severity === "warning"
                            ? "yellow"
                            : "slate"
                      }
                    />
                    <span className="text-xs font-semibold text-slate-500">
                      {alert.value}
                    </span>
                  </div>
                  <p className="mt-2">{alert.message}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-sky-600 dark:text-sky-300">
                    {alert.route}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Total hasil: {totalResults}. Query ini tidak mengubah data sampai Anda
          memilih aksi.
        </p>
      </div>
    </Modal>
  );
};
