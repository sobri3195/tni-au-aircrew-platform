import type { AppState, Incident, LogbookEntry, Notam, PilotProfile, ScheduleItem, TrainingItem } from '../types';
import { daysFromNow } from '../utils/date';

const pilots: PilotProfile[] = [
  {
    id: 'P001',
    name: 'Kapten Pnb Arif Santoso',
    rank: 'Kapten',
    wing: 'Skadron Udara 3',
    aircraftType: 'F-16C',
    ratings: ['IFR', 'Lead', 'Instructor'],
    nvgCurrencyUntil: daysFromNow(45),
    ifrCurrencyUntil: daysFromNow(60),
    emergencyTrainingDate: daysFromNow(-20),
    status: 'Active'
  },
  {
    id: 'P002',
    name: 'Mayor Pnb Rina Dewi',
    rank: 'Mayor',
    wing: 'Skadron Udara 2',
    aircraftType: 'CN-295',
    ratings: ['Transport', 'SAR'],
    nvgCurrencyUntil: daysFromNow(12),
    ifrCurrencyUntil: daysFromNow(5),
    emergencyTrainingDate: daysFromNow(-200),
    status: 'Limited'
  },
  {
    id: 'P003',
    name: 'Lettu Pnb Dimas Prasetyo',
    rank: 'Lettu',
    wing: 'Skadron Udara 15',
    aircraftType: 'T-50i',
    ratings: ['Formation', 'Night Ops'],
    nvgCurrencyUntil: daysFromNow(20),
    ifrCurrencyUntil: daysFromNow(34),
    emergencyTrainingDate: daysFromNow(-45),
    status: 'Active'
  },
  {
    id: 'P004',
    name: 'Kapten Pnb Satria Nugroho',
    rank: 'Kapten',
    wing: 'Skadron Udara 17',
    aircraftType: 'Boeing 737',
    ratings: ['VIP Transport', 'IFR'],
    nvgCurrencyUntil: daysFromNow(4),
    ifrCurrencyUntil: daysFromNow(14),
    emergencyTrainingDate: daysFromNow(-330),
    status: 'Grounded'
  }
];

const sortieTypes = ['CAP', 'Navigation', 'Training', 'Formation', 'Night Ops'];
const aircrafts = ['F-16C TS-1601', 'T-50i TT-5008', 'CN-295 A-2901'];

const createLogbook = (): LogbookEntry[] =>
  Array.from({ length: 80 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i * 2);
    return {
      id: `L${i + 1}`,
      pilotId: pilots[i % pilots.length].id,
      date: date.toISOString(),
      aircraft: aircrafts[i % aircrafts.length],
      sortieType: sortieTypes[i % sortieTypes.length],
      duration: Number((1 + (i % 4) * 0.7).toFixed(1)),
      dayNight: i % 3 === 0 ? 'Night' : 'Day',
      ifr: i % 2 === 0,
      nvg: i % 4 === 0,
      remarks: i % 5 === 0 ? 'Crosswind approach' : 'Routine mission'
    };
  });

const createSchedule = (): ScheduleItem[] =>
  Array.from({ length: 30 }).map((_, i) => {
    const start = new Date();
    start.setDate(start.getDate() + i - 5);
    start.setHours(7 + (i % 4) * 2, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);
    return {
      id: `S${i + 1}`,
      title: `${i % 4 === 0 ? 'Briefing' : 'Mission'} ${i + 1}`,
      start: start.toISOString(),
      end: end.toISOString(),
      category: i % 4 === 0 ? 'Briefing' : i % 2 ? 'Sortie' : 'Training',
      base: i % 2 ? 'Lanud Iswahjudi' : 'Lanud Halim'
    };
  });

const notams: Notam[] = Array.from({ length: 16 }).map((_, i) => ({
  id: `N${i + 1}`,
  area: i % 2 ? 'Madiun TMA' : 'Jakarta FIR',
  base: i % 2 ? 'Iswahjudi' : 'Halim',
  content: `NOTAM ${i + 1}: ${i % 3 === 0 ? 'Runway maintenance window extended to 1500Z.' : 'Restricted airspace active from 0800Z to 1200Z.'}`,
  acknowledged: i < 5
}));

const trainings: TrainingItem[] = ['CRM', 'Egress', 'SAR', 'Weapon System', 'Emergency Procedure', 'Flight Physiology', 'NVG Recurrent', 'IFR Check', 'Simulator', 'Live Firing'].map(
  (type, i) => ({
    id: `T${i + 1}`,
    pilotId: pilots[i % pilots.length].id,
    type,
    completionDate: daysFromNow(-(i + 10)),
    expiryDate: daysFromNow(60 - i * 12),
    status: i > 7 ? 'Expiring' : 'Valid'
  })
);

const incidents: Incident[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `I${i + 1}`,
  title: `Report ${i + 1} - ${i % 2 ? 'Bird strike risk' : 'Runway FOD observation'}`,
  type: i % 3 === 0 ? 'Incident' : i % 2 === 0 ? 'Near-Miss' : 'Hazard',
  date: daysFromNow(-(i + 1)),
  status: i < 4 ? 'New' : i < 8 ? 'Reviewed' : i < 12 ? 'Actioned' : 'Closed',
  anonymous: i % 2 === 0
}));

export const initialState: AppState = {
  role: 'Pilot',
  theme: 'dark',
  loggedIn: false,
  globalSearch: '',
  profiles: pilots,
  logbook: createLogbook(),
  schedule: createSchedule(),
  notams,
  trainings,
  incidents,
  orm: [
    {
      id: 'ORM1',
      missionType: 'Night Intercept',
      crewRestHours: 7,
      weather: 'Marginal',
      aircraftStatus: 'PMC',
      threatLevel: 7,
      riskLevel: 'High',
      mitigation: 'Tambahkan alternate airfield + extra fuel reserve.',
      createdAt: daysFromNow(-1)
    },
    {
      id: 'ORM2',
      missionType: 'Navigation Training',
      crewRestHours: 9,
      weather: 'Good',
      aircraftStatus: 'FMC',
      threatLevel: 3,
      riskLevel: 'Low',
      mitigation: 'Briefing ulang area restricted sebelum taxi.',
      createdAt: daysFromNow(-3)
    }
  ],
  notifications: [
    { id: 'NF1', message: '2 NOTAM prioritas tinggi belum di-acknowledge.', level: 'warning' },
    { id: 'NF2', message: '1 personel memasuki status IFR expiring < 14 hari.', level: 'critical' }
  ],
  auditLogs: [
    { id: 'A1', timestamp: daysFromNow(-1), role: 'Ops Officer', action: 'CREATE', entity: 'Schedule', detail: 'Mission 8' },
    { id: 'A2', timestamp: daysFromNow(-2), role: 'Flight Safety Officer', action: 'UPDATE', entity: 'NOTAM', detail: 'N3' }
  ],
  messages: [
    {
      id: 'M1',
      from: 'Ops Officer',
      to: 'Pilot',
      subject: 'Briefing update',
      body: 'Mission briefing moved to 0700 local.',
      tag: 'info',
      date: daysFromNow(-1)
    },
    {
      id: 'M2',
      from: 'Flight Safety Officer',
      to: 'Pilot',
      subject: 'Reminder ORM High Risk',
      body: 'Pastikan mitigasi pada ORM1 selesai sebelum engine start.',
      tag: 'urgent',
      date: daysFromNow(0)
    }
  ]
};
