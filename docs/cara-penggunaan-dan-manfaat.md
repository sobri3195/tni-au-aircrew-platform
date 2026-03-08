# Cara Penggunaan dan Manfaat Aplikasi

Dokumen ini menjelaskan langkah singkat penggunaan aplikasi **TNI AU Aircrew SPA** serta manfaat utamanya bagi pengguna.

## Cara Penggunaan

### 1. Menjalankan aplikasi
1. Buka terminal pada folder proyek.
2. Install dependensi:
   ```bash
   npm install
   ```
3. Jalankan aplikasi development:
   ```bash
   npm run dev
   ```
4. Buka URL lokal yang ditampilkan di terminal (umumnya `http://localhost:5173`).

### 2. Login dan navigasi
1. Masuk melalui halaman login (mock login).
2. Pilih peran (role) sesuai kebutuhan operasional.
3. Gunakan sidebar untuk berpindah antar modul seperti Dashboard, Logbook, ORM, Training, Medical, Reports, dan Admin.

### 3. Mengelola data harian
1. Tambah, ubah, atau hapus data di modul yang tersedia.
2. Perubahan akan tersimpan otomatis di browser melalui **Local Storage**.
3. Gunakan fitur pencarian global dan shortcut keyboard untuk akses cepat.

### 4. Ekspor dan pelaporan
1. Buka modul yang mendukung pelaporan.
2. Gunakan fitur ekspor untuk menghasilkan file CSV/PDF.
3. Pakai data ekspor untuk kebutuhan briefing, evaluasi, atau dokumentasi internal.

## Manfaat Aplikasi

- **Meningkatkan efisiensi kerja**: input dan pembaruan data dapat dilakukan langsung tanpa menunggu integrasi backend.
- **Akses cepat informasi kesiapan**: dashboard dan modul operasional memudahkan pemantauan kondisi personel.
- **Mendukung pengambilan keputusan**: data ORM, training, dan medical membantu evaluasi risiko serta readiness.
- **Produktif dalam kondisi terbatas koneksi**: pendekatan frontend-only dan penyimpanan lokal mendukung penggunaan dasar secara offline.
- **Memudahkan dokumentasi**: fitur ekspor mempercepat pembuatan laporan rutin.

## Catatan penting

- Data tersimpan di Local Storage browser perangkat yang digunakan.
- Jika cache/Local Storage dibersihkan, data lokal dapat hilang.
- Untuk penggunaan tim/skala besar, disarankan integrasi backend dan manajemen akun terpusat.
