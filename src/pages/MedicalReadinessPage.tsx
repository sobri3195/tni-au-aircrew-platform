import { useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { useApp } from '../contexts/AppContext';
import { daysUntil } from '../utils/date';

const medicalClassByStatus = {
  Active: 'Class I',
  Limited: 'Class II',
  Grounded: 'Class III'
} as const;

export const MedicalReadinessPage = () => {
  const { state } = useApp();
  const [selectedPilotId, setSelectedPilotId] = useState(state.profiles[0]?.id ?? '');
  const [sleepHours, setSleepHours] = useState(7);
  const [waterIntake, setWaterIntake] = useState(2);
  const [weight, setWeight] = useState(72);
  const [height, setHeight] = useState(172);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  const selectedPilot = state.profiles.find((profile) => profile.id === selectedPilotId) ?? state.profiles[0];

  const bmiScore = useMemo(() => {
    const meter = height / 100;
    if (!meter) return 0;
    return Number((weight / (meter * meter)).toFixed(1));
  }, [height, weight]);

  const hydrationTarget = useMemo(() => Number((weight * 0.033).toFixed(1)), [weight]);

  const runMedicalAction = (featureName: string, message: string) => {
    setActionLog((prev) => [`${new Date().toLocaleTimeString('id-ID')} • ${featureName} • ${selectedPilot?.name ?? 'Pilot'}`, ...prev].slice(0, 12));
    setToast(message);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Medical Readiness</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Status medical class, expiry, immunization, restriction warning.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {state.profiles.map((profile, index) => {
          const medicalExpiry = new Date(Date.now() + (45 - index * 40) * 24 * 60 * 60 * 1000).toISOString();
          const immunizationExpiry = new Date(Date.now() + (120 - index * 100) * 24 * 60 * 60 * 1000).toISOString();
          const medicalDays = daysUntil(medicalExpiry);
          const immDays = daysUntil(immunizationExpiry);
          const hasRestriction = profile.status !== 'Active';

          return (
            <div key={profile.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{profile.name}</h3>
                <Badge label={medicalClassByStatus[profile.status]} tone="blue" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Medical expiry: {new Date(medicalExpiry).toLocaleDateString('id-ID')}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Immunization expiry: {new Date(immunizationExpiry).toLocaleDateString('id-ID')}</p>
              <div className="flex gap-2">
                <Badge label={medicalDays < 30 ? 'Medical Expiring' : 'Medical OK'} tone={medicalDays < 30 ? 'yellow' : 'green'} />
                <Badge label={immDays < 30 ? 'Immunization Due' : 'Immunization OK'} tone={immDays < 30 ? 'yellow' : 'green'} />
                {hasRestriction && <Badge label="Restriction Warning" tone="red" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="font-semibold">Medical Action Center (10 Fitur Aktif)</h3>
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <button className="rounded-lg border p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => runMedicalAction('Medical Class Renewal', 'Permintaan perpanjangan medical class berhasil dibuat.')}>1. Medical Class Renewal</button>
          <button className="rounded-lg border p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => runMedicalAction('Immunization Booster', 'Reminder booster imunisasi dikirim ke pilot dan petugas medis.')}>2. Immunization Booster Reminder</button>
          <button className="rounded-lg border p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => runMedicalAction('Restriction Review', 'Review restriction diteruskan ke Flight Surgeon.')}>3. Restriction Review</button>
          <button className="rounded-lg border p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => runMedicalAction('Medication Declaration', 'Form deklarasi obat tersimpan.')}>4. Medication Declaration</button>
          <button className="rounded-lg border p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => runMedicalAction('Waiver Request', 'Permintaan waiver medis masuk ke panel admin medis.')}>5. Waiver Request</button>
          <button className="rounded-lg border p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" onClick={() => runMedicalAction('Emergency Contact Drill', 'Simulasi emergency contact berhasil dijalankan.')}>6. Emergency Contact Drill</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3 dark:border-slate-700">
            <p className="mb-2 text-sm font-semibold">7. Sleep Fitness Check</p>
            <input type="range" min={2} max={12} value={sleepHours} onChange={(event) => setSleepHours(Number(event.target.value))} className="w-full" />
            <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">Input tidur: {sleepHours} jam</p>
            <button className="rounded-lg bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => runMedicalAction('Sleep Fitness Check', sleepHours >= 7 ? 'Status FIT: durasi tidur memenuhi syarat.' : 'Status CAUTION: disarankan istirahat tambahan sebelum sortie.')}>Jalankan Analisis</button>
          </div>

          <div className="rounded-lg border p-3 dark:border-slate-700">
            <p className="mb-2 text-sm font-semibold">8. Hydration Monitor</p>
            <input type="range" min={1} max={5} step={0.1} value={waterIntake} onChange={(event) => setWaterIntake(Number(event.target.value))} className="w-full" />
            <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">Intake: {waterIntake} L / target {hydrationTarget} L</p>
            <button className="rounded-lg bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => runMedicalAction('Hydration Monitor', waterIntake >= hydrationTarget ? 'Hidrasi aman untuk misi hari ini.' : 'Perlu tambahan cairan sebelum briefing.')}>Aktivasi Monitor</button>
          </div>

          <div className="rounded-lg border p-3 dark:border-slate-700">
            <p className="mb-2 text-sm font-semibold">9. BMI & Weight Trend</p>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1">BB <input type="number" className="w-16 rounded border border-slate-300 px-1 py-0.5 dark:border-slate-700 dark:bg-slate-900" value={weight} onChange={(event) => setWeight(Number(event.target.value) || 0)} /> kg</label>
              <label className="flex items-center gap-1">TB <input type="number" className="w-16 rounded border border-slate-300 px-1 py-0.5 dark:border-slate-700 dark:bg-slate-900" value={height} onChange={(event) => setHeight(Number(event.target.value) || 0)} /> cm</label>
            </div>
            <p className="my-2 text-xs text-slate-600 dark:text-slate-300">BMI: {bmiScore}</p>
            <button className="rounded-lg bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => runMedicalAction('BMI & Weight Trend', `BMI ${bmiScore} berhasil dihitung dan disimpan.`)}>Simpan Evaluasi BMI</button>
          </div>

          <div className="rounded-lg border p-3 dark:border-slate-700">
            <p className="mb-2 text-sm font-semibold">10. Flight Surgeon Appointment</p>
            <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">Slot berikutnya: 09:30 WIB (besok)</p>
            <button className="rounded-lg bg-sky-700 px-3 py-1 text-xs text-white" onClick={() => runMedicalAction('Flight Surgeon Appointment', 'Jadwal konsultasi medis berhasil dibooking.')}>Book Appointment</button>
          </div>
        </div>

        <div className="rounded-lg border p-3 dark:border-slate-700">
          <p className="mb-2 text-sm font-semibold">Action Log</p>
          {actionLog.length === 0 ? (
            <p className="text-xs text-slate-600 dark:text-slate-300">Belum ada aksi. Semua fitur sudah aktif dan siap dipakai.</p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {actionLog.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </section>
  );
};
