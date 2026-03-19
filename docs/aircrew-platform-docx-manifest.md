# Paket Dokumentasi DOCX Aircrew Platform

- Output utama (artefak lokal, tidak dikomit): `docs/.generated-docx/aircrew-platform-documentation.docx`.
- Generator bersifat regenerable dan menggunakan Python standard library saja.
- Dokumen ditargetkan menjadi 30 halaman dengan page break eksplisit, tabel, serta beberapa gambar/grafik.

## Daftar bagian

1. Halaman 1 — Sampul
2. Halaman 2 — Ringkasan eksekutif
3. Halaman 3 — Tujuan sistem, pengguna, dan ruang lingkup
4. Halaman 4 — Arsitektur aplikasi dan runtime
5. Halaman 5 — State management dan persistence
6. Halaman 6 — Navigasi, shell UI, dan pengalaman penggunaan
7. Halaman 7 — Dashboard readiness dan command center
8. Halaman 8 — E-Logbook
9. Halaman 9 — ORM (Operational Risk Management)
10. Halaman 10 — Training & Currency Tracker
11. Halaman 11 — Schedule & Sortie Planner
12. Halaman 12 — NOTAM & Airspace Notes
13. Halaman 13 — Flight Safety Reporting
14. Halaman 14 — Medical Readiness
15. Halaman 15 — Modul Rikkes TNI AU
16. Halaman 16 — Reports & Analytics
17. Halaman 17 — Admin Panel dan master data
18. Halaman 18 — Generic feature engine
19. Halaman 19 — Peta fitur: Medical & Aeromedical
20. Halaman 20 — Peta fitur: Training & Currency
21. Halaman 21 — Peta fitur: Flight Ops & Logbook
22. Halaman 22 — Peta fitur: Risk & Safety (ORM)
23. Halaman 23 — Peta fitur: Command & Readiness Analytics
24. Halaman 24 — Mission Lifecycle Board
25. Halaman 25 — RBAC dan governance akses
26. Halaman 26 — Data dictionary ringkas
27. Halaman 27 — Formula readiness score dan alert engine
28. Halaman 28 — Predictive safety engine dan URS roadmap
29. Halaman 29 — Kekuatan, keterbatasan, dan gap
30. Halaman 30 — Rekomendasi implementasi dan penutup

## Aset visual yang disematkan

- `docs/.generated-docx/generated-assets/architecture_layers.png` — diagram lapisan arsitektur.
- `docs/.generated-docx/generated-assets/feature_group_distribution.png` — grafik distribusi feature group.
- `docs/.generated-docx/generated-assets/seed_dataset_volume.png` — grafik volume seed dataset.
- `docs/.generated-docx/generated-assets/mission_lifecycle_workflow.png` — diagram mission lifecycle workflow.

## Cara regenerasi

```bash
python docs/generate_aircrew_platform_docx.py
```
