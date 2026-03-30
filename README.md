# TNI AU Aircrew SPA (Frontend-only)

> **Judul penyempurnaan:** *Perancangan dan Implementasi Sistem Pengambilan Keputusan Operasional Terintegrasi untuk Aircrew TNI AU Berbasis Indeks Kesiapan, Operational Risk Management (ORM), dan Prioritas Tindakan.*

Aplikasi Single Page App untuk operasional penerbang TNI AU berbasis React + TypeScript + TailwindCSS.

## Menjalankan

```bash
npm install
npm run dev
```

## Input Data Tanpa Backend (Frontend-only + Local Storage)

- Semua fitur input (tambah/ubah/hapus) berjalan langsung di browser tanpa API backend.
- Perubahan data disimpan otomatis ke **Local Storage**.
- Data akan tetap ada saat refresh selama Local Storage browser tidak dibersihkan.
- Untuk reset data, hapus Local Storage aplikasi dari browser.

## Integrasi Supabase (Opsional, Hybrid)

Project ini saat ini frontend-only dan menyimpan state ke localStorage. Untuk migrasi bertahap ke backend gratis Supabase, gunakan panduan (mulai dari **buat akun**, buat project, ambil API key, sampai integrasi Codex):

- `docs/supabase-codex-guide.md`

Ringkas setup awal:

1. Buat file `.env` dari `.env.example`.
2. Isi kredensial Supabase publishable key:

```bash
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
```

Contoh publishable key yang Anda kirim bisa dipakai di `VITE_SUPABASE_PUBLISHABLE_KEY`. **Jangan** menaruh `secret key` Supabase di frontend.

SQL tabel minimal untuk CRUD logbook:

```sql
create table if not exists logbook_entries (
  id text primary key,
  pilot_id text not null,
  date timestamptz not null,
  aircraft text not null,
  sortie_type text not null,
  duration numeric not null,
  day_night text not null check (day_night in ('Day', 'Night')),
  ifr boolean not null default false,
  nvg boolean not null default false,
  remarks text not null default ''
);
```

## Arsitektur Folder

- `src/components` : komponen reusable dan layout (Sidebar/Topbar/Table/Modal/Badge/Toast/Timeline)
- `src/pages` : halaman fitur berdasarkan route
- `src/contexts` : state global Context + Reducer + persistence localStorage
- `src/data` : mock data generator realistis
- `src/utils` : helper tanggal, export CSV/PDF
- `src/types` : tipe domain aplikasi

## Route utama

- `/` Dashboard Readiness
- `/logbook` E-Logbook (functional)
- `/orm` ORM Risk Assessment (functional)
- `/training` Training & Currency Tracker (functional)
- `/profile`, `/schedule`, `/weather`, `/notam`, `/duty-rest`, `/safety`, `/incident-workspace`, `/documents`, `/checklist`, `/medical`, `/fatigue`, `/frames`, `/inventory`, `/maintenance`, `/messaging`, `/reports`, `/admin`

## Fitur inti

- Role-based UI (mock login + role switch)
- Global search bar
- Keyboard shortcuts (`Ctrl/Cmd+K`, `Alt+1`, `Alt+2`, `Alt+3`)
- Dark/Light mode
- Audit log lokal untuk aksi create/update
- Export CSV/PDF client-side
- Offline-first dasar via service worker + localStorage persistence
- Mock dataset: profile, logbook (40), schedule (15), NOTAM (10), training (10), incident (10)

## Modul Proposal FRAMES

- Route `/frames` menampilkan blueprint pengembangan modul **FRAMES (Fatigue Risk Assessment with Medical adviceS)**.
- Kontennya memuat usulan fitur, manfaat, cara kerja singkat, target pengguna, dan tahapan implementasi untuk penguatan manajemen fatigue awak pesawat.
