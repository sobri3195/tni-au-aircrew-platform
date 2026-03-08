import { requestedFeatureModules } from './featureModules';

export type ModuleKpi = {
  label: string;
  value: string;
  status: 'good' | 'watch' | 'critical';
};

export type ModuleBlueprint = {
  workflow: string[];
  kpis: ModuleKpi[];
  alerts: string[];
  complianceChecks: string[];
  slaTarget: string;
};

const statusByGroup: Record<string, ModuleKpi['status'][]> = {
  'Medical & Aeromedical': ['watch', 'good', 'watch'],
  'Training & Currency': ['watch', 'good', 'critical'],
  'Flight Ops & Logbook': ['good', 'watch', 'watch'],
  'Risk & Safety (ORM)': ['critical', 'watch', 'good'],
  'Command & Readiness Analytics': ['watch', 'good', 'watch'],
  'Monitoring Eksternal': ['watch', 'critical', 'good'],
  'Mission Lifecycle Terpadu': ['watch', 'watch', 'critical']
};

const groupDefaults: Record<string, Omit<ModuleBlueprint, 'kpis' | 'workflow'>> = {
  'Medical & Aeromedical': {
    alerts: ['Medical validity < 30 hari wajib review flight surgeon.', 'Waiver aktif harus ditautkan dengan restriction yang berlaku.', 'Status unfit otomatis memblokir crew assignment.'],
    complianceChecks: ['Dokumen AMC terbaru terunggah.', 'Review post-flight symptom mingguan dilakukan.', 'Audit kerahasiaan data medis tercatat.'],
    slaTarget: 'SLA evaluasi medical: 24 jam sejak data masuk.'
  },
  'Training & Currency': {
    alerts: ['Expiry training 30/60/90 hari diprioritaskan otomatis.', 'Checkride overdue memicu status AMBER.', 'Konflik role-aircraft harus diresolusikan sebelum sortie.'],
    complianceChecks: ['Jam simulator tervalidasi instruktur.', 'Evidence sertifikat memiliki masa berlaku.', 'Matriks kualifikasi ditandatangani komandan.'],
    slaTarget: 'SLA penutupan gap training: 72 jam.'
  },
  'Flight Ops & Logbook': {
    alerts: ['Sortie tanpa fit-check harus ditahan.', 'Event fisiologis wajib di-review medical officer.', 'Tail number dengan maintenance flag tidak bisa dialokasikan.'],
    complianceChecks: ['Semua sortie memiliki remark pasca terbang.', 'Debrief fatigue rating tercatat.', 'Logbook sinkron dengan schedule planner.'],
    slaTarget: 'SLA validasi logbook: H+1 setelah sortie.'
  },
  'Risk & Safety (ORM)': {
    alerts: ['ORM high-risk memerlukan manual override komandan.', 'Incident severity major memicu workflow investigasi.', 'Mitigasi lewat due date memicu escalation.'],
    complianceChecks: ['Risk register memiliki PIC aktif.', 'Evidence mitigasi terlampir.', 'Akar masalah (RCA) terdokumentasi.'],
    slaTarget: 'SLA review laporan insiden: 12 jam.'
  },
  'Command & Readiness Analytics': {
    alerts: ['Readiness RED harus memiliki action plan dalam 6 jam.', 'Perubahan state manual wajib alasan tertulis.', 'Audit log anomali akses dipantau harian.'],
    complianceChecks: ['Rule engine tervalidasi lintas unit.', 'SLA prioritas actions dipantau realtime.', 'Kontrol RBAC diuji berkala.'],
    slaTarget: 'SLA pembaruan readiness dashboard: < 5 menit.'
  },
  'Monitoring Eksternal': {
    alerts: ['NOTAM kategori hazard dipush ke semua scheduler.', 'Cuaca severe secara otomatis menurunkan mission state.', 'Duty-rest violation mengunci assignment kru.'],
    complianceChecks: ['Sumber data eksternal tervalidasi timestamp.', 'Cache offline tersinkron saat koneksi pulih.', 'Conflict resolution menghasilkan audit trail.'],
    slaTarget: 'SLA ingest data eksternal: 10 menit.'
  },
  'Mission Lifecycle Terpadu': {
    alerts: ['Mission intake yang belum lengkap memblokir paket misi.', 'Go/No-Go wajib menunggu sinkronisasi ORM, cuaca, dan medical gate.', 'Lessons learned kritikal otomatis membuat task corrective action.'],
    complianceChecks: ['Setiap misi memiliki jejak approval berurutan.', 'Branch contingency terdokumentasi beserta trigger aktivasi.', 'Feedback training tersambung ke kru dan mission type terkait.'],
    slaTarget: 'SLA keputusan gate misi: maksimal 15 menit sebelum ETD.'
  }
};

const workflowByKeyword: Array<{ keyword: RegExp; tasks: string[] }> = [
  { keyword: /medical|medis|vaccination|mental|fitness|occupational/i, tasks: ['Verifikasi input klinis terbaru.', 'Jalankan fit/unfit gate sebelum roster.', 'Kirim ringkasan ke flight surgeon.'] },
  { keyword: /training|currency|qualification|learning/i, tasks: ['Sinkronkan syllabus & jam simulator.', 'Validasi status checkride dan expiry.', 'Assign prioritas remediation.'] },
  { keyword: /logbook|sortie|debrief|aircraft|physio/i, tasks: ['Review data sortie dan event penting.', 'Konfirmasi crew assignment bebas konflik.', 'Publikasikan debrief dan corrective actions.'] },
  { keyword: /risk|incident|warning|analytics|orm/i, tasks: ['Hitung skor risiko menggunakan template aktif.', 'Tindak lanjuti mitigasi dengan due date jelas.', 'Eskalasi alert kritikal ke chain of command.'] },
  { keyword: /readiness|mission state|priority|audit|rbac|offline|sync|export/i, tasks: ['Perbarui score readiness lintas modul.', 'Verifikasi aturan manual override.', 'Catat semua perubahan pada audit log.'] },
  { keyword: /notam|weather|duty|rest/i, tasks: ['Tarik feed eksternal terbaru.', 'Deteksi dampak terhadap jadwal misi.', 'Broadcast advisory ke user terkait.'] },
  { keyword: /mission|intake|gate|contingency|lesson|feedback|what-if|package|execution/i, tasks: ['Pastikan dependensi lintas modul sudah tertaut.', 'Eksekusi decision gate sesuai SLA komando.', 'Kirim feedback hasil misi ke training dan readiness loop.'] }
];

const buildKpis = (title: string, group: string): ModuleKpi[] => {
  const statuses = statusByGroup[group] ?? ['watch', 'good', 'watch'];
  return [
    { label: `${title} Coverage`, value: '92%', status: statuses[0] },
    { label: 'Data Completeness', value: '88%', status: statuses[1] },
    { label: 'Open Critical Items', value: '3 item', status: statuses[2] }
  ];
};

const buildWorkflow = (title: string): string[] => {
  const matched = workflowByKeyword.find((entry) => entry.keyword.test(title));
  return matched?.tasks ?? ['Inisiasi data modul.', 'Lakukan review operasional.', 'Final approval dari komandan.'];
};

export const moduleBlueprints: Record<string, ModuleBlueprint> = requestedFeatureModules.reduce<Record<string, ModuleBlueprint>>((acc, module) => {
  const defaults = groupDefaults[module.group];

  acc[module.path] = {
    workflow: buildWorkflow(module.title),
    kpis: buildKpis(module.title, module.group),
    alerts: defaults?.alerts ?? ['Belum ada alert khusus.'],
    complianceChecks: defaults?.complianceChecks ?? ['Belum ada compliance check.'],
    slaTarget: defaults?.slaTarget ?? 'SLA belum ditentukan.'
  };

  return acc;
}, {});
