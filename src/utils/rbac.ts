import type { Role } from "../types";
import { requestedFeatureModules } from "../data/featureModules";

export type AppAction =
  | "ADD_LOGBOOK"
  | "ADD_SCHEDULE"
  | "ADD_ORM"
  | "ADD_TRAINING"
  | "ADD_INCIDENT"
  | "ACK_NOTAM"
  | "ADMIN_WRITE"
  | "MEDICAL_WRITE"
  | "GENERIC_WRITE";

type AccessRule = {
  view: Role[];
  write: Role[];
};

const allRoles: Role[] = [
  "Pilot",
  "Flight Safety Officer",
  "Ops Officer",
  "Medical",
  "Commander/Admin",
];

const routeRules: Record<string, AccessRule> = {
  "/": { view: allRoles, write: allRoles },
  "/logbook": {
    view: ["Pilot", "Ops Officer", "Commander/Admin"],
    write: ["Pilot", "Ops Officer", "Commander/Admin"],
  },
  "/orm": {
    view: ["Pilot", "Flight Safety Officer", "Ops Officer", "Commander/Admin"],
    write: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
  },
  "/training": {
    view: ["Pilot", "Ops Officer", "Commander/Admin"],
    write: ["Ops Officer", "Commander/Admin"],
  },
  "/reports": {
    view: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
    write: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
  },
  "/schedule": {
    view: ["Pilot", "Ops Officer", "Commander/Admin"],
    write: ["Ops Officer", "Commander/Admin"],
  },
  "/notam": {
    view: ["Pilot", "Flight Safety Officer", "Ops Officer", "Commander/Admin"],
    write: ["Pilot", "Ops Officer", "Commander/Admin"],
  },
  "/safety": {
    view: ["Pilot", "Flight Safety Officer", "Commander/Admin"],
    write: ["Pilot", "Flight Safety Officer", "Commander/Admin"],
  },
  "/medical": {
    view: ["Medical", "Commander/Admin"],
    write: ["Medical", "Commander/Admin"],
  },
  "/rikkes": {
    view: ["Medical", "Commander/Admin"],
    write: ["Medical", "Commander/Admin"],
  },
  "/admin": { view: ["Commander/Admin"], write: ["Commander/Admin"] },
};

const moduleGroupAccess: Record<string, AccessRule> = {
  "Medical & Aeromedical": {
    view: ["Medical", "Commander/Admin"],
    write: ["Medical", "Commander/Admin"],
  },
  "Training & Currency": {
    view: ["Pilot", "Ops Officer", "Commander/Admin"],
    write: ["Ops Officer", "Commander/Admin"],
  },
  "Flight Ops & Logbook": {
    view: ["Pilot", "Ops Officer", "Commander/Admin"],
    write: ["Pilot", "Ops Officer", "Commander/Admin"],
  },
  "Risk & Safety (ORM)": {
    view: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
    write: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
  },
  "Command & Readiness Analytics": {
    view: ["Ops Officer", "Commander/Admin"],
    write: ["Commander/Admin"],
  },
  "Monitoring Eksternal": {
    view: ["Pilot", "Flight Safety Officer", "Ops Officer", "Commander/Admin"],
    write: ["Ops Officer", "Commander/Admin"],
  },
  "Mission Lifecycle Terpadu": {
    view: ["Pilot", "Flight Safety Officer", "Ops Officer", "Commander/Admin"],
    write: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
  },
  "Hardware Aerofisiologi": {
    view: ["Medical", "Ops Officer", "Commander/Admin"],
    write: ["Medical", "Ops Officer", "Commander/Admin"],
  },
  "Hardware Klinis MCU": {
    view: ["Medical", "Commander/Admin"],
    write: ["Medical", "Commander/Admin"],
  },
  "Manajemen Mutu & Maintenance": {
    view: ["Ops Officer", "Medical", "Commander/Admin"],
    write: ["Ops Officer", "Medical", "Commander/Admin"],
  },
  "Kepatuhan Regulasi": {
    view: ["Ops Officer", "Medical", "Commander/Admin"],
    write: ["Commander/Admin"],
  },
  "Software & Integrasi": {
    view: ["Ops Officer", "Medical", "Commander/Admin"],
    write: ["Ops Officer", "Commander/Admin"],
  },
};

const requestedModuleAccessMap = requestedFeatureModules.reduce<
  Record<string, AccessRule>
>((acc, module) => {
  acc[module.path] = moduleGroupAccess[module.group] ?? {
    view: allRoles,
    write: ["Commander/Admin"],
  };
  return acc;
}, {});

export const hasRouteAccess = (role: Role, path: string): boolean => {
  const rule = routeRules[path] ??
    requestedModuleAccessMap[path] ?? { view: allRoles, write: allRoles };
  return rule.view.includes(role);
};

export const hasRouteWriteAccess = (role: Role, path: string): boolean => {
  const rule = routeRules[path] ??
    requestedModuleAccessMap[path] ?? { view: allRoles, write: allRoles };
  return rule.write.includes(role);
};

const actionRoleMap: Record<AppAction, Role[]> = {
  ADD_LOGBOOK: ["Pilot", "Ops Officer", "Commander/Admin"],
  ADD_SCHEDULE: ["Ops Officer", "Commander/Admin"],
  ADD_ORM: ["Flight Safety Officer", "Ops Officer", "Commander/Admin"],
  ADD_TRAINING: ["Ops Officer", "Commander/Admin"],
  ADD_INCIDENT: ["Pilot", "Flight Safety Officer", "Commander/Admin"],
  ACK_NOTAM: ["Pilot", "Ops Officer", "Commander/Admin"],
  ADMIN_WRITE: ["Commander/Admin"],
  MEDICAL_WRITE: ["Medical", "Commander/Admin"],
  GENERIC_WRITE: [
    "Pilot",
    "Flight Safety Officer",
    "Ops Officer",
    "Medical",
    "Commander/Admin",
  ],
};

export const hasActionAccess = (role: Role, action: AppAction): boolean =>
  actionRoleMap[action].includes(role);
