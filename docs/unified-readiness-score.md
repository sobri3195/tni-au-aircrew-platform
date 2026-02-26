# Unified Readiness Score (URS) — Rancangan Fitur

## 1. Tujuan Strategis
Unified Readiness Score (URS) adalah skor 0–100 yang menyatukan status kesiapan **Medical**, **Training Currency**, **Fatigue**, **Operational Risk Management (ORM)**, dan **Maintenance** untuk membantu pengambilan keputusan cepat pada level:
- **Personel** (pilot, navigator, crew chief, loadmaster, dll.)
- **Kru/misi** (kombinasi personel + platform + jenis sortie)
- **Skuadron** (agregasi kesiapan harian/mingguan)

Tujuan utama:
1. Menyediakan satu indikator terpadu yang tetap bisa di-*drill-down* ke faktor penyebab.
2. Mengurangi keputusan berbasis intuisi semata untuk *go/no-go mission*.
3. Mendukung prioritisasi intervensi (medis, pelatihan ulang, rest cycle, maintenance recovery).

---

## 2. Definisi Komponen Skor
Semua komponen dinormalisasi ke rentang **0–100** sebelum pembobotan.

### 2.1 Medical Score (MS)
Mengukur status fit-to-fly individu.

Contoh subfaktor:
- Validitas medical class / periodik (expired mendekati 0).
- Restriksi medis aktif (mis. no-night-flying, G-limit).
- Temuan kesehatan kritis (grounding sementara/permanen).
- Kepatuhan pemeriksaan berkala.

Contoh rumus awal:
`MS = 0.40*Validity + 0.30*RestrictionImpact + 0.20*HealthRisk + 0.10*ExamCompliance`

> Catatan: `RestrictionImpact` dan `HealthRisk` dihitung dengan skema penalti (semakin berat restriksi/risiko, semakin kecil nilai).

### 2.2 Training Currency Score (TCS)
Mengukur kemutakhiran kompetensi sesuai profil misi.

Subfaktor:
- Currency item wajib (instrument, formation, NVG, weapon qual, emergency procedure).
- Jam terbang minimum rolling window (30/60/90 hari).
- Sim check / eval check terkini.
- Kelulusan skenario khusus tipe misi.

Rumus awal:
`TCS = 0.45*MandatoryCurrency + 0.25*FlightHourRecency + 0.20*CheckRideStatus + 0.10*MissionSpecificQual`

### 2.3 Fatigue Score (FS)
Mengukur risiko kelelahan operasional.

Subfaktor:
- Duty time vs regulatory limit.
- Rest adequacy (sleep opportunity & circadian disruption).
- Time-zone shift / jet lag.
- Streak misi berisiko tinggi.

Rumus awal:
`FS = 100 - (0.35*DutyExcessPenalty + 0.30*SleepDebtPenalty + 0.20*CircadianPenalty + 0.15*HighRiskStreakPenalty)`

### 2.4 ORM Score (ORS)
Mengukur risiko operasi sesuai matriks ORM organisasi.

Subfaktor:
- Hazard severity × probability residual.
- Lingkungan operasi (cuaca, ancaman, medan).
- Kompleksitas paket misi.
- Mitigasi yang sudah diterapkan.

Rumus awal:
`ORS = 100 - ResidualRiskIndex`

Dengan:
`ResidualRiskIndex = f(HazardScore, EnvironmentScore, MissionComplexity, MitigationEffectiveness)`

### 2.5 Maintenance Score (MTS)
Mengukur kesiapan alutsista/platform yang dipakai misi.

Subfaktor:
- Mission Capable (MC) status.
- Deferred discrepancy (MEL/CDL) berbobot kritikalitas.
- Reliability trend (abort rate, repeat write-up).
- Ketersediaan part kritis.

Rumus awal:
`MTS = 0.40*MCStatus + 0.25*DeferredDefectHealth + 0.20*ReliabilityTrend + 0.15*CriticalPartAvailability`

---

## 3. Formula URS Inti (0–100)

### 3.1 Level Personel
Untuk personel, komponen Maintenance dapat dimasukkan sebagai *assigned aircraft readiness* (jika sudah diketahui platform) atau dikecilkan bila belum.

`URS_person = wM*MS + wT*TCS + wF*FS + wO*ORS + wMT*MTS_assigned`

Default bobot baseline (general mission):
- Medical (`wM`) = 0.25
- Training (`wT`) = 0.25
- Fatigue (`wF`) = 0.20
- ORM (`wO`) = 0.15
- Maintenance (`wMT`) = 0.15

### 3.2 Level Kru
Skor kru harus sensitif terhadap peran kritis (PIC, IP, flight engineer, dsb.).

1. Hitung `URS_person` semua anggota kru.
2. Terapkan koefisien per peran:
   - PIC/IP: 1.25
   - Mission Commander: 1.20
   - Crew lainnya: 1.00
3. Agregasi:
`URS_crew_raw = weighted_mean(URS_person_i, role_weight_i)`
4. Terapkan penalti bottleneck peran kritis:
`URS_crew = URS_crew_raw - CriticalRolePenalty`

Contoh `CriticalRolePenalty`:
- Jika skor PIC < 60 → penalti 15.
- Jika ada 2+ anggota kru < 50 → penalti tambahan 10.

### 3.3 Level Skuadron
Gabungkan kesiapan personel, kesiapan kru terjadwal, dan kesehatan armada.

`URS_sq = 0.40*Median(URS_crew_24h) + 0.35*P40(URS_person_available) + 0.25*FleetReadinessIndex`

Menggunakan median/P40 untuk mengurangi distorsi outlier.

---

## 4. Bobot Adaptif per Tipe Misi
Bobot berubah berdasarkan mission profile agar skor mencerminkan risiko dominan.

## 4.1 Matriks Bobot Adaptif (Contoh V1)

| Tipe Misi | Medical | Training | Fatigue | ORM | Maintenance |
|---|---:|---:|---:|---:|---:|
| Training Routine | 0.20 | 0.35 | 0.20 | 0.10 | 0.15 |
| Combat / High Threat | 0.20 | 0.25 | 0.20 | 0.25 | 0.10 |
| Night / NVG | 0.20 | 0.25 | 0.30 | 0.15 | 0.10 |
| Long-range / Air Refueling | 0.20 | 0.20 | 0.35 | 0.10 | 0.15 |
| Humanitarian / SAR | 0.25 | 0.20 | 0.20 | 0.20 | 0.15 |

Aturan teknis:
- Total bobot selalu = 1.00.
- Bobot dipilih otomatis dari `mission_type` + `mission_phase`.
- Bila misi hibrid, gunakan kombinasi linear berbasis durasi fase.

### 4.2 Adaptive Calibration
- Setiap 30 hari lakukan evaluasi korelasi URS vs incident/mission degradation.
- Gunakan constrained optimization (mis. Bayesian/regularized regression) agar bobot tidak berubah liar.
- Batas perubahan bobot per siklus: ±0.05 per komponen.

---

## 5. Command Override & Governance

## 5.1 Jenis Override
1. **Hard No-Go Override**
   - Komandan bisa menetapkan misi/personel **No-Go** walau skor tinggi.
   - Alasan wajib (kategori + narasi).
2. **Conditional Go Override**
   - Misi boleh lanjut dengan syarat mitigasi (mis. crew augmentation, delay 4 jam untuk rest, swap aircraft).
3. **Exceptional Go Override**
   - Misi tetap dijalankan meski skor di bawah threshold karena urgensi operasi.
   - Wajib otorisasi dua tingkat (Komandan + Ops Director).

## 5.2 Aturan Audit
- Semua override menyimpan: siapa, kapan, alasan, evidence, mitigasi, expiry time.
- Override otomatis kedaluwarsa setelah jendela operasi selesai.
- Dashboard menampilkan badge: `AUTO`, `CMD-OVR`, `CMD-OVR-CRITICAL`.
- Event masuk ke immutable audit log untuk evaluasi pascamisi.

## 5.3 Guardrails
- Tidak boleh override untuk pelanggaran regulasi keselamatan absolut (hard safety rules).
- Jika override pada skor < 40, sistem wajib memunculkan konfirmasi risiko berlapis + checklist mitigasi minimum.

---

## 6. Ambang Skor & Keputusan Operasi

| Rentang URS | Status | Rekomendasi |
|---|---|---|
| 85–100 | Green | Ready untuk mayoritas misi sesuai profil |
| 70–84 | Amber | Ready bersyarat, perlu review faktor terendah |
| 55–69 | Red-Prep | Tunda jika memungkinkan, wajib mitigation plan |
| <55 | Red-NoGo | Tidak direkomendasikan, butuh override formal |

Tambahan aturan:
- Jika salah satu komponen < 40, status minimum otomatis menjadi **Amber** walau total > 85.
- Jika Medical atau Maintenance < 30, default **No-Go gate** kecuali exceptional chain override.

---

## 7. Desain UI Dashboard

## 7.1 Layout Utama (Command View)
1. **Top bar KPI**
   - URS rata-rata skuadron (hari ini)
   - % crew Green/Amber/Red
   - Jumlah override aktif
2. **Heatmap kesiapan**
   - Sumbu X: flight / mission slot
   - Sumbu Y: crew
   - Warna: URS + ikon bottleneck (M, T, F, O, MT)
3. **Critical Queue panel**
   - Daftar prioritas tertinggi (mis. “Crew A URS 48, Fatigue 22, mission T-3h”)
4. **Drill-down panel**
   - Waterfall kontribusi komponen per crew/personel
   - Riwayat 14 hari + prediksi 24 jam

## 7.2 Personel/Kru Detail View
- Gauge URS + tren sparkline.
- Breakdown 5 komponen (bar + delta vs kemarin).
- Explainability card: “Skor turun -12 karena sleep debt + currency NVG expired.”
- Action button cepat:
  - Reassign crew
  - Request medical review
  - Adjust sortie time
  - Trigger maintenance expedite

## 7.3 UX Rules
- **Color semantics** konsisten (Green/Amber/Red) dan aksesibel (ikon + teks, bukan warna saja).
- Data freshness indicator per komponen (mis. “Medical updated 2h lalu”).
- Klik satu kali untuk melihat *why* sebelum *what to do*.

---

## 8. Alur Notifikasi Prioritas Tinggi

## 8.1 Trigger Event (Priority-1)
Notifikasi prioritas tinggi dikirim jika salah satu kondisi:
1. `URS_crew < 55` dengan `mission_T_minus <= 6h`.
2. Komponen Medical/Maintenance < 30 pada kru yang dijadwalkan.
3. Perubahan skor mendadak > 20 poin dalam 2 jam.
4. Override kritikal dibuat untuk misi high-threat.

## 8.2 Routing & Escalation
Urutan penerima:
1. Duty Ops Officer (instan)
2. Flight Commander (≤5 menit)
3. Squadron Commander (≤10 menit, jika belum di-ack)
4. Wing Ops Center (≤15 menit, jika misi prioritas nasional)

Kanal:
- In-app alert (wajib)
- Secure mobile push
- Email terenkripsi / message bus militer (opsional sesuai kebijakan)

## 8.3 Payload Notifikasi
Wajib memuat:
- Identitas misi/kru
- Nilai URS + komponen terendah
- Dampak operasional (delay risk, no-go risk)
- Tiga rekomendasi tindakan tercepat
- Tombol `Acknowledge`, `Assign Action`, `Request Override Review`

## 8.4 SLA Operasional
- Ack Priority-1 maksimal 5 menit.
- Jika tidak ada action 15 menit, auto-escalate.
- Semua event dicatat untuk *after-action review*.

---

## 9. Arsitektur Data & Integrasi (Ringkas)
- **Ingestion layer**: medical system, training LMS/sortie log, fatigue roster, ORM tool, maintenance MIS.
- **Scoring engine** (event-driven + batch fallback) menghitung URS tiap perubahan data penting.
- **Rule engine** menangani threshold, guardrail, override policy.
- **Notification engine** mengelola prioritas, deduplikasi, escalation timer.
- **Audit & analytics store** untuk evaluasi tren dan kalibrasi bobot.

Frekuensi refresh rekomendasi:
- Event-driven near real-time untuk perubahan kritikal.
- Full recompute setiap 15 menit.

---

## 10. Roadmap Implementasi Bertahap

### Phase 1 (MVP, 6–8 minggu)
- Baseline formula + bobot statik.
- Dashboard command view + alert Priority-1.
- Override manual dengan audit log.

### Phase 2 (8–12 minggu)
- Bobot adaptif per tipe misi.
- Explainability lebih detail + rekomendasi tindakan otomatis.
- Integrasi eskalasi multikanal penuh.

### Phase 3 (lanjutan)
- Prediksi readiness 24–72 jam.
- Optimizer re-assignment kru otomatis (human-in-the-loop).
- Simulasi “what-if” sebelum mission launch.

---

## 11. KPI Keberhasilan Fitur
1. Penurunan mission cancellation mendadak karena faktor readiness.
2. Penurunan incident terkait fatigue/currency lapse.
3. Waktu respons terhadap alert kritikal.
4. Rasio override yang tervalidasi benar saat AAR.
5. Kepuasan komandan terhadap kualitas keputusan *go/no-go*.
