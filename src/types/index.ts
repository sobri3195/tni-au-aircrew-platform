export type Role = 'Pilot' | 'Flight Safety Officer' | 'Ops Officer' | 'Medical' | 'Commander/Admin';

export type Theme = 'light' | 'dark';

export interface PilotProfile {
  id: string;
  name: string;
  rank: string;
  wing: string;
  aircraftType: string;
  ratings: string[];
  nvgCurrencyUntil: string;
  ifrCurrencyUntil: string;
  emergencyTrainingDate: string;
  status: 'Active' | 'Limited' | 'Grounded';
}

export interface LogbookEntry {
  id: string;
  pilotId: string;
  date: string;
  aircraft: string;
  sortieType: string;
  duration: number;
  dayNight: 'Day' | 'Night';
  ifr: boolean;
  nvg: boolean;
  remarks: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  start: string;
  end: string;
  category: 'Sortie' | 'Training' | 'Briefing';
  base: string;
}

export interface Notam {
  id: string;
  area: string;
  base: string;
  content: string;
  acknowledged: boolean;
}

export interface TrainingItem {
  id: string;
  pilotId: string;
  type: string;
  completionDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired';
}

export interface Incident {
  id: string;
  title: string;
  type: 'Hazard' | 'Near-Miss' | 'Incident';
  date: string;
  status: 'New' | 'Reviewed' | 'Actioned' | 'Closed';
  anonymous: boolean;
}

export interface OrmAssessment {
  id: string;
  missionType: string;
  crewRestHours: number;
  weather: 'Good' | 'Marginal' | 'Poor';
  aircraftStatus: 'FMC' | 'PMC' | 'NMC';
  threatLevel: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  mitigation: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  level: 'info' | 'warning' | 'critical';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  role: Role;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  detail: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  tag: 'urgent' | 'info';
  date: string;
}

export interface AppState {
  role: Role;
  theme: Theme;
  loggedIn: boolean;
  globalSearch: string;
  profiles: PilotProfile[];
  logbook: LogbookEntry[];
  schedule: ScheduleItem[];
  notams: Notam[];
  trainings: TrainingItem[];
  incidents: Incident[];
  orm: OrmAssessment[];
  notifications: NotificationItem[];
  auditLogs: AuditLogEntry[];
  messages: Message[];
}
