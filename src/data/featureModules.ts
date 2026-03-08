export type FeatureModule = {
  path: string;
  title: string;
  description: string;
  group: string;
  icon: string;
  navLabel?: string;
};

export const requestedFeatureModules: FeatureModule[] = [
  {
    group: 'Medical & Aeromedical',
    path: '/medical-profile',
    navLabel: 'Profil Medis Aircrew',
    title: 'Profil Medis Aircrew',
    description: 'Kelola kelas medical, waiver, dan riwayat pemeriksaan untuk setiap aircrew.',
    icon: '🩻'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/medical-validity',
    navLabel: 'Medical Validity Management',
    title: 'Medical Validity Management',
    description: 'Pantau masa berlaku medical, reminder otomatis, serta status fit/unfit.',
    icon: '📅'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/medication-restriction',
    navLabel: 'Medication & Restriction',
    title: 'Medication & Restriction Tracker',
    description: 'Catat obat, efek sedasi, dan grounding rules agar keputusan terbang tetap aman.',
    icon: '💊'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/vaccination-monitoring',
    navLabel: 'Vaccination Window',
    title: 'Vaccination & Post-vaccine Window',
    description: 'Monitoring 48–72 jam pasca vaksin dengan alert terhadap gejala dan pembatasan terbang.',
    icon: '💉'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/fatigue-sleep-monitoring',
    navLabel: 'Fatigue & Sleep Monitoring',
    title: 'Fatigue & Sleep Monitoring',
    description: 'Monitoring duty/rest, sleep debt, dan faktor circadian untuk mitigasi fatigue operasional.',
    icon: '🛌'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/mental-readiness',
    navLabel: 'Mental Readiness Check-in',
    title: 'Mental Readiness Check-in',
    description: 'Skrining singkat kesiapan mental dengan mekanisme eskalasi rahasia.',
    icon: '🧠'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/physical-fitness',
    navLabel: 'Physical Fitness',
    title: 'Physical Fitness & Anthropometry',
    description: 'Rekam BMI, blood pressure, VO2/tes lari, serta body composition.',
    icon: '🏃'
  },
  {
    group: 'Medical & Aeromedical',
    path: '/occupational-health',
    navLabel: 'Occupational Health',
    title: 'Exposure / Occupational Health',
    description: 'Pantau paparan kebisingan, chemical, dan heat stress per personel.',
    icon: '🧯'
  },
  {
    group: 'Training & Currency',
    path: '/training-detail',
    navLabel: 'Training Tracker Detail',
    title: 'Training Tracker Detail',
    description: 'Detail syllabus, jam simulator, dan checkride per penerbang.',
    icon: '📘'
  },
  {
    group: 'Training & Currency',
    path: '/training-expiry-forecast',
    navLabel: 'Training Expiry Forecast',
    title: 'Training Expiry Forecast',
    description: 'Forecast expiry 30/60/90 hari dengan prioritas tindakan.',
    icon: '⏳'
  },
  {
    group: 'Training & Currency',
    path: '/currency-status',
    navLabel: 'Currency Status Engine',
    title: 'Currency Status Engine',
    description: 'Evaluasi currency night, instrument, formation, dan low level.',
    icon: '🎚️'
  },
  {
    group: 'Training & Currency',
    path: '/qualification-matrix',
    navLabel: 'Qualification Matrix',
    title: 'Qualification Matrix',
    description: 'Matriks kualifikasi pilot vs role vs aircraft type.',
    icon: '🧩'
  },
  {
    group: 'Training & Currency',
    path: '/learning-record',
    navLabel: 'Learning Record',
    title: 'Learning Record & Evidence Upload',
    description: 'Unggah sertifikat dan dokumen evidence pembelajaran.',
    icon: '📎'
  },
  {
    group: 'Flight Ops & Logbook',
    path: '/elogbook-integrated',
    navLabel: 'E-Logbook Terintegrasi',
    title: 'E-Logbook Terintegrasi',
    description: 'Kelola sortie, jam terbang, event, dan remark dalam satu logbook.',
    icon: '🛫'
  },
  {
    group: 'Flight Ops & Logbook',
    path: '/sortie-planning',
    navLabel: 'Sortie Planning',
    title: 'Sortie Planning & Crew Assignment',
    description: 'Perencanaan sortie dengan fit check dan conflict detection.',
    icon: '🗂️'
  },
  {
    group: 'Flight Ops & Logbook',
    path: '/postflight-medical-debrief',
    navLabel: 'Post-Flight Medical',
    title: 'Post-Flight Medical Debrief',
    description: 'Checklist gejala pasca misi dan fatigue rating untuk tindak lanjut medis.',
    icon: '🩹'
  },
  {
    group: 'Flight Ops & Logbook',
    path: '/physio-event-reporting',
    navLabel: 'Physio Event Reporting',
    title: 'G-Force / Hypoxia / Physio Event Reporting',
    description: 'Pelaporan kejadian G-LOC, barotrauma, hypoxia, dan event fisiologis lain.',
    icon: '🧬'
  },
  {
    group: 'Flight Ops & Logbook',
    path: '/aircraft-availability-link',
    navLabel: 'Aircraft Availability',
    title: 'Aircraft Availability Link',
    description: 'Tautkan tail number, status armada, dan maintenance flag.',
    icon: '🛩️'
  },
  {
    group: 'Risk & Safety (ORM)',
    path: '/orm-builder',
    navLabel: 'ORM Builder',
    title: 'Risk Assessment (ORM) Builder',
    description: 'Template risiko dan scoring terstruktur untuk pra-misi.',
    icon: '🧮'
  },
  {
    group: 'Risk & Safety (ORM)',
    path: '/risk-register',
    navLabel: 'Risk Register',
    title: 'Risk Register & Mitigation Tracking',
    description: 'Lacak PIC, due date, dan evidence mitigasi risiko.',
    icon: '📒'
  },
  {
    group: 'Risk & Safety (ORM)',
    path: '/incident-workflow',
    navLabel: 'Incident Workflow',
    title: 'Incident Reporting & Workflow',
    description: 'Alur submit → review → close untuk pelaporan insiden.',
    icon: '🚧'
  },
  {
    group: 'Risk & Safety (ORM)',
    path: '/safety-trend-analytics',
    navLabel: 'Safety Trend Analytics',
    title: 'Trend Safety Analytics',
    description: 'Analitik incident rate per 100 sorties dan heatmap risiko.',
    icon: '📉'
  },
  {
    group: 'Risk & Safety (ORM)',
    path: '/early-warning-alerts',
    navLabel: 'Early Warning Alerts',
    title: 'Early Warning Alerts',
    description: 'Alert dini untuk training expiry, medical expiry, dan high risk.',
    icon: '🚨'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/unified-readiness-score',
    navLabel: 'Readiness Score Model',
    title: 'Unified Readiness Score Model',
    description: 'Model penilaian berbobot untuk medical, training, dan ops risk.',
    icon: '🧠'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/mission-state-rules',
    navLabel: 'Mission State Rules',
    title: 'Mission State Rules',
    description: 'Status RED/AMBER/GREEN otomatis dengan manual override.',
    icon: '🚦'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/readiness-drilldown',
    navLabel: 'Readiness Drill-Down',
    title: 'Readiness Drill-Down',
    description: 'Analisis kesiapan dari level unit → squadron → individual.',
    icon: '🔍'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/priority-actions',
    navLabel: 'Priority Actions',
    title: 'Priority Actions Dashboard',
    description: 'Dashboard antrean tugas prioritas dengan SLA.',
    icon: '📌'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/export-laporan',
    navLabel: 'Export Laporan',
    title: 'Export Laporan',
    description: 'Ekspor PDF/Excel dengan tanda tangan digital internal.',
    icon: '🧾'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/audit-log-viewer',
    navLabel: 'Audit Log Viewer',
    title: 'Audit Log Viewer',
    description: 'Audit trail: siapa mengubah apa, kapan, dan alasannya.',
    icon: '🕵️'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/rbac',
    navLabel: 'Role-Based Access',
    title: 'Role-Based Access Control (RBAC)',
    description: 'Pengaturan akses berbasis peran dokter/pilot/ops/komandan.',
    icon: '🔐'
  },
  {
    group: 'Command & Readiness Analytics',
    path: '/offline-sync',
    navLabel: 'Offline Mode + Sync',
    title: 'Offline Mode + Sync',
    description: 'Mode offline, cache lokal, dan conflict resolution saat sinkronisasi.',
    icon: '🔄'
  },
  {
    group: 'Monitoring Eksternal',
    path: '/notam-monitor',
    navLabel: 'NOTAM Monitor',
    title: 'NOTAM Monitor',
    description: 'Monitoring NOTAM eksternal untuk area operasi terkait.',
    icon: '📡'
  },
  {
    group: 'Monitoring Eksternal',
    path: '/weather-brief-integration',
    navLabel: 'Weather Brief Integration',
    title: 'Weather Brief Integration',
    description: 'Integrasi briefing cuaca ke alur perencanaan misi.',
    icon: '🌦️'
  },
  {
    group: 'Monitoring Eksternal',
    path: '/crew-duty-rest-monitor',
    navLabel: 'Crew Duty & Rest Monitor',
    title: 'Crew Duty & Rest Monitor',
    description: 'Monitor kepatuhan duty/rest dan pelanggaran limit.',
    icon: '⏱️'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/mission-intake-hub',
    navLabel: 'Mission Intake Hub',
    title: 'Mission Intake Hub',
    description: 'Pintu masuk requirement misi yang menautkan objective ke modul package, risiko, dan alokasi kru.',
    icon: '🧾'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/crew-readiness-allocator',
    navLabel: 'Crew Readiness Allocator',
    title: 'Crew Readiness Allocator',
    description: 'Mencocokkan demand misi dari Mission Intake Hub dengan readiness medical, training, dan duty-rest kru.',
    icon: '🧑‍✈️'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/mission-package-linker',
    navLabel: 'Mission Package Linker',
    title: 'Mission Package Linker',
    description: 'Menyatukan dokumen brief, aircraft plan, dan assignment kru sebelum diproses ORM.',
    icon: '🧩'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/integrated-go-no-go-gate',
    navLabel: 'Integrated Go/No-Go Gate',
    title: 'Integrated Go/No-Go Gate',
    description: 'Gerbang keputusan otomatis berbasis data ORM, cuaca, NOTAM, dan status personel lintas modul.',
    icon: '🚦'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/mission-execution-watch',
    navLabel: 'Mission Execution Watch',
    title: 'Mission Execution Watch',
    description: 'Monitoring eksekusi sortie real-time dengan event feed untuk debrief dan safety workflow.',
    icon: '🛰️'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/contingency-branch-manager',
    navLabel: 'Contingency Branch Manager',
    title: 'Contingency Branch Manager',
    description: 'Kelola percabangan rencana saat cuaca, aircraft, atau kesehatan kru berubah ketika misi berjalan.',
    icon: '🌐'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/post-mission-recovery-loop',
    navLabel: 'Post-Mission Recovery Loop',
    title: 'Post-Mission Recovery Loop',
    description: 'Hubungkan debrief pasca terbang, status fatigue, dan rekomendasi recovery ke jadwal berikutnya.',
    icon: '🔁'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/lessons-learned-fusion',
    navLabel: 'Lessons Learned Fusion',
    title: 'Lessons Learned Fusion',
    description: 'Konsolidasi lesson learned dari incident, training, dan debrief untuk update SOP serta skenario latihan.',
    icon: '📚'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/adaptive-training-feedback',
    navLabel: 'Adaptive Training Feedback',
    title: 'Adaptive Training Feedback',
    description: 'Umpan balik otomatis dari Lessons Learned Fusion untuk memprioritaskan remedial training per kru.',
    icon: '🎯'
  },
  {
    group: 'Mission Lifecycle Terpadu',
    path: '/command-readiness-what-if',
    navLabel: 'Command Readiness What-If',
    title: 'Command Readiness What-If Simulator',
    description: 'Simulasi dampak perubahan alokasi kru atau risiko misi terhadap readiness score komando secara instan.',
    icon: '🧠'
  }
];
