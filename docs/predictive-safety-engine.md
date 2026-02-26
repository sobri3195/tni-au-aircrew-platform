# Predictive Safety Engine — Rancangan Fitur

## 1) Tujuan Operasional
Predictive Safety Engine (PSE) dirancang sebagai lapisan **early warning** untuk mendeteksi sinyal peningkatan risiko near-miss/incident sebelum kejadian aktual terjadi. Engine memadukan empat sumber utama:
- histori logbook (intensitas terbang, pola sortie, event abnormal)
- ORM (risk level, hazard category, mitigasi)
- fatigue self-assessment (fit/caution/no-go + skor)
- NOTAM exposure (kompleksitas rute/airspace restriction/temporary hazard)

Fokus awal bukan menggantikan Flight Safety Officer, melainkan menambah _decision support_ yang terukur, dapat diaudit, dan minim alert fatigue.

---

## 2) Arsitektur Data End-to-End

### A. Data Source Layer
1. **Logbook Stream**
   - Flight hours per crew per 24h/7d/28d
   - Mission type, time-of-day (day/night), route complexity
   - Event marker: hard landing, unstable approach, RT overload, go-around

2. **ORM Dataset**
   - Risk level (Low/Medium/High)
   - Hazard tags (weather, terrain, crew coordination, maintenance)
   - Mitigation completeness (done/partial/missing)

3. **Fatigue Dataset**
   - Self-assessment score (contoh 1–5)
   - Status fit/caution/no-go
   - Sleep debt proxy, duty-rest interval

4. **NOTAM Exposure Dataset**
   - Jumlah NOTAM aktif pada rute/base/time window
   - Severity per NOTAM (advisory/restriction/critical)
   - Crew acknowledgement latency

### B. Ingestion & Standardization Layer
- **Batch + near-real-time ingest** (5–15 menit) ke staging table.
- Normalisasi ID (crew_id, mission_id, base_id) untuk join lintas modul.
- Quality gate:
  - mandatory field check
  - timestamp alignment (UTC)
  - deduplication by source_event_id

### C. Feature Store (Safety Feature Mart)
Contoh fitur yang dihitung per `crew_id x rolling_window`:
- `flight_hours_7d`, `flight_hours_night_7d`
- `orm_high_count_14d`
- `fatigue_caution_ratio_14d`
- `notam_critical_exposure_7d`
- `ack_delay_avg_minutes_7d`
- `near_miss_count_30d` (lagging context)

Output disimpan sebagai:
- **online feature table** untuk scoring cepat
- **offline feature table** untuk analisis dan tuning

### D. Scoring & Alert Layer
- Rule Engine v1 (deterministik, explainable)
- Risk score 0–100 + reason code
- Alert tier:
  - Tier 1 (monitor)
  - Tier 2 (review FSO)
  - Tier 3 (pre-mission intervention wajib)

### E. Delivery Layer
- Dashboard Safety Intelligence (heatmap unit/crew/rute)
- Pre-flight briefing card (3 alasan risiko tertinggi)
- Notification policy ke role tertentu (FSO/Ops/Commander)

### F. Governance & Audit
- Simpan versi rule (`rule_set_version`)
- Simpan feature snapshot saat alert dibuat
- Audit trail: siapa acknowledge, override, close alert

---

## 3) Contoh Rule-Based Model Awal (MVP)

### A. Prinsip Desain Rule
- Transparan dan mudah diinspeksi komandan/FSO.
- Mengutamakan **precision** di fase awal (menghindari banjir alert).
- Menghasilkan _actionable recommendation_, bukan hanya angka.

### B. Contoh Rule

#### Rule 1 — Fatigue + High Tempo Exposure
**IF** `flight_hours_7d > 18` **AND** `fatigue_caution_ratio_14d >= 0.4`  
**THEN** +25 poin risiko, reason: `R1_FATIGUE_TEMPO`

#### Rule 2 — ORM High Risk Without Adequate Mitigation
**IF** `orm_high_count_14d >= 2` **AND** `orm_mitigation_missing_count_14d >= 1`  
**THEN** +30 poin risiko, reason: `R2_ORM_UNMITIGATED`

#### Rule 3 — NOTAM Complexity Overload
**IF** `notam_critical_exposure_7d >= 3` **AND** `ack_delay_avg_minutes_7d > 180`  
**THEN** +20 poin risiko, reason: `R3_NOTAM_OVERLOAD`

#### Rule 4 — Combined Escalation Trigger
**IF** minimal dua rule di atas aktif dalam 72 jam terakhir  
**THEN** +15 poin eskalasi, reason: `R4_MULTI_FACTOR_ESCALATION`

### C. Skema Skor & Tier
- `score = min(100, sum(rule_points))`
- Tier:
  - 0–29: Normal
  - 30–49: Monitor
  - 50–69: FSO Review
  - 70–100: Command Attention / Pre-mission intervention

### D. Contoh Rekomendasi Otomatis
- R1 aktif → rekomendasi rotasi crew + mandatory rest window.
- R2 aktif → hold mission readiness sampai mitigasi ORM dilengkapi.
- R3 aktif → focused NOTAM briefing + acknowledgement checklist.

---

## 4) Indikator Leading vs Lagging

### A. Leading Indicators (untuk pencegahan)
- Kenaikan `fatigue_caution_ratio`
- Akumulasi flight hours intensif dalam rolling 7 hari
- Frekuensi ORM high-risk dan mitigasi tidak lengkap
- NOTAM critical exposure + keterlambatan acknowledge
- Kombinasi multi-faktor risiko pada crew yang sama

### B. Lagging Indicators (untuk evaluasi outcome)
- Jumlah near-miss/incident per 100 flight hours
- Severity-weighted incident index
- Repeat incident pada tipe misi yang sama
- Lost-time akibat safety event

### C. Cara Pakai Bersama
- Leading dipakai untuk **trigger intervensi dini**.
- Lagging dipakai untuk **mengukur efektivitas rule** dan kebijakan mitigasi.

---

## 5) Strategi Validasi & Kontrol False Alert

### A. Tahap Validasi
1. **Historical backtesting (3–12 bulan data)**
   - Simulasi rule pada data historis
   - Ukur precision, recall, dan lead time sebelum incident

2. **Shadow mode (tanpa notifikasi operasional)**
   - Engine jalan paralel 4–8 minggu
   - Bandingkan alert vs judgement FSO

3. **Phased rollout**
   - Mulai 1 skuadron/basis
   - Naik bertahap setelah metrik stabil

### B. Metrik Anti-Noise (wajib dipantau)
- Alert per 100 sorties
- False positive rate per tier
- Alert acknowledgement SLA
- % alert yang ditindaklanjuti vs di-dismiss
- Precision by reason code (R1, R2, R3, R4)

### C. Mekanisme Menekan False Alert
- **Hysteresis window**: alert tidak re-trigger untuk reason yang sama dalam X jam kecuali skor naik signifikan.
- **Consecutive breach requirement**: rule tertentu aktif hanya jika threshold terlampaui di 2 snapshot berturut-turut.
- **Context suppression**: suppress alert saat mission profile memang high-risk terotorisasi dan mitigasi lengkap.
- **Tiered routing**: tier rendah hanya tampil di dashboard, tidak push notification.
- **Human-in-the-loop override**: FSO dapat mark `valid / not-valid / needs-observation` untuk feedback tuning.

### D. Kalibrasi Berkala
- Review bulanan dengan panel FSO + Ops + Commander.
- Turunkan bobot rule dengan precision rendah.
- Naikkan sensitivitas rule yang konsisten memberi lead time baik.

---

## 6) Roadmap Implementasi

### Phase 0 (2 minggu) — Data Readiness
- Finalisasi data contract (logbook/ORM/fatigue/NOTAM)
- Data quality dashboard + gap remediation

### Phase 1 (3–4 minggu) — Rule Engine MVP
- Implementasi 4 rule inti + scoring + reason code
- Dashboard alert list dan audit trail

### Phase 2 (4 minggu) — Validation & Tuning
- Backtest + shadow mode
- Threshold tuning berbasis precision/alert load

### Phase 3 (lanjutan) — Hybrid Model
- Tambah model statistik/ML ringan (mis. calibrated logistic model)
- Rule tetap jadi guardrail explainability

---

## 7) Contoh Definisi Output Alert
```json
{
  "alert_id": "PSE-2026-000128",
  "crew_id": "CRW-041",
  "score": 74,
  "tier": "T3",
  "active_reasons": [
    "R1_FATIGUE_TEMPO",
    "R2_ORM_UNMITIGATED",
    "R4_MULTI_FACTOR_ESCALATION"
  ],
  "recommended_actions": [
    "Mandatory rest 12h",
    "Complete ORM mitigation before mission release",
    "FSO review within 2h"
  ],
  "model_version": "rule_v1.0.0",
  "feature_snapshot_ts": "2026-02-26T02:15:00Z"
}
```

Dokumen ini sengaja memulai dari rule-based explainable engine agar adopsi operasional cepat, kemudian berkembang ke pendekatan hybrid setelah baseline governance dan kualitas data matang.
