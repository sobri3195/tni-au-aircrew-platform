# Modul FRAMES (Fatigue Risk Assessment with Medical adviceS)

Modul **FRAMES** diusulkan sebagai pengembangan lanjutan aplikasi kesehatan penerbangan untuk awak pesawat TNI AU. Modul ini tetap mempertahankan fungsi utama aplikasi sebagai alat **deteksi dini fatigue**, **penilaian risiko kelelahan**, dan **pemberian saran medis**, namun diperluas agar lebih lengkap, modern, dan aplikatif.

## Ruang Lingkup Utama

1. Deteksi dini fatigue melalui check-in harian dan kuesioner berkala.
2. Penilaian risiko kelelahan berbasis data subjektif dan operasional.
3. Rekomendasi medis otomatis yang mudah dipahami dan dapat ditindaklanjuti.
4. Pemantauan individual maupun kelompok melalui dashboard dan laporan otomatis.

## Usulan Fitur

### 1. Monitoring Tingkat Kelelahan Harian
- **Fungsi utama:** Merekam kondisi fatigue awak secara harian sebagai instrumen deteksi dini yang mudah diakses.
- **Manfaat:** Membantu awak dan petugas kesehatan melihat perubahan stamina, kualitas tidur, serta potensi penurunan kesiapsiagaan sebelum berdampak pada keselamatan penerbangan.
- **Cara kerja singkat:** Pengguna melakukan check-in singkat beberapa kali sehari dengan skor kantuk, kualitas tidur, beban tugas, dan gejala fisik. Sistem mengubah input menjadi fatigue index harian dan menampilkan status warna hijau-kuning-merah.
- **Target pengguna:** Pilot, navigator, kru kabin militer, flight surgeon, dan petugas kesehatan penerbangan.

### 2. Kuesioner Fatigue Berkala
- **Fungsi utama:** Menyediakan asesmen terstruktur yang diisi berkala untuk menilai faktor kelelahan subjektif maupun operasional.
- **Manfaat:** Meningkatkan konsistensi pemantauan, menghasilkan data longitudinal, dan memudahkan validasi kondisi awak dari waktu ke waktu.
- **Cara kerja singkat:** Aplikasi menjadwalkan kuesioner mingguan, pra-terbang, dan pasca-terbang. Pertanyaan meliputi durasi tidur, rasa kantuk, stres, konsumsi kafein, hidrasi, serta gejala yang memerlukan perhatian medis.
- **Target pengguna:** Seluruh awak pesawat dan personel yang terlibat dalam operasi penerbangan.

### 3. Notifikasi dan Peringatan Dini Risiko Tinggi
- **Fungsi utama:** Memberikan alert otomatis saat indikator fatigue melewati ambang aman atau menunjukkan tren memburuk.
- **Manfaat:** Mempercepat intervensi sebelum terjadi penurunan performa, error operasional, atau pelanggaran batas duty-rest.
- **Cara kerja singkat:** Mesin aturan memadukan hasil kuesioner, hutang tidur, durasi kerja, shift malam, dan histori misi. Bila skor risiko tinggi, sistem mengirim notifikasi ke pengguna, petugas kesehatan, dan administrator sesuai otoritas akses.
- **Target pengguna:** Awak pesawat, dokter penerbangan, petugas operasi, dan administrator satuan.

### 4. Rekomendasi Istirahat, Tidur, Hidrasi, dan Tindak Lanjut Medis
- **Fungsi utama:** Menyajikan saran medis dan pemulihan yang spesifik sesuai tingkat risiko fatigue pengguna.
- **Manfaat:** Membantu awak mengambil langkah pemulihan yang tepat, seragam, dan terdokumentasi, sekaligus memperkuat peran tenaga kesehatan dalam tindak lanjut klinis.
- **Cara kerja singkat:** Setelah skor dihitung, FRAMES menampilkan rekomendasi otomatis seperti durasi istirahat minimum, target tidur, kebutuhan hidrasi, pembatasan terbang sementara, hingga rujukan konsultasi medis jika ditemukan gejala berat.
- **Target pengguna:** Awak pesawat, dokter penerbangan, paramedis, dan komandan unsur.

### 5. Riwayat Hasil Asesmen Pengguna
- **Fungsi utama:** Menyimpan histori seluruh hasil penilaian fatigue untuk setiap pengguna secara kronologis.
- **Manfaat:** Memudahkan evaluasi individual, audit medis, serta identifikasi pola kelelahan berulang yang memerlukan penyesuaian jadwal atau evaluasi kesehatan lebih lanjut.
- **Cara kerja singkat:** Setiap asesmen tersimpan otomatis dengan tanggal, skor, kategori risiko, faktor pemicu, dan rekomendasi yang diberikan. Data dapat difilter berdasarkan periode, jenis misi, atau episode fatigue tertentu.
- **Target pengguna:** Awak pesawat, petugas kesehatan, administrator, dan pimpinan yang berwenang.

### 6. Dashboard Pemantauan untuk Petugas Kesehatan dan Administrator
- **Fungsi utama:** Menyediakan tampilan ringkas untuk memonitor kondisi fatigue individu maupun populasi dalam satu dashboard komando.
- **Manfaat:** Mempercepat pengambilan keputusan pada tingkat unit, memudahkan prioritisasi intervensi, dan meningkatkan visibilitas risiko sebelum penyusunan roster atau sortie berikutnya.
- **Cara kerja singkat:** Dashboard menampilkan daftar personel berisiko, kepatuhan pengisian kuesioner, peta warna risiko, status tindak lanjut medis, serta ringkasan unit yang dapat diakses berdasarkan role.
- **Target pengguna:** Dokter penerbangan, petugas kesehatan, operator administrasi, dan pimpinan satuan.

### 7. Integrasi Jadwal Terbang dan Durasi Kerja
- **Fungsi utama:** Menghubungkan penilaian fatigue dengan jadwal terbang, duty period, waktu standby, dan waktu kerja kumulatif.
- **Manfaat:** Menciptakan penilaian yang lebih objektif dan aplikatif karena mempertimbangkan beban operasional nyata yang dialami awak.
- **Cara kerja singkat:** FRAMES menarik data dari modul schedule planner, logbook, dan duty-rest tracker untuk menghitung duty time, rotasi shift, sektor malam, serta jeda istirahat. Data tersebut menjadi faktor pembobot otomatis pada skor risiko fatigue.
- **Target pengguna:** Awak pesawat, petugas operasi, scheduler, dan administrator sistem.

### 8. Analisis Tren Fatigue Individu maupun Kelompok
- **Fungsi utama:** Menganalisis kecenderungan fatigue dari waktu ke waktu pada tingkat personel, flight, skuadron, atau kelompok misi.
- **Manfaat:** Memberikan dasar evidence-based untuk perbaikan pola kerja, penyusunan roster, intervensi kesehatan, dan evaluasi kebijakan manajemen fatigue.
- **Cara kerja singkat:** Sistem mengolah histori asesmen menjadi grafik tren mingguan dan bulanan, membandingkan antarindividu maupun antarunit, lalu menyoroti peningkatan risiko, recovery yang lambat, dan periode operasional paling rentan.
- **Target pengguna:** Dokter penerbangan, komandan satuan, petugas keselamatan, dan perencana operasi.

### 9. Kategori Risiko Fatigue Rendah, Sedang, dan Tinggi
- **Fungsi utama:** Mengelompokkan hasil penilaian kelelahan ke dalam kategori risiko yang mudah dipahami dan ditindaklanjuti.
- **Manfaat:** Mempermudah komunikasi lintas fungsi, standarisasi keputusan, serta penentuan ambang intervensi medis dan operasional.
- **Cara kerja singkat:** Algoritma FRAMES mengonversi skor asesmen menjadi kategori rendah, sedang, atau tinggi. Setiap kategori dikaitkan dengan protokol tindak lanjut, misalnya self-management, supervisi tambahan, atau evaluasi medis segera.
- **Target pengguna:** Seluruh pengguna aplikasi, khususnya awak, tenaga kesehatan, dan unsur komando.

### 10. Laporan Otomatis yang Mudah Dipahami
- **Fungsi utama:** Menghasilkan laporan fatigue individual dan kelompok secara otomatis dalam format ringkas dan komunikatif.
- **Manfaat:** Mengurangi beban administrasi, mempercepat briefing, serta menyediakan dokumentasi yang siap digunakan untuk rapat keselamatan, evaluasi medis, dan pelaporan komando.
- **Cara kerja singkat:** Setelah periode tertentu, sistem merangkum skor, kategori risiko, tren, kepatuhan pengisian, dan rekomendasi tindak lanjut ke dalam laporan visual yang dapat diekspor ke PDF atau dibaca langsung dari dashboard.
- **Target pengguna:** Petugas kesehatan, administrator, komandan, dan unsur perencanaan operasi.

## Nilai Pengembangan

- Mendukung keselamatan terbang melalui deteksi dini kelelahan yang lebih cepat dan terdokumentasi.
- Menyediakan dasar pengambilan keputusan medis dan operasional berbasis data fatigue aktual.
- Mendorong integrasi antara awak, petugas kesehatan, scheduler, safety officer, dan unsur komando.
- Menghasilkan laporan dan dashboard yang siap digunakan untuk briefing maupun evaluasi berkala.
