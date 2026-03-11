import type { AppState, MissionProfile } from '../types';
import { daysUntil } from './date';

export type ReadinessComponent = {
  label: string;
  score: number;
  weight: number;
  note: string;
};

export type ReadinessAlert = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  route: string;
  value: number;
};

const clamp = (value: number) => Math.max(20, Math.min(100, Math.round(value)));

const profileWeights: Record<MissionProfile, Record<'medical' | 'training' | 'risk' | 'safety' | 'notam' | 'maintenance' | 'fatigue', number>> = {
  Training: { medical: 0.22, training: 0.26, risk: 0.12, safety: 0.12, notam: 0.1, maintenance: 0.08, fatigue: 0.1 },
  'Routine Ops': { medical: 0.23, training: 0.2, risk: 0.16, safety: 0.12, notam: 0.08, maintenance: 0.11, fatigue: 0.1 },
  'High-Risk Ops': { medical: 0.2, training: 0.18, risk: 0.22, safety: 0.12, notam: 0.06, maintenance: 0.12, fatigue: 0.1 }
};

export const calculateReadinessComponents = (state: AppState): ReadinessComponent[] => {
  const profileCount = Math.max(state.profiles.length, 1);
  const activeCrew = state.profiles.filter((pilot) => pilot.status === 'Active').length;
  const limitedCrew = state.profiles.filter((pilot) => pilot.status === 'Limited').length;

  const medicalScore = clamp((activeCrew / profileCount) * 100 - limitedCrew * 6);

  const expiringTraining = state.trainings.filter((item) => daysUntil(item.expiryDate) < 30).length;
  const expiredTraining = state.trainings.filter((item) => daysUntil(item.expiryDate) <= 0).length;
  const trainingScore = clamp(100 - expiringTraining * 5 - expiredTraining * 12);

  const highRiskOrm = state.orm.filter((item) => item.riskLevel === 'High').length;
  const mediumRiskOrm = state.orm.filter((item) => item.riskLevel === 'Medium').length;
  const riskScore = clamp(100 - highRiskOrm * 12 - mediumRiskOrm * 4);

  const openIncidents = state.incidents.filter((item) => item.status === 'New').length;
  const reviewedIncidents = state.incidents.filter((item) => item.status === 'Reviewed').length;
  const safetyScore = clamp(100 - openIncidents * 10 - reviewedIncidents * 4);

  const unackedNotam = state.notams.filter((item) => !item.acknowledged).length;
  const notamScore = clamp(100 - unackedNotam * 8);

  const nmcAircraft = state.orm.filter((item) => item.aircraftStatus === 'NMC').length;
  const pmcAircraft = state.orm.filter((item) => item.aircraftStatus === 'PMC').length;
  const maintenanceScore = clamp(100 - nmcAircraft * 14 - pmcAircraft * 5);

  const recentSorties = state.logbook.filter((entry) => Date.now() - new Date(entry.date).getTime() <= 1000 * 60 * 60 * 24 * 7);
  const nightSorties = recentSorties.filter((entry) => entry.dayNight === 'Night').length;
  const totalHours7d = recentSorties.reduce((sum, entry) => sum + entry.duration, 0);
  const fatigueScore = clamp(100 - Math.max(0, totalHours7d - 28) * 2.4 - nightSorties * 2.5);

  const weights = profileWeights[state.missionProfile];

  return [
    { label: 'Medical Readiness', score: medicalScore, weight: weights.medical, note: `${activeCrew}/${profileCount} aircrew fit for duty` },
    { label: 'Training Currency', score: trainingScore, weight: weights.training, note: `${expiringTraining} expiring, ${expiredTraining} expired` },
    { label: 'Operational Risk', score: riskScore, weight: weights.risk, note: `${highRiskOrm} high risk mission profile` },
    { label: 'Safety Posture', score: safetyScore, weight: weights.safety, note: `${openIncidents} incident awaiting triage` },
    { label: 'NOTAM Compliance', score: notamScore, weight: weights.notam, note: `${unackedNotam} NOTAM not acknowledged` },
    { label: 'Maintenance Availability', score: maintenanceScore, weight: weights.maintenance, note: `${nmcAircraft} NMC, ${pmcAircraft} PMC snapshot` },
    { label: 'Fatigue Exposure', score: fatigueScore, weight: weights.fatigue, note: `${totalHours7d.toFixed(1)} jam/7 hari, ${nightSorties} night sortie` }
  ];
};

export const calculateReadinessScore = (state: AppState): number => {
  const weighted = calculateReadinessComponents(state).reduce((sum, component) => sum + component.score * component.weight, 0);
  return clamp(weighted);
};

export const calculateReadinessAlerts = (state: AppState): ReadinessAlert[] => {
  const expiringTraining = state.trainings.filter((item) => daysUntil(item.expiryDate) < 30).length;
  const expiredTraining = state.trainings.filter((item) => daysUntil(item.expiryDate) <= 0).length;
  const highRiskOrm = state.orm.filter((item) => item.riskLevel === 'High').length;
  const openIncidents = state.incidents.filter((item) => item.status === 'New').length;
  const unackedNotam = state.notams.filter((item) => !item.acknowledged).length;
  const limitedCrew = state.profiles.filter((pilot) => pilot.status !== 'Active').length;
  const nmcAircraft = state.orm.filter((item) => item.aircraftStatus === 'NMC').length;
  const recentSorties = state.logbook.filter((entry) => Date.now() - new Date(entry.date).getTime() <= 1000 * 60 * 60 * 24 * 7);
  const totalHours7d = recentSorties.reduce((sum, entry) => sum + entry.duration, 0);

  const alerts: ReadinessAlert[] = [
    {
      id: 'alert-medical-expired',
      severity: expiredTraining > 0 ? 'critical' : 'warning',
      message: `${expiredTraining} training expired and ${expiringTraining} will expire <30 days`,
      route: '/training',
      value: expiredTraining + expiringTraining
    },
    {
      id: 'alert-medical-crew-status',
      severity: limitedCrew >= 2 ? 'critical' : 'warning',
      message: `${limitedCrew} aircrew in limited/grounded status affecting sortie assignment`,
      route: '/medical',
      value: limitedCrew
    },
    {
      id: 'alert-orm-high',
      severity: highRiskOrm >= 3 ? 'critical' : 'warning',
      message: `${highRiskOrm} assessment ORM level HIGH requires commander review`,
      route: '/orm',
      value: highRiskOrm
    },
    {
      id: 'alert-safety-open',
      severity: openIncidents >= 3 ? 'critical' : 'warning',
      message: `${openIncidents} incident has not entered corrective-action workflow`,
      route: '/safety',
      value: openIncidents
    },
    {
      id: 'alert-notam',
      severity: unackedNotam > 4 ? 'warning' : 'info',
      message: `${unackedNotam} NOTAM still pending acknowledgement before next sortie`,
      route: '/notam',
      value: unackedNotam
    },
    {
      id: 'alert-maintenance-nmc',
      severity: nmcAircraft >= 2 ? 'critical' : 'warning',
      message: `${nmcAircraft} aircraft berstatus NMC, evaluasi ulang tasking sortie`,
      route: '/maintenance',
      value: nmcAircraft
    },
    {
      id: 'alert-fatigue-hours',
      severity: totalHours7d > 34 ? 'critical' : 'warning',
      message: `Beban terbang 7 hari mencapai ${totalHours7d.toFixed(1)} jam, cek fatigue crew`,
      route: '/fatigue',
      value: totalHours7d > 28 ? 1 : 0
    }
  ];

  return alerts.filter((alert) => alert.value > 0);
};
