import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { useApp } from '../contexts/AppContext';
import { daysUntil } from '../utils/date';

type FitStatus = 'Fit' | 'Review' | 'Unfit';

type MedicalProfileRecord = {
  id: string;
  pilotId: string;
  examDate: string;
  medicalClass: 'Class I' | 'Class II' | 'Class III';
  waiver: string;
  findings: string;
};

type MedicalValidityRecord = {
  id: string;
  pilotId: string;
  document: string;
  validUntil: string;
  reminderDays: number;
  status: FitStatus;
};

type MedicationRestrictionRecord = {
  id: string;
  pilotId: string;
  medication: string;
  sedationLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  groundingRequired: boolean;
  holdHours: number;
  notes: string;
};

type VaccinationRecord = {
  id: string;
  pilotId: string;
  vaccine: string;
  date: string;
  monitorWindow: 48 | 72;
  symptoms: string;
  clearedToFly: boolean;
};

type FatigueSleepRecord = {
  id: string;
  pilotId: string;
  dutyHours: number;
  restHours: number;
  sleepDebt: number;
  circadianRisk: 'Low' | 'Medium' | 'High';
  notes: string;
};

type MentalReadinessRecord = {
  id: string;
  pilotId: string;
  checkInDate: string;
  moodScore: number;
  stressScore: number;
  confidentialEscalation: boolean;
  summary: string;
};

type PhysicalFitnessRecord = {
  id: string;
  pilotId: string;
  date: string;
  weight: number;
  height: number;
  bloodPressure: string;
  vo2max: number;
  runTime12Min: number;
  bodyFat: number;
};

type ExposureRecord = {
  id: string;
  pilotId: string;
  date: string;
  exposureType: 'Kebisingan' | 'Chemical' | 'Heat Stress';
  intensity: number;
  ppeUsed: boolean;
  followUp: string;
};

type MedicalStorage = {
  medicalProfiles: MedicalProfileRecord[];
  validity: MedicalValidityRecord[];
  medications: MedicationRestrictionRecord[];
  vaccinations: VaccinationRecord[];
  fatigue: FatigueSleepRecord[];
  mental: MentalReadinessRecord[];
  physical: PhysicalFitnessRecord[];
  exposure: ExposureRecord[];
};

const STORAGE_KEY = 'aircrew-medical-modules-v2';

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const emptyStorage: MedicalStorage = {
  medicalProfiles: [],
  validity: [],
  medications: [],
  vaccinations: [],
  fatigue: [],
  mental: [],
  physical: [],
  exposure: []
};

const readStorage = (): MedicalStorage => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStorage;
  try {
    return { ...emptyStorage, ...(JSON.parse(raw) as MedicalStorage) };
  } catch {
    return emptyStorage;
  }
};

export const MedicalReadinessPage = () => {
  const { state } = useApp();
  const [selectedPilotId, setSelectedPilotId] = useState(state.profiles[0]?.id ?? '');
  const [storage, setStorage] = useState<MedicalStorage>(readStorage);
  const [toast, setToast] = useState('');

  const [profileForm, setProfileForm] = useState<Omit<MedicalProfileRecord, 'id'>>({
    pilotId: selectedPilotId,
    examDate: new Date().toISOString().slice(0, 10),
    medicalClass: 'Class I',
    waiver: 'None',
    findings: ''
  });
  const [validityForm, setValidityForm] = useState<Omit<MedicalValidityRecord, 'id'>>({
    pilotId: selectedPilotId,
    document: 'Medical Certificate',
    validUntil: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
    reminderDays: 30,
    status: 'Fit'
  });
  const [medicationForm, setMedicationForm] = useState<Omit<MedicationRestrictionRecord, 'id'>>({
    pilotId: selectedPilotId,
    medication: '',
    sedationLevel: 'Rendah',
    groundingRequired: false,
    holdHours: 0,
    notes: ''
  });
  const [vaccinationForm, setVaccinationForm] = useState<Omit<VaccinationRecord, 'id'>>({
    pilotId: selectedPilotId,
    vaccine: '',
    date: new Date().toISOString().slice(0, 10),
    monitorWindow: 48,
    symptoms: '',
    clearedToFly: true
  });
  const [fatigueForm, setFatigueForm] = useState<Omit<FatigueSleepRecord, 'id'>>({
    pilotId: selectedPilotId,
    dutyHours: 7,
    restHours: 10,
    sleepDebt: 0,
    circadianRisk: 'Low',
    notes: ''
  });
  const [mentalForm, setMentalForm] = useState<Omit<MentalReadinessRecord, 'id'>>({
    pilotId: selectedPilotId,
    checkInDate: new Date().toISOString().slice(0, 10),
    moodScore: 4,
    stressScore: 2,
    confidentialEscalation: false,
    summary: ''
  });
  const [physicalForm, setPhysicalForm] = useState<Omit<PhysicalFitnessRecord, 'id'>>({
    pilotId: selectedPilotId,
    date: new Date().toISOString().slice(0, 10),
    weight: 72,
    height: 172,
    bloodPressure: '120/80',
    vo2max: 43,
    runTime12Min: 2500,
    bodyFat: 18
  });
  const [exposureForm, setExposureForm] = useState<Omit<ExposureRecord, 'id'>>({
    pilotId: selectedPilotId,
    date: new Date().toISOString().slice(0, 10),
    exposureType: 'Kebisingan',
    intensity: 40,
    ppeUsed: true,
    followUp: ''
  });
  const [editingId, setEditingId] = useState<Record<string, string | null>>({
    profile: null,
    validity: null,
    medication: null,
    vaccination: null,
    fatigue: null,
    mental: null,
    physical: null,
    exposure: null
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }, [storage]);

  useEffect(() => {
    setProfileForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setValidityForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setMedicationForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setVaccinationForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setFatigueForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setMentalForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setPhysicalForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
    setExposureForm((prev) => ({ ...prev, pilotId: selectedPilotId }));
  }, [selectedPilotId]);

  const selectedPilot = state.profiles.find((profile) => profile.id === selectedPilotId);
  const pilotName = selectedPilot?.name ?? 'Pilot';

  const pilotData = useMemo(
    () => ({
      medicalProfiles: storage.medicalProfiles.filter((item) => item.pilotId === selectedPilotId),
      validity: storage.validity.filter((item) => item.pilotId === selectedPilotId),
      medications: storage.medications.filter((item) => item.pilotId === selectedPilotId),
      vaccinations: storage.vaccinations.filter((item) => item.pilotId === selectedPilotId),
      fatigue: storage.fatigue.filter((item) => item.pilotId === selectedPilotId),
      mental: storage.mental.filter((item) => item.pilotId === selectedPilotId),
      physical: storage.physical.filter((item) => item.pilotId === selectedPilotId),
      exposure: storage.exposure.filter((item) => item.pilotId === selectedPilotId)
    }),
    [selectedPilotId, storage]
  );

  const riskSummary = useMemo(() => {
    const expiring = pilotData.validity.filter((item) => daysUntil(item.validUntil) <= item.reminderDays).length;
    const unfit = pilotData.validity.filter((item) => item.status === 'Unfit').length;
    const groundingMedication = pilotData.medications.filter((item) => item.groundingRequired).length;
    const pendingVaccineMonitor = pilotData.vaccinations.filter((item) => !item.clearedToFly).length;
    const fatigueHigh = pilotData.fatigue.filter((item) => item.circadianRisk === 'High' || item.sleepDebt > 2).length;
    const mentalEscalated = pilotData.mental.filter((item) => item.confidentialEscalation).length;
    const highExposure = pilotData.exposure.filter((item) => item.intensity >= 70).length;

    return { expiring, unfit, groundingMedication, pendingVaccineMonitor, fatigueHigh, mentalEscalated, highExposure };
  }, [pilotData]);

  const saveToast = (message: string) => setToast(`${pilotName}: ${message}`);

  const upsert = <T extends { id: string }>(list: T[], item: T) => {
    const existing = list.some((entry) => entry.id === item.id);
    return existing ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list];
  };

  const remove = <T extends { id: string }>(list: T[], id: string) => list.filter((entry) => entry.id !== id);

  const calcBmi = (weight: number, height: number) => {
    const meter = height / 100;
    if (!meter) return 0;
    return Number((weight / (meter * meter)).toFixed(1));
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Medical Readiness 360°</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">CRUD + local storage untuk profil medis, validity, obat, vaksin, fatigue, mental, fitness, dan occupational exposure.</p>
      </div>

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Pilot aktif</p>
          <p className="font-semibold">{pilotName}</p>
        </div>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={selectedPilotId}
          onChange={(event) => setSelectedPilotId(event.target.value)}
        >
          {state.profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <Badge label={`Doc Expiring: ${riskSummary.expiring}`} tone={riskSummary.expiring > 0 ? 'yellow' : 'green'} />
        <Badge label={`Unfit: ${riskSummary.unfit}`} tone={riskSummary.unfit > 0 ? 'red' : 'green'} />
        <Badge label={`Grounding Alert: ${riskSummary.groundingMedication}`} tone={riskSummary.groundingMedication > 0 ? 'red' : 'green'} />
        <Badge label={`Fatigue High: ${riskSummary.fatigueHigh}`} tone={riskSummary.fatigueHigh > 0 ? 'yellow' : 'green'} />
        <Badge label={`Vaccine Monitor: ${riskSummary.pendingVaccineMonitor}`} tone={riskSummary.pendingVaccineMonitor > 0 ? 'yellow' : 'green'} />
        <Badge label={`Mental Escalation: ${riskSummary.mentalEscalated}`} tone={riskSummary.mentalEscalated > 0 ? 'red' : 'green'} />
        <Badge label={`High Exposure: ${riskSummary.highExposure}`} tone={riskSummary.highExposure > 0 ? 'yellow' : 'green'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card space-y-2">
          <h3 className="font-semibold">1) Profil Medis Aircrew</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={profileForm.examDate} onChange={(e) => setProfileForm({ ...profileForm, examDate: e.target.value })} />
            <select className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={profileForm.medicalClass} onChange={(e) => setProfileForm({ ...profileForm, medicalClass: e.target.value as MedicalProfileRecord['medicalClass'] })}>
              <option>Class I</option><option>Class II</option><option>Class III</option>
            </select>
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Waiver" value={profileForm.waiver} onChange={(e) => setProfileForm({ ...profileForm, waiver: e.target.value })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Temuan pemeriksaan" value={profileForm.findings} onChange={(e) => setProfileForm({ ...profileForm, findings: e.target.value })} />
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, medicalProfiles: upsert(prev.medicalProfiles, { id: editingId.profile ?? createId('MP'), ...profileForm }) }));
            setEditingId((prev) => ({ ...prev, profile: null }));
            saveToast('Profil medis tersimpan.');
          }}>{editingId.profile ? 'Update Profil' : 'Tambah Profil'}</button>
          <ul className="space-y-1 text-xs">
            {pilotData.medicalProfiles.map((item) => (
              <li className="flex items-center justify-between rounded border p-2 dark:border-slate-700" key={item.id}>
                <span>{item.examDate} • {item.medicalClass} • Waiver: {item.waiver || 'None'}</span>
                <div className="space-x-2">
                  <button className="text-sky-700" onClick={() => {
                    setProfileForm({ pilotId: item.pilotId, examDate: item.examDate, medicalClass: item.medicalClass, waiver: item.waiver, findings: item.findings });
                    setEditingId((prev) => ({ ...prev, profile: item.id }));
                  }}>Edit</button>
                  <button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, medicalProfiles: remove(prev.medicalProfiles, item.id) }))}>Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">2) Medical Validity Management</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={validityForm.document} onChange={(e) => setValidityForm({ ...validityForm, document: e.target.value })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={validityForm.validUntil} onChange={(e) => setValidityForm({ ...validityForm, validUntil: e.target.value })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={validityForm.reminderDays} onChange={(e) => setValidityForm({ ...validityForm, reminderDays: Number(e.target.value) || 0 })} />
            <select className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={validityForm.status} onChange={(e) => setValidityForm({ ...validityForm, status: e.target.value as FitStatus })}>
              <option>Fit</option><option>Review</option><option>Unfit</option>
            </select>
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, validity: upsert(prev.validity, { id: editingId.validity ?? createId('MV'), ...validityForm }) }));
            setEditingId((prev) => ({ ...prev, validity: null }));
            saveToast('Validity & reminder tersimpan.');
          }}>{editingId.validity ? 'Update Validity' : 'Tambah Validity'}</button>
          <ul className="space-y-1 text-xs">
            {pilotData.validity.map((item) => (
              <li className="flex items-center justify-between rounded border p-2 dark:border-slate-700" key={item.id}>
                <span>{item.document} • {item.validUntil} • {item.status} ({daysUntil(item.validUntil)} hari)</span>
                <div className="space-x-2">
                  <button className="text-sky-700" onClick={() => {
                    setValidityForm({ pilotId: item.pilotId, document: item.document, validUntil: item.validUntil, reminderDays: item.reminderDays, status: item.status });
                    setEditingId((prev) => ({ ...prev, validity: item.id }));
                  }}>Edit</button>
                  <button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, validity: remove(prev.validity, item.id) }))}>Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">3) Medication & Restriction Tracker</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Nama obat" value={medicationForm.medication} onChange={(e) => setMedicationForm({ ...medicationForm, medication: e.target.value })} />
            <select className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={medicationForm.sedationLevel} onChange={(e) => setMedicationForm({ ...medicationForm, sedationLevel: e.target.value as MedicationRestrictionRecord['sedationLevel'] })}>
              <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
            </select>
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={medicationForm.holdHours} onChange={(e) => setMedicationForm({ ...medicationForm, holdHours: Number(e.target.value) || 0 })} />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={medicationForm.groundingRequired} onChange={(e) => setMedicationForm({ ...medicationForm, groundingRequired: e.target.checked })} /> Grounding rule</label>
          </div>
          <textarea className="w-full rounded border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900" placeholder="Catatan" value={medicationForm.notes} onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, medications: upsert(prev.medications, { id: editingId.medication ?? createId('MD'), ...medicationForm }) }));
            setEditingId((prev) => ({ ...prev, medication: null }));
            saveToast('Medication tracker diperbarui.');
          }}>{editingId.medication ? 'Update Obat' : 'Tambah Obat'}</button>
          <ul className="space-y-1 text-xs">
            {pilotData.medications.map((item) => (
              <li className="flex items-center justify-between rounded border p-2 dark:border-slate-700" key={item.id}>
                <span>{item.medication} • Sedasi {item.sedationLevel} • Hold {item.holdHours} jam</span>
                <div className="space-x-2"><button className="text-sky-700" onClick={() => { setMedicationForm({ pilotId: item.pilotId, medication: item.medication, sedationLevel: item.sedationLevel, groundingRequired: item.groundingRequired, holdHours: item.holdHours, notes: item.notes }); setEditingId((prev) => ({ ...prev, medication: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, medications: remove(prev.medications, item.id) }))}>Hapus</button></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">4) Vaccination & Post-vaccine Window</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Jenis vaksin" value={vaccinationForm.vaccine} onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccine: e.target.value })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={vaccinationForm.date} onChange={(e) => setVaccinationForm({ ...vaccinationForm, date: e.target.value })} />
            <select className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={vaccinationForm.monitorWindow} onChange={(e) => setVaccinationForm({ ...vaccinationForm, monitorWindow: Number(e.target.value) as 48 | 72 })}>
              <option value={48}>48 jam</option><option value={72}>72 jam</option>
            </select>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={vaccinationForm.clearedToFly} onChange={(e) => setVaccinationForm({ ...vaccinationForm, clearedToFly: e.target.checked })} /> Cleared to fly</label>
          </div>
          <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Monitoring gejala" value={vaccinationForm.symptoms} onChange={(e) => setVaccinationForm({ ...vaccinationForm, symptoms: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, vaccinations: upsert(prev.vaccinations, { id: editingId.vaccination ?? createId('VC'), ...vaccinationForm }) }));
            setEditingId((prev) => ({ ...prev, vaccination: null }));
            saveToast('Data vaksin dan monitoring tersimpan.');
          }}>{editingId.vaccination ? 'Update Vaksin' : 'Tambah Vaksin'}</button>
          <ul className="space-y-1 text-xs">
            {pilotData.vaccinations.map((item) => (
              <li className="flex items-center justify-between rounded border p-2 dark:border-slate-700" key={item.id}><span>{item.vaccine} • {item.monitorWindow} jam • {item.clearedToFly ? 'Clear' : 'Monitor'}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setVaccinationForm({ pilotId: item.pilotId, vaccine: item.vaccine, date: item.date, monitorWindow: item.monitorWindow, symptoms: item.symptoms, clearedToFly: item.clearedToFly }); setEditingId((prev) => ({ ...prev, vaccination: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, vaccinations: remove(prev.vaccinations, item.id) }))}>Hapus</button></div></li>
            ))}
          </ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">5) Fatigue & Sleep Monitoring</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={fatigueForm.dutyHours} onChange={(e) => setFatigueForm({ ...fatigueForm, dutyHours: Number(e.target.value) || 0 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={fatigueForm.restHours} onChange={(e) => setFatigueForm({ ...fatigueForm, restHours: Number(e.target.value) || 0 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" step="0.5" value={fatigueForm.sleepDebt} onChange={(e) => setFatigueForm({ ...fatigueForm, sleepDebt: Number(e.target.value) || 0 })} />
            <select className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={fatigueForm.circadianRisk} onChange={(e) => setFatigueForm({ ...fatigueForm, circadianRisk: e.target.value as FatigueSleepRecord['circadianRisk'] })}><option>Low</option><option>Medium</option><option>High</option></select>
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, fatigue: upsert(prev.fatigue, { id: editingId.fatigue ?? createId('FT'), ...fatigueForm }) }));
            setEditingId((prev) => ({ ...prev, fatigue: null }));
            saveToast('Fatigue & circadian check tersimpan.');
          }}>{editingId.fatigue ? 'Update Fatigue' : 'Tambah Fatigue Record'}</button>
          <ul className="space-y-1 text-xs">{pilotData.fatigue.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>Duty {item.dutyHours}h • Rest {item.restHours}h • Risk {item.circadianRisk}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setFatigueForm({ pilotId: item.pilotId, dutyHours: item.dutyHours, restHours: item.restHours, sleepDebt: item.sleepDebt, circadianRisk: item.circadianRisk, notes: item.notes }); setEditingId((prev) => ({ ...prev, fatigue: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, fatigue: remove(prev.fatigue, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">6) Mental Readiness Check-in</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={mentalForm.checkInDate} onChange={(e) => setMentalForm({ ...mentalForm, checkInDate: e.target.value })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" min={1} max={5} value={mentalForm.moodScore} onChange={(e) => setMentalForm({ ...mentalForm, moodScore: Number(e.target.value) || 1 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" min={1} max={5} value={mentalForm.stressScore} onChange={(e) => setMentalForm({ ...mentalForm, stressScore: Number(e.target.value) || 1 })} />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={mentalForm.confidentialEscalation} onChange={(e) => setMentalForm({ ...mentalForm, confidentialEscalation: e.target.checked })} /> Escalasi rahasia</label>
          </div>
          <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Ringkasan check-in" value={mentalForm.summary} onChange={(e) => setMentalForm({ ...mentalForm, summary: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, mental: upsert(prev.mental, { id: editingId.mental ?? createId('MN'), ...mentalForm }) }));
            setEditingId((prev) => ({ ...prev, mental: null }));
            saveToast('Mental check-in berhasil disimpan.');
          }}>{editingId.mental ? 'Update Check-in' : 'Tambah Check-in'}</button>
          <ul className="space-y-1 text-xs">{pilotData.mental.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>Mood {item.moodScore}/5 • Stress {item.stressScore}/5 {item.confidentialEscalation ? '• Escalated' : ''}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setMentalForm({ pilotId: item.pilotId, checkInDate: item.checkInDate, moodScore: item.moodScore, stressScore: item.stressScore, confidentialEscalation: item.confidentialEscalation, summary: item.summary }); setEditingId((prev) => ({ ...prev, mental: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, mental: remove(prev.mental, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">7) Physical Fitness & Anthropometry</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.weight} onChange={(e) => setPhysicalForm({ ...physicalForm, weight: Number(e.target.value) || 0 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.height} onChange={(e) => setPhysicalForm({ ...physicalForm, height: Number(e.target.value) || 0 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={physicalForm.bloodPressure} onChange={(e) => setPhysicalForm({ ...physicalForm, bloodPressure: e.target.value })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.vo2max} onChange={(e) => setPhysicalForm({ ...physicalForm, vo2max: Number(e.target.value) || 0 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.runTime12Min} onChange={(e) => setPhysicalForm({ ...physicalForm, runTime12Min: Number(e.target.value) || 0 })} />
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.bodyFat} onChange={(e) => setPhysicalForm({ ...physicalForm, bodyFat: Number(e.target.value) || 0 })} />
          </div>
          <p className="text-xs text-slate-500">BMI estimasi: {calcBmi(physicalForm.weight, physicalForm.height)}</p>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, physical: upsert(prev.physical, { id: editingId.physical ?? createId('PF'), ...physicalForm }) }));
            setEditingId((prev) => ({ ...prev, physical: null }));
            saveToast('Data fitness & anthropometry tersimpan.');
          }}>{editingId.physical ? 'Update Fitness Record' : 'Tambah Fitness Record'}</button>
          <ul className="space-y-1 text-xs">{pilotData.physical.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>BP {item.bloodPressure} • VO2 {item.vo2max} • BMI {calcBmi(item.weight, item.height)}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setPhysicalForm({ pilotId: item.pilotId, date: item.date, weight: item.weight, height: item.height, bloodPressure: item.bloodPressure, vo2max: item.vo2max, runTime12Min: item.runTime12Min, bodyFat: item.bodyFat }); setEditingId((prev) => ({ ...prev, physical: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, physical: remove(prev.physical, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">8) Exposure / Occupational Health</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <select className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={exposureForm.exposureType} onChange={(e) => setExposureForm({ ...exposureForm, exposureType: e.target.value as ExposureRecord['exposureType'] })}><option>Kebisingan</option><option>Chemical</option><option>Heat Stress</option></select>
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" min={0} max={100} value={exposureForm.intensity} onChange={(e) => setExposureForm({ ...exposureForm, intensity: Number(e.target.value) || 0 })} />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={exposureForm.ppeUsed} onChange={(e) => setExposureForm({ ...exposureForm, ppeUsed: e.target.checked })} /> PPE digunakan</label>
            <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Follow-up" value={exposureForm.followUp} onChange={(e) => setExposureForm({ ...exposureForm, followUp: e.target.value })} />
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, exposure: upsert(prev.exposure, { id: editingId.exposure ?? createId('EX'), ...exposureForm }) }));
            setEditingId((prev) => ({ ...prev, exposure: null }));
            saveToast('Occupational exposure record tersimpan.');
          }}>{editingId.exposure ? 'Update Exposure' : 'Tambah Exposure'}</button>
          <ul className="space-y-1 text-xs">{pilotData.exposure.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>{item.exposureType} • Intensitas {item.intensity} • PPE {item.ppeUsed ? 'Ya' : 'Tidak'}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setExposureForm({ pilotId: item.pilotId, date: item.date, exposureType: item.exposureType, intensity: item.intensity, ppeUsed: item.ppeUsed, followUp: item.followUp }); setEditingId((prev) => ({ ...prev, exposure: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, exposure: remove(prev.exposure, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>
      </div>

      <div className="card">
        <p className="text-sm font-semibold">Ringkasan Entry per Modul</p>
        <p className="text-xs text-slate-500">Profile {pilotData.medicalProfiles.length} • Validity {pilotData.validity.length} • Medication {pilotData.medications.length} • Vaccination {pilotData.vaccinations.length} • Fatigue {pilotData.fatigue.length} • Mental {pilotData.mental.length} • Physical {pilotData.physical.length} • Exposure {pilotData.exposure.length}</p>
      </div>

      {toast && <Toast message={toast} />}
    </section>
  );
};
