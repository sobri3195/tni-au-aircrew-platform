import { useEffect, useMemo, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { useApp } from '../contexts/AppContext';
import { daysFromNow, daysUntil } from '../utils/date';
import { readJsonStorage } from '../utils/storage';

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

const createDefaultProfileForm = (pilotId: string): Omit<MedicalProfileRecord, 'id'> => ({
  pilotId,
  examDate: new Date().toISOString().slice(0, 10),
  medicalClass: 'Class I',
  waiver: 'None',
  findings: ''
});

const createDefaultValidityForm = (pilotId: string): Omit<MedicalValidityRecord, 'id'> => ({
  pilotId,
  document: 'Medical Certificate',
  validUntil: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
  reminderDays: 30,
  status: 'Fit'
});

const createDefaultMedicationForm = (pilotId: string): Omit<MedicationRestrictionRecord, 'id'> => ({
  pilotId,
  medication: '',
  sedationLevel: 'Rendah',
  groundingRequired: false,
  holdHours: 0,
  notes: ''
});

const createDefaultVaccinationForm = (pilotId: string): Omit<VaccinationRecord, 'id'> => ({
  pilotId,
  vaccine: '',
  date: new Date().toISOString().slice(0, 10),
  monitorWindow: 48,
  symptoms: '',
  clearedToFly: true
});

const createDefaultFatigueForm = (pilotId: string): Omit<FatigueSleepRecord, 'id'> => ({
  pilotId,
  dutyHours: 7,
  restHours: 10,
  sleepDebt: 0,
  circadianRisk: 'Low',
  notes: ''
});

const createDefaultMentalForm = (pilotId: string): Omit<MentalReadinessRecord, 'id'> => ({
  pilotId,
  checkInDate: new Date().toISOString().slice(0, 10),
  moodScore: 4,
  stressScore: 2,
  confidentialEscalation: false,
  summary: ''
});

const createDefaultPhysicalForm = (pilotId: string): Omit<PhysicalFitnessRecord, 'id'> => ({
  pilotId,
  date: new Date().toISOString().slice(0, 10),
  weight: 72,
  height: 172,
  bloodPressure: '120/80',
  vo2max: 43,
  runTime12Min: 2500,
  bodyFat: 18
});

const createDefaultExposureForm = (pilotId: string): Omit<ExposureRecord, 'id'> => ({
  pilotId,
  date: new Date().toISOString().slice(0, 10),
  exposureType: 'Kebisingan',
  intensity: 40,
  ppeUsed: true,
  followUp: ''
});

const createDemoMedicalStorage = (pilotIds: string[]): MedicalStorage => ({
  medicalProfiles: pilotIds.map((pilotId, index) => ({
    id: `demo-mp-${pilotId}`,
    pilotId,
    examDate: daysFromNow(-(12 + index * 8)),
    medicalClass: index === 3 ? 'Class II' : 'Class I',
    waiver: index === 1 ? 'Sinus observation' : 'None',
    findings: [
      'TTV stabil, EKG dalam batas normal, siap terbang.',
      'Riwayat sinusitis ringan, monitor hidrasi dan pressure equalization.',
      'Adaptasi G-tolerance baik, perlu evaluasi post-sortie intensif.',
      'Monitor tekanan darah dan fatigue setelah misi VIP jarak jauh.'
    ][index % 4]
  })),
  validity: pilotIds.map((pilotId, index) => ({
    id: `demo-mv-${pilotId}`,
    pilotId,
    document: index === 2 ? 'Rikkes Berkala' : 'Medical Certificate',
    validUntil: daysFromNow([90, 21, 11, 3][index % 4]),
    reminderDays: 30,
    status: (['Fit', 'Fit', 'Review', 'Unfit'] as FitStatus[])[index % 4]
  })),
  medications: pilotIds.map((pilotId, index) => ({
    id: `demo-md-${pilotId}`,
    pilotId,
    medication: ['Cetirizine', 'Pseudoephedrine', 'Ibuprofen', 'Melatonin'][index % 4],
    sedationLevel: (['Rendah', 'Sedang', 'Rendah', 'Tinggi'] as MedicationRestrictionRecord['sedationLevel'][])[index % 4],
    groundingRequired: index === 1 || index === 3,
    holdHours: [12, 24, 8, 36][index % 4],
    notes: [
      'Boleh terbang setelah observasi 12 jam tanpa efek sedasi.',
      'Grounded sementara sampai gejala URI selesai dan evaluasi flight surgeon.',
      'Obat nyeri pasca latihan fisik, monitor hidrasi.',
      'Wajib recovery sleep cycle sebelum dinyatakan fit.'
    ][index % 4]
  })),
  vaccinations: pilotIds.map((pilotId, index) => ({
    id: `demo-vc-${pilotId}`,
    pilotId,
    vaccine: ['Influenza', 'COVID-19 Booster', 'Hepatitis B', 'Tetanus'][index % 4],
    date: daysFromNow(-(index + 1)),
    monitorWindow: index % 2 === 0 ? 48 : 72,
    symptoms: index === 1 ? 'Mialgia ringan 24 jam pertama' : 'Tidak ada keluhan berarti',
    clearedToFly: index !== 1
  })),
  fatigue: pilotIds.map((pilotId, index) => ({
    id: `demo-ft-${pilotId}`,
    pilotId,
    dutyHours: [7, 9, 11, 8][index % 4],
    restHours: [10, 8, 6, 7][index % 4],
    sleepDebt: [0.5, 1.5, 3, 2.5][index % 4],
    circadianRisk: (['Low', 'Medium', 'High', 'Medium'] as FatigueSleepRecord['circadianRisk'][])[index % 4],
    notes: [
      'Crew rest sesuai SOP.',
      'Mission planning malam hari, perlu tactical nap.',
      'Alertness turun pada sortie ketiga, evaluasi roster.',
      'Recovery sleep dianjurkan sebelum long-haul berikutnya.'
    ][index % 4]
  })),
  mental: pilotIds.map((pilotId, index) => ({
    id: `demo-mn-${pilotId}`,
    pilotId,
    checkInDate: daysFromNow(-index),
    moodScore: [4, 4, 3, 2][index % 4],
    stressScore: [2, 3, 4, 4][index % 4],
    confidentialEscalation: index === 3,
    summary: [
      'Stabil dan fokus misi.',
      'Adaptasi beban tugas baik, perlu monitoring workload mingguan.',
      'Perlu follow-up setelah tempo operasi tinggi.',
      'Direkomendasikan sesi konseling rahasia sebelum sortie berikutnya.'
    ][index % 4]
  })),
  physical: pilotIds.map((pilotId, index) => ({
    id: `demo-pf-${pilotId}`,
    pilotId,
    date: daysFromNow(-(7 + index * 3)),
    weight: [71, 66, 74, 82][index % 4],
    height: [172, 168, 176, 178][index % 4],
    bloodPressure: ['118/78', '120/80', '126/82', '138/88'][index % 4],
    vo2max: [45, 42, 47, 39][index % 4],
    runTime12Min: [2550, 2440, 2680, 2300][index % 4],
    bodyFat: [17, 19, 15, 23][index % 4]
  })),
  exposure: pilotIds.map((pilotId, index) => ({
    id: `demo-ex-${pilotId}`,
    pilotId,
    date: daysFromNow(-(4 + index)),
    exposureType: (['Kebisingan', 'Chemical', 'Heat Stress', 'Kebisingan'] as ExposureRecord['exposureType'][])[index % 4],
    intensity: [38, 52, 74, 68][index % 4],
    ppeUsed: index !== 2,
    followUp: [
      'Audiometri ulang triwulan berikutnya.',
      'Review handling chemical dan PPE checklist.',
      'Hydration protocol + cooling recovery 24 jam.',
      'Monitor threshold pendengaran pasca latihan engine run-up.'
    ][index % 4]
  }))
});

const isStorageEmpty = (storage: MedicalStorage) =>
  Object.values(storage).every((collection) => collection.length === 0);

const readStorage = (pilotIds: string[]): MedicalStorage => {
  const persisted = {
    ...emptyStorage,
    ...readJsonStorage<MedicalStorage>(STORAGE_KEY, emptyStorage)
  };

  return isStorageEmpty(persisted) && pilotIds.length > 0 ? createDemoMedicalStorage(pilotIds) : persisted;
};

export const MedicalReadinessPage = () => {
  const { state } = useApp();
  const pilotIds = useMemo(() => state.profiles.map((profile) => profile.id), [state.profiles]);
  const [selectedPilotId, setSelectedPilotId] = useLocalStorageState('medical-selected-pilot', state.profiles[0]?.id ?? '');
  const [storage, setStorage] = useLocalStorageState<MedicalStorage>(STORAGE_KEY, readStorage(pilotIds));
  const [toast, setToast] = useState('');

  const [profileForm, setProfileForm] = useState<Omit<MedicalProfileRecord, 'id'>>(createDefaultProfileForm(selectedPilotId));
  const [validityForm, setValidityForm] = useState<Omit<MedicalValidityRecord, 'id'>>(createDefaultValidityForm(selectedPilotId));
  const [medicationForm, setMedicationForm] = useState<Omit<MedicationRestrictionRecord, 'id'>>(createDefaultMedicationForm(selectedPilotId));
  const [vaccinationForm, setVaccinationForm] = useState<Omit<VaccinationRecord, 'id'>>(createDefaultVaccinationForm(selectedPilotId));
  const [fatigueForm, setFatigueForm] = useState<Omit<FatigueSleepRecord, 'id'>>(createDefaultFatigueForm(selectedPilotId));
  const [mentalForm, setMentalForm] = useState<Omit<MentalReadinessRecord, 'id'>>(createDefaultMentalForm(selectedPilotId));
  const [physicalForm, setPhysicalForm] = useState<Omit<PhysicalFitnessRecord, 'id'>>(createDefaultPhysicalForm(selectedPilotId));
  const [exposureForm, setExposureForm] = useState<Omit<ExposureRecord, 'id'>>(createDefaultExposureForm(selectedPilotId));
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
    if (!state.profiles.some((profile) => profile.id === selectedPilotId)) {
      setSelectedPilotId(state.profiles[0]?.id ?? '');
    }
  }, [selectedPilotId, setSelectedPilotId, state.profiles]);

  useEffect(() => {
    if (isStorageEmpty(storage) && pilotIds.length > 0) {
      setStorage(createDemoMedicalStorage(pilotIds));
    }
  }, [pilotIds, setStorage, storage]);

  useEffect(() => {
    setProfileForm((prev) => ({ ...createDefaultProfileForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setValidityForm((prev) => ({ ...createDefaultValidityForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setMedicationForm((prev) => ({ ...createDefaultMedicationForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setVaccinationForm((prev) => ({ ...createDefaultVaccinationForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setFatigueForm((prev) => ({ ...createDefaultFatigueForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setMentalForm((prev) => ({ ...createDefaultMentalForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setPhysicalForm((prev) => ({ ...createDefaultPhysicalForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
    setExposureForm((prev) => ({ ...createDefaultExposureForm(selectedPilotId), ...prev, pilotId: selectedPilotId }));
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

  const resetEditing = () => setEditingId({
    profile: null,
    validity: null,
    medication: null,
    vaccination: null,
    fatigue: null,
    mental: null,
    physical: null,
    exposure: null
  });

  const resetForms = () => {
    setProfileForm(createDefaultProfileForm(selectedPilotId));
    setValidityForm(createDefaultValidityForm(selectedPilotId));
    setMedicationForm(createDefaultMedicationForm(selectedPilotId));
    setVaccinationForm(createDefaultVaccinationForm(selectedPilotId));
    setFatigueForm(createDefaultFatigueForm(selectedPilotId));
    setMentalForm(createDefaultMentalForm(selectedPilotId));
    setPhysicalForm(createDefaultPhysicalForm(selectedPilotId));
    setExposureForm(createDefaultExposureForm(selectedPilotId));
    resetEditing();
  };

  const loadPilotDummyData = () => {
    if (!selectedPilotId) {
      return;
    }

    const pilotDemo = createDemoMedicalStorage([selectedPilotId]);
    setStorage((prev) => ({
      medicalProfiles: [...prev.medicalProfiles.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.medicalProfiles],
      validity: [...prev.validity.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.validity],
      medications: [...prev.medications.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.medications],
      vaccinations: [...prev.vaccinations.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.vaccinations],
      fatigue: [...prev.fatigue.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.fatigue],
      mental: [...prev.mental.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.mental],
      physical: [...prev.physical.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.physical],
      exposure: [...prev.exposure.filter((item) => item.pilotId !== selectedPilotId), ...pilotDemo.exposure]
    }));
    resetForms();
    saveToast('Dummy data medis dimuat untuk pilot ini.');
  };

  const clearPilotMedicalData = () => {
    if (!selectedPilotId) {
      return;
    }

    setStorage((prev) => ({
      medicalProfiles: prev.medicalProfiles.filter((item) => item.pilotId !== selectedPilotId),
      validity: prev.validity.filter((item) => item.pilotId !== selectedPilotId),
      medications: prev.medications.filter((item) => item.pilotId !== selectedPilotId),
      vaccinations: prev.vaccinations.filter((item) => item.pilotId !== selectedPilotId),
      fatigue: prev.fatigue.filter((item) => item.pilotId !== selectedPilotId),
      mental: prev.mental.filter((item) => item.pilotId !== selectedPilotId),
      physical: prev.physical.filter((item) => item.pilotId !== selectedPilotId),
      exposure: prev.exposure.filter((item) => item.pilotId !== selectedPilotId)
    }));
    resetForms();
    saveToast('Seluruh data medis pilot aktif dihapus dari frontend storage.');
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
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
          <button className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300" onClick={loadPilotDummyData}>
            Muat dummy data pilot
          </button>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200" onClick={resetForms}>
            Reset form
          </button>
          <button className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" onClick={clearPilotMedicalData}>
            Hapus data pilot
          </button>
        </div>
      </div>

      <div className="card grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Frontend dummy data siap pakai</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Saat modul pertama kali dibuka, data contoh medis otomatis ditampilkan agar semua CRUD bisa langsung diuji tanpa backend. Gunakan tombol <span className="font-semibold">Muat dummy data pilot</span> untuk mengisi ulang data per personel.</p>
        </div>
        <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">• Form profile, validity, obat, vaksin, fatigue, mental, fitness, dan exposure dapat tambah/edit/hapus.</div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">• Semua record disimpan di local storage browser agar pengujian frontend tetap persisten.</div>
        </div>
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">1) Profil Medis Aircrew</h3>
            {editingId.profile && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Tanggal pemeriksaan<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={profileForm.examDate} onChange={(e) => setProfileForm({ ...profileForm, examDate: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Kelas medis<select className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={profileForm.medicalClass} onChange={(e) => setProfileForm({ ...profileForm, medicalClass: e.target.value as MedicalProfileRecord['medicalClass'] })}><option>Class I</option><option>Class II</option><option>Class III</option></select></label>
            <label className="text-xs text-slate-500">Waiver<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Waiver / keterangan" value={profileForm.waiver} onChange={(e) => setProfileForm({ ...profileForm, waiver: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Temuan<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Temuan pemeriksaan" value={profileForm.findings} onChange={(e) => setProfileForm({ ...profileForm, findings: e.target.value })} /></label>
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, medicalProfiles: upsert(prev.medicalProfiles, { id: editingId.profile ?? createId('MP'), ...profileForm }) }));
            setEditingId((prev) => ({ ...prev, profile: null }));
            setProfileForm(createDefaultProfileForm(selectedPilotId));
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">2) Medical Validity Management</h3>
            {editingId.validity && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Dokumen<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={validityForm.document} onChange={(e) => setValidityForm({ ...validityForm, document: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Valid sampai<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={validityForm.validUntil} onChange={(e) => setValidityForm({ ...validityForm, validUntil: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Reminder (hari)<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={validityForm.reminderDays} onChange={(e) => setValidityForm({ ...validityForm, reminderDays: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Status<select className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={validityForm.status} onChange={(e) => setValidityForm({ ...validityForm, status: e.target.value as FitStatus })}><option>Fit</option><option>Review</option><option>Unfit</option></select></label>
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, validity: upsert(prev.validity, { id: editingId.validity ?? createId('MV'), ...validityForm }) }));
            setEditingId((prev) => ({ ...prev, validity: null }));
            setValidityForm(createDefaultValidityForm(selectedPilotId));
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">3) Medication & Restriction Tracker</h3>
            {editingId.medication && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Nama obat<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Nama obat" value={medicationForm.medication} onChange={(e) => setMedicationForm({ ...medicationForm, medication: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Level sedasi<select className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={medicationForm.sedationLevel} onChange={(e) => setMedicationForm({ ...medicationForm, sedationLevel: e.target.value as MedicationRestrictionRecord['sedationLevel'] })}><option>Rendah</option><option>Sedang</option><option>Tinggi</option></select></label>
            <label className="text-xs text-slate-500">Hold hours<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={medicationForm.holdHours} onChange={(e) => setMedicationForm({ ...medicationForm, holdHours: Number(e.target.value) || 0 })} /></label>
            <label className="mt-5 flex items-center gap-2 text-xs"><input type="checkbox" checked={medicationForm.groundingRequired} onChange={(e) => setMedicationForm({ ...medicationForm, groundingRequired: e.target.checked })} /> Grounding rule</label>
          </div>
          <textarea className="w-full rounded border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900" placeholder="Catatan klinis / batasan terbang" value={medicationForm.notes} onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, medications: upsert(prev.medications, { id: editingId.medication ?? createId('MD'), ...medicationForm }) }));
            setEditingId((prev) => ({ ...prev, medication: null }));
            setMedicationForm(createDefaultMedicationForm(selectedPilotId));
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
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">4) Vaccination & Post-vaccine Window</h3>
            {editingId.vaccination && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Jenis vaksin<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Jenis vaksin" value={vaccinationForm.vaccine} onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccine: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Tanggal<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={vaccinationForm.date} onChange={(e) => setVaccinationForm({ ...vaccinationForm, date: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Monitor window<select className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={vaccinationForm.monitorWindow} onChange={(e) => setVaccinationForm({ ...vaccinationForm, monitorWindow: Number(e.target.value) as 48 | 72 })}><option value={48}>48 jam</option><option value={72}>72 jam</option></select></label>
            <label className="mt-5 flex items-center gap-2 text-xs"><input type="checkbox" checked={vaccinationForm.clearedToFly} onChange={(e) => setVaccinationForm({ ...vaccinationForm, clearedToFly: e.target.checked })} /> Cleared to fly</label>
          </div>
          <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Monitoring gejala" value={vaccinationForm.symptoms} onChange={(e) => setVaccinationForm({ ...vaccinationForm, symptoms: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, vaccinations: upsert(prev.vaccinations, { id: editingId.vaccination ?? createId('VC'), ...vaccinationForm }) }));
            setEditingId((prev) => ({ ...prev, vaccination: null }));
            setVaccinationForm(createDefaultVaccinationForm(selectedPilotId));
            saveToast('Data vaksin dan monitoring tersimpan.');
          }}>{editingId.vaccination ? 'Update Vaksin' : 'Tambah Vaksin'}</button>
          <ul className="space-y-1 text-xs">
            {pilotData.vaccinations.map((item) => (
              <li className="flex items-center justify-between rounded border p-2 dark:border-slate-700" key={item.id}><span>{item.vaccine} • {item.monitorWindow} jam • {item.clearedToFly ? 'Clear' : 'Monitor'}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setVaccinationForm({ pilotId: item.pilotId, vaccine: item.vaccine, date: item.date, monitorWindow: item.monitorWindow, symptoms: item.symptoms, clearedToFly: item.clearedToFly }); setEditingId((prev) => ({ ...prev, vaccination: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, vaccinations: remove(prev.vaccinations, item.id) }))}>Hapus</button></div></li>
            ))}
          </ul>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">5) Fatigue & Sleep Monitoring</h3>
            {editingId.fatigue && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Duty hours<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={fatigueForm.dutyHours} onChange={(e) => setFatigueForm({ ...fatigueForm, dutyHours: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Rest hours<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={fatigueForm.restHours} onChange={(e) => setFatigueForm({ ...fatigueForm, restHours: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Sleep debt<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" step="0.5" value={fatigueForm.sleepDebt} onChange={(e) => setFatigueForm({ ...fatigueForm, sleepDebt: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Circadian risk<select className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={fatigueForm.circadianRisk} onChange={(e) => setFatigueForm({ ...fatigueForm, circadianRisk: e.target.value as FatigueSleepRecord['circadianRisk'] })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          </div>
          <textarea className="w-full rounded border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900" placeholder="Catatan fatigue / mitigasi roster" value={fatigueForm.notes} onChange={(e) => setFatigueForm({ ...fatigueForm, notes: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, fatigue: upsert(prev.fatigue, { id: editingId.fatigue ?? createId('FT'), ...fatigueForm }) }));
            setEditingId((prev) => ({ ...prev, fatigue: null }));
            setFatigueForm(createDefaultFatigueForm(selectedPilotId));
            saveToast('Fatigue & circadian check tersimpan.');
          }}>{editingId.fatigue ? 'Update Fatigue' : 'Tambah Fatigue Record'}</button>
          <ul className="space-y-1 text-xs">{pilotData.fatigue.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>Duty {item.dutyHours}h • Rest {item.restHours}h • Risk {item.circadianRisk}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setFatigueForm({ pilotId: item.pilotId, dutyHours: item.dutyHours, restHours: item.restHours, sleepDebt: item.sleepDebt, circadianRisk: item.circadianRisk, notes: item.notes }); setEditingId((prev) => ({ ...prev, fatigue: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, fatigue: remove(prev.fatigue, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">6) Mental Readiness Check-in</h3>
            {editingId.mental && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Tanggal check-in<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={mentalForm.checkInDate} onChange={(e) => setMentalForm({ ...mentalForm, checkInDate: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Mood score<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" min={1} max={5} value={mentalForm.moodScore} onChange={(e) => setMentalForm({ ...mentalForm, moodScore: Number(e.target.value) || 1 })} /></label>
            <label className="text-xs text-slate-500">Stress score<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" min={1} max={5} value={mentalForm.stressScore} onChange={(e) => setMentalForm({ ...mentalForm, stressScore: Number(e.target.value) || 1 })} /></label>
            <label className="mt-5 flex items-center gap-2 text-xs"><input type="checkbox" checked={mentalForm.confidentialEscalation} onChange={(e) => setMentalForm({ ...mentalForm, confidentialEscalation: e.target.checked })} /> Escalasi rahasia</label>
          </div>
          <input className="rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Ringkasan check-in" value={mentalForm.summary} onChange={(e) => setMentalForm({ ...mentalForm, summary: e.target.value })} />
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, mental: upsert(prev.mental, { id: editingId.mental ?? createId('MN'), ...mentalForm }) }));
            setEditingId((prev) => ({ ...prev, mental: null }));
            setMentalForm(createDefaultMentalForm(selectedPilotId));
            saveToast('Mental check-in berhasil disimpan.');
          }}>{editingId.mental ? 'Update Check-in' : 'Tambah Check-in'}</button>
          <ul className="space-y-1 text-xs">{pilotData.mental.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>Mood {item.moodScore}/5 • Stress {item.stressScore}/5 {item.confidentialEscalation ? '• Escalated' : ''}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setMentalForm({ pilotId: item.pilotId, checkInDate: item.checkInDate, moodScore: item.moodScore, stressScore: item.stressScore, confidentialEscalation: item.confidentialEscalation, summary: item.summary }); setEditingId((prev) => ({ ...prev, mental: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, mental: remove(prev.mental, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">7) Physical Fitness & Anthropometry</h3>
            {editingId.physical && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <label className="text-xs text-slate-500">Tanggal<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={physicalForm.date} onChange={(e) => setPhysicalForm({ ...physicalForm, date: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Berat (kg)<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.weight} onChange={(e) => setPhysicalForm({ ...physicalForm, weight: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Tinggi (cm)<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.height} onChange={(e) => setPhysicalForm({ ...physicalForm, height: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Tekanan darah<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={physicalForm.bloodPressure} onChange={(e) => setPhysicalForm({ ...physicalForm, bloodPressure: e.target.value })} /></label>
            <label className="text-xs text-slate-500">VO2 max<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.vo2max} onChange={(e) => setPhysicalForm({ ...physicalForm, vo2max: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500">Lari 12 menit (m)<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.runTime12Min} onChange={(e) => setPhysicalForm({ ...physicalForm, runTime12Min: Number(e.target.value) || 0 })} /></label>
            <label className="text-xs text-slate-500 md:col-span-1">Body fat %<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" value={physicalForm.bodyFat} onChange={(e) => setPhysicalForm({ ...physicalForm, bodyFat: Number(e.target.value) || 0 })} /></label>
          </div>
          <p className="text-xs text-slate-500">BMI estimasi: {calcBmi(physicalForm.weight, physicalForm.height)}</p>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, physical: upsert(prev.physical, { id: editingId.physical ?? createId('PF'), ...physicalForm }) }));
            setEditingId((prev) => ({ ...prev, physical: null }));
            setPhysicalForm(createDefaultPhysicalForm(selectedPilotId));
            saveToast('Data fitness & anthropometry tersimpan.');
          }}>{editingId.physical ? 'Update Fitness Record' : 'Tambah Fitness Record'}</button>
          <ul className="space-y-1 text-xs">{pilotData.physical.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>{item.date} • BP {item.bloodPressure} • VO2 {item.vo2max} • BMI {calcBmi(item.weight, item.height)}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setPhysicalForm({ pilotId: item.pilotId, date: item.date, weight: item.weight, height: item.height, bloodPressure: item.bloodPressure, vo2max: item.vo2max, runTime12Min: item.runTime12Min, bodyFat: item.bodyFat }); setEditingId((prev) => ({ ...prev, physical: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, physical: remove(prev.physical, item.id) }))}>Hapus</button></div></li>)}</ul>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">8) Exposure / Occupational Health</h3>
            {editingId.exposure && <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Mode edit</span>}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">Tanggal<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="date" value={exposureForm.date} onChange={(e) => setExposureForm({ ...exposureForm, date: e.target.value })} /></label>
            <label className="text-xs text-slate-500">Exposure type<select className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" value={exposureForm.exposureType} onChange={(e) => setExposureForm({ ...exposureForm, exposureType: e.target.value as ExposureRecord['exposureType'] })}><option>Kebisingan</option><option>Chemical</option><option>Heat Stress</option></select></label>
            <label className="text-xs text-slate-500">Intensity<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" type="number" min={0} max={100} value={exposureForm.intensity} onChange={(e) => setExposureForm({ ...exposureForm, intensity: Number(e.target.value) || 0 })} /></label>
            <label className="mt-5 flex items-center gap-2 text-xs"><input type="checkbox" checked={exposureForm.ppeUsed} onChange={(e) => setExposureForm({ ...exposureForm, ppeUsed: e.target.checked })} /> PPE digunakan</label>
            <label className="text-xs text-slate-500 md:col-span-2">Follow-up<input className="mt-1 w-full rounded border px-2 py-1 dark:border-slate-700 dark:bg-slate-900" placeholder="Follow-up" value={exposureForm.followUp} onChange={(e) => setExposureForm({ ...exposureForm, followUp: e.target.value })} /></label>
          </div>
          <button className="rounded bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => {
            setStorage((prev) => ({ ...prev, exposure: upsert(prev.exposure, { id: editingId.exposure ?? createId('EX'), ...exposureForm }) }));
            setEditingId((prev) => ({ ...prev, exposure: null }));
            setExposureForm(createDefaultExposureForm(selectedPilotId));
            saveToast('Occupational exposure record tersimpan.');
          }}>{editingId.exposure ? 'Update Exposure' : 'Tambah Exposure'}</button>
          <ul className="space-y-1 text-xs">{pilotData.exposure.map((item) => <li key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700"><span>{item.date} • {item.exposureType} • Intensitas {item.intensity} • PPE {item.ppeUsed ? 'Ya' : 'Tidak'}</span><div className="space-x-2"><button className="text-sky-700" onClick={() => { setExposureForm({ pilotId: item.pilotId, date: item.date, exposureType: item.exposureType, intensity: item.intensity, ppeUsed: item.ppeUsed, followUp: item.followUp }); setEditingId((prev) => ({ ...prev, exposure: item.id })); }}>Edit</button><button className="text-red-600" onClick={() => setStorage((prev) => ({ ...prev, exposure: remove(prev.exposure, item.id) }))}>Hapus</button></div></li>)}</ul>
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
