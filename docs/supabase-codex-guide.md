# Tutorial Integrasi Supabase + Codex untuk TNI AU Aircrew Platform

Dokumen ini dibuat berdasarkan analisis codebase saat ini:
- Aplikasi **frontend-only** React + Vite + TypeScript.
- State global disimpan di `AppContext` dan dipersist ke `localStorage`.
- Belum ada backend/API server.

## 1) Ringkasan arsitektur saat ini (hasil analisis)

1. Persistence data sekarang memakai browser storage melalui helper:
   - `readJsonStorage` / `writeJsonStorage` di `src/utils/storage.ts`.
2. Kunci state app saat ini disimpan pada key:
   - `tni-au-aircrew-state` di `src/contexts/AppContext.tsx`.
3. Semua aksi data (`ADD_LOGBOOK`, `ADD_SCHEDULE`, dll.) di-handle reducer `AppContext`.

Dampak untuk integrasi Supabase:
- Kita bisa mulai dengan pola **hybrid**: localStorage tetap jalan (offline-first), lalu sinkronisasi ke Supabase bertahap.

## 2) Langkah dari nol: buat akun sampai dapat kredensial

### 2.1 Buat akun Supabase

1. Buka `https://supabase.com/`.
2. Klik **Start your project** lalu login (GitHub/Google/Email).
3. Jika diminta, buat **organization** baru.

### 2.2 Buat project baru

1. Klik **New project**.
2. Pilih organization.
3. Isi:
   - **Name**: misal `tni-au-aircrew-platform`
   - **Database Password**: buat password kuat (simpan di password manager)
   - **Region**: pilih yang paling dekat user utama (mis. Singapore untuk Indonesia)
4. Klik **Create new project** dan tunggu provisioning selesai.

### 2.3 Ambil API credentials

1. Masuk ke project dashboard.
2. Buka **Project Settings** → **API**.
3. Salin nilai berikut:
   - `Project URL`
   - `anon public key` (label `anon` / `publishable`)

> Jangan gunakan `service_role` key di frontend.

### 2.4 Simpan ke `.env` aplikasi

Di root repo, buat file `.env`:

```bash
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
```

## 2.5 Connection string database (copy dari Supabase)

Jika kamu perlu akses langsung ke Postgres (misalnya via psql, migration tool, atau SQL client), gunakan format berikut:

- host: `db.ghymynufjfazifhqitqy.supabase.co`
- port: `5432`
- database: `postgres`
- user: `postgres`

```bash
postgresql://postgres:[YOUR-PASSWORD]@db.ghymynufjfazifhqitqy.supabase.co:5432/postgres
```

> Ganti `[YOUR-PASSWORD]` dengan database password project Supabase kamu.

## 2.6 Install Agent Skills (opsional)

Agar AI coding agent (mis. Codex) lebih akurat saat bekerja dengan Supabase, kamu bisa install Supabase Agent Skills:

```bash
npx skills add supabase/agent-skills
```

## 3) Instal dependency

```bash
npm install @supabase/supabase-js
```

## 4) Buat Supabase client

File: `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env belum lengkap. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 5) Setup database awal (langsung dari dashboard)

### Opsi A — lewat SQL Editor (paling cepat)

1. Di Supabase dashboard, buka **SQL Editor**.
2. Klik **New query**.
3. Paste SQL berikut lalu jalankan:

```sql
create table if not exists logbook_entries (
  id text primary key,
  pilot text not null,
  aircraft text not null,
  mission_type text not null,
  duration_minutes int not null,
  date date not null,
  created_at timestamptz default now()
);
```

### Opsi B — lewat Table Editor

1. Buka **Table Editor** → **Create a new table**.
2. Isi nama tabel `logbook_entries`.
3. Tambahkan kolom sesuai kebutuhan aplikasi.

## 6) Strategi migrasi bertahap (disarankan)

### Tahap A — Read-only dari Supabase (aman)
- Mulai dari modul kecil (misal `logbook`) untuk membaca data dari Supabase saat halaman dibuka.
- Jika query gagal/offline, fallback ke data local state.

### Tahap B — Write-through
- Saat user melakukan `ADD_LOGBOOK`, simpan ke local state **dan** kirim insert ke Supabase.
- Tampilkan toast jika sync gagal dan tandai item `pendingSync`.

### Tahap C — Full source of truth
- Setelah stabil, jadikan Supabase sebagai sumber utama.
- localStorage dipakai sebagai cache/offline snapshot.

## 7) Contoh tabel awal (SQL)

```sql
create table if not exists logbook_entries (
  id text primary key,
  pilot text not null,
  aircraft text not null,
  mission_type text not null,
  duration_minutes int not null,
  date date not null,
  created_at timestamptz default now()
);
```

Tambahkan juga tabel generic agar semua modul berbasis `GenericFeaturePage` bisa CRUD:

```sql
create table if not exists module_records (
  id text primary key,
  module_path text not null,
  status text not null default 'Open',
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_module_records_module_path on module_records(module_path);

create table if not exists module_tasks (
  id text primary key,
  module_path text not null,
  text text not null,
  done boolean not null default false,
  owner text not null default 'Ops Officer',
  updated_at timestamptz not null default now()
);

create index if not exists idx_module_tasks_module_path on module_tasks(module_path);
```

> Sesuaikan kolom dengan interface TypeScript di project (`LogbookEntry`, `ModuleRecord`, dan `ChecklistItem`).

## 8) Contoh query di kode React

```ts
import { supabase } from '../lib/supabase';

export const fetchLogbook = async () => {
  const { data, error } = await supabase
    .from('logbook_entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};
```

## 9) Prompt Codex yang bisa dipakai langsung

Gunakan prompt berikut di Codex agar perubahan rapi dan incremental:

### Prompt 1 — Setup dasar

> Analisa repo ini (React + Vite + TS). Tambahkan integrasi Supabase minimal tanpa merusak fitur existing. Buat file `src/lib/supabase.ts`, pasang env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, dan update README bagian setup. Jangan ubah behavior existing selain inisialisasi client.

### Prompt 2 — Migrasi logbook

> Refactor modul logbook agar read data dari Supabase (`logbook_entries`) dengan fallback localStorage jika offline/error. Pertahankan tampilan UI. Tambahkan helper sync status sederhana (`synced`/`pending`) di state lokal.

### Prompt 3 — RLS security

> Buat SQL migration untuk aktifkan RLS pada `logbook_entries`, policy: user hanya bisa baca/tulis data miliknya (`auth.uid() = user_id`). Tambahkan kolom `user_id uuid not null` dan index terkait.

## 10) Checklist verifikasi

1. `npm run dev` jalan.
2. Env Supabase terbaca (tidak throw error init).
3. Query test berhasil (data tampil).
4. Jika internet dimatikan, app tetap bisa dibuka (fallback localStorage).
5. Tidak ada key sensitif (service role) di frontend.

## 11) Catatan keamanan penting

- Pastikan semua tabel publik yang diakses frontend mengaktifkan **Row Level Security (RLS)**.
- Jangan andalkan anon key sebagai proteksi data; proteksi utama adalah RLS policy.
- Untuk operasi admin/privileged, gunakan backend server terpisah (Edge Function/API) dengan service role key.
