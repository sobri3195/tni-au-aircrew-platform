import { Badge } from '../components/ui/Badge';

type FramesFeature = {
  name: string;
  fungsi: string;
  manfaat: string;
  caraKerja: string;
  target: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'slate';
};

const framesCoreFunctions = [
  'Deteksi dini fatigue melalui kombinasi input subjektif, parameter operasional, dan histori tidur.',
  'Penilaian risiko kelelahan berbasis kategori rendah, sedang, dan tinggi untuk mendukung keputusan fit-to-fly.',
  'Pemberian saran medis yang praktis, terdokumentasi, dan dapat ditindaklanjuti oleh awak maupun petugas kesehatan.'
];

const kpiCards = [
  {
    label: 'Fatigue harian',
    value: '3 kali/hari',
    note: 'Check-in sebelum terbang, pasca misi, dan sebelum istirahat malam.'
  },
  {
    label: 'Kategori risiko',
    value: 'Rendah • Sedang • Tinggi',
    note: 'Menyederhanakan pengambilan keputusan operasional dan eskalasi medis.'
  },
  {
    label: 'Sumber data',
    value: 'Kuesioner + jadwal terbang',
    note: 'Menggabungkan self-report dengan duty hours, sektor, dan pola kerja.'
  },
  {
    label: 'Laporan otomatis',
    value: '< 2 menit',
    note: 'Ringkasan hasil asesmen individual dan unit siap dibagikan.'
  }
];

const framesFeatures: FramesFeature[] = [
  {
    name: 'Monitoring Tingkat Kelelahan Harian',
    fungsi: 'Merekam kondisi fatigue awak secara harian sebagai instrumen deteksi dini yang mudah diakses.',
    manfaat: 'Membantu awak dan petugas kesehatan melihat perubahan stamina, kualitas tidur, serta potensi penurunan kesiapsiagaan sebelum berdampak pada keselamatan penerbangan.',
    caraKerja: 'Pengguna melakukan check-in singkat beberapa kali sehari dengan skor kantuk, kualitas tidur, beban tugas, dan gejala fisik. Sistem mengubah input menjadi fatigue index harian dan menampilkan status warna hijau-kuning-merah.',
    target: 'Pilot, navigator, kru kabin militer, flight surgeon, dan petugas kesehatan penerbangan.',
    tone: 'blue'
  },
  {
    name: 'Kuesioner Fatigue Berkala',
    fungsi: 'Menyediakan asesmen terstruktur yang diisi berkala untuk menilai faktor kelelahan subjektif maupun operasional.',
    manfaat: 'Meningkatkan konsistensi pemantauan, menghasilkan data longitudinal, dan memudahkan validasi kondisi awak dari waktu ke waktu.',
    caraKerja: 'Aplikasi menjadwalkan kuesioner mingguan, pra-terbang, dan pasca-terbang. Pertanyaan meliputi durasi tidur, rasa kantuk, stres, konsumsi kafein, hidrasi, serta gejala yang memerlukan perhatian medis.',
    target: 'Seluruh awak pesawat dan personel yang terlibat dalam operasi penerbangan.',
    tone: 'slate'
  },
  {
    name: 'Notifikasi dan Peringatan Dini Risiko Tinggi',
    fungsi: 'Memberikan alert otomatis saat indikator fatigue melewati ambang aman atau menunjukkan tren memburuk.',
    manfaat: 'Mempercepat intervensi sebelum terjadi penurunan performa, error operasional, atau pelanggaran batas duty-rest.',
    caraKerja: 'Mesin aturan memadukan hasil kuesioner, hutang tidur, durasi kerja, shift malam, dan histori misi. Bila skor risiko tinggi, sistem mengirim notifikasi ke pengguna, petugas kesehatan, dan administrator sesuai otoritas akses.',
    target: 'Awak pesawat, dokter penerbangan, petugas operasi, dan administrator satuan.',
    tone: 'red'
  },
  {
    name: 'Rekomendasi Istirahat, Tidur, Hidrasi, dan Tindak Lanjut Medis',
    fungsi: 'Menyajikan saran medis dan pemulihan yang spesifik sesuai tingkat risiko fatigue pengguna.',
    manfaat: 'Membantu awak mengambil langkah pemulihan yang tepat, seragam, dan terdokumentasi, sekaligus memperkuat peran tenaga kesehatan dalam tindak lanjut klinis.',
    caraKerja: 'Setelah skor dihitung, FRAMES menampilkan rekomendasi otomatis seperti durasi istirahat minimum, target tidur, kebutuhan hidrasi, pembatasan terbang sementara, hingga rujukan konsultasi medis jika ditemukan gejala berat.',
    target: 'Awak pesawat, dokter penerbangan, paramedis, dan komandan unsur.',
    tone: 'green'
  },
  {
    name: 'Riwayat Hasil Asesmen Pengguna',
    fungsi: 'Menyimpan histori seluruh hasil penilaian fatigue untuk setiap pengguna secara kronologis.',
    manfaat: 'Memudahkan evaluasi individual, audit medis, serta identifikasi pola kelelahan berulang yang memerlukan penyesuaian jadwal atau evaluasi kesehatan lebih lanjut.',
    caraKerja: 'Setiap asesmen tersimpan otomatis dengan tanggal, skor, kategori risiko, faktor pemicu, dan rekomendasi yang diberikan. Data dapat difilter berdasarkan periode, jenis misi, atau episode fatigue tertentu.',
    target: 'Awak pesawat, petugas kesehatan, administrator, dan pimpinan yang berwenang.',
    tone: 'slate'
  },
  {
    name: 'Dashboard Pemantauan untuk Petugas Kesehatan dan Administrator',
    fungsi: 'Menyediakan tampilan ringkas untuk memonitor kondisi fatigue individu maupun populasi dalam satu dashboard komando.',
    manfaat: 'Mempercepat pengambilan keputusan pada tingkat unit, memudahkan prioritisasi intervensi, dan meningkatkan visibilitas risiko sebelum penyusunan roster atau sortie berikutnya.',
    caraKerja: 'Dashboard menampilkan daftar personel berisiko, kepatuhan pengisian kuesioner, peta warna risiko, status tindak lanjut medis, serta ringkasan unit yang dapat diakses berdasarkan role.',
    target: 'Dokter penerbangan, petugas kesehatan, operator administrasi, dan pimpinan satuan.',
    tone: 'blue'
  },
  {
    name: 'Integrasi Jadwal Terbang dan Durasi Kerja',
    fungsi: 'Menghubungkan penilaian fatigue dengan jadwal terbang, duty period, waktu standby, dan waktu kerja kumulatif.',
    manfaat: 'Menciptakan penilaian yang lebih objektif dan aplikatif karena mempertimbangkan beban operasional nyata yang dialami awak.',
    caraKerja: 'FRAMES menarik data dari modul schedule planner, logbook, dan duty-rest tracker untuk menghitung duty time, rotasi shift, sektor malam, serta jeda istirahat. Data tersebut menjadi faktor pembobot otomatis pada skor risiko fatigue.',
    target: 'Awak pesawat, petugas operasi, scheduler, dan administrator sistem.',
    tone: 'yellow'
  },
  {
    name: 'Analisis Tren Fatigue Individu maupun Kelompok',
    fungsi: 'Menganalisis kecenderungan fatigue dari waktu ke waktu pada tingkat personel, flight, skuadron, atau kelompok misi.',
    manfaat: 'Memberikan dasar evidence-based untuk perbaikan pola kerja, penyusunan roster, intervensi kesehatan, dan evaluasi kebijakan manajemen fatigue.',
    caraKerja: 'Sistem mengolah histori asesmen menjadi grafik tren mingguan dan bulanan, membandingkan antarindividu maupun antarunit, lalu menyoroti peningkatan risiko, recovery yang lambat, dan periode operasional paling rentan.',
    target: 'Dokter penerbangan, komandan satuan, petugas keselamatan, dan perencana operasi.',
    tone: 'blue'
  },
  {
    name: 'Kategori Risiko Fatigue Rendah, Sedang, dan Tinggi',
    fungsi: 'Mengelompokkan hasil penilaian kelelahan ke dalam kategori risiko yang mudah dipahami dan ditindaklanjuti.',
    manfaat: 'Mempermudah komunikasi lintas fungsi, standarisasi keputusan, serta penentuan ambang intervensi medis dan operasional.',
    caraKerja: 'Algoritma FRAMES mengonversi skor asesmen menjadi kategori rendah, sedang, atau tinggi. Setiap kategori dikaitkan dengan protokol tindak lanjut, misalnya self-management, supervisi tambahan, atau evaluasi medis segera.',
    target: 'Seluruh pengguna aplikasi, khususnya awak, tenaga kesehatan, dan unsur komando.',
    tone: 'yellow'
  },
  {
    name: 'Laporan Otomatis yang Mudah Dipahami',
    fungsi: 'Menghasilkan laporan fatigue individual dan kelompok secara otomatis dalam format ringkas dan komunikatif.',
    manfaat: 'Mengurangi beban administrasi, mempercepat briefing, serta menyediakan dokumentasi yang siap digunakan untuk rapat keselamatan, evaluasi medis, dan pelaporan komando.',
    caraKerja: 'Setelah periode tertentu, sistem merangkum skor, kategori risiko, tren, kepatuhan pengisian, dan rekomendasi tindak lanjut ke dalam laporan visual yang dapat diekspor ke PDF atau dibaca langsung dari dashboard.',
    target: 'Petugas kesehatan, administrator, komandan, dan unsur perencanaan operasi.',
    tone: 'green'
  }
];

const rolloutStages = [
  {
    title: 'Tahap 1 — Deteksi Dini',
    detail: 'Aktifkan monitoring harian, kuesioner berkala, dan kategori risiko agar fungsi inti fatigue screening tetap menjadi fondasi utama modul.'
  },
  {
    title: 'Tahap 2 — Integrasi Operasional',
    detail: 'Hubungkan skor fatigue dengan jadwal terbang, duty-rest, dan histori misi untuk memperkuat akurasi penilaian risiko kelelahan.'
  },
  {
    title: 'Tahap 3 — Dukungan Keputusan Medis',
    detail: 'Tambahkan rekomendasi medis otomatis, dashboard pemantauan, tren kelompok, dan laporan manajerial yang mudah dipahami.'
  }
];

export const FramesPage = () => {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-950 via-cyan-900 to-emerald-900 text-white shadow-xl shadow-sky-950/20">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr,0.75fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label="FRAMES Module" tone="blue" />
              <Badge label="Fatigue Risk Assessment with Medical adviceS" tone="green" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Usulan Modul FRAMES untuk Aircrew TNI AU</h1>
              <p className="max-w-3xl text-sm leading-7 text-sky-50/90 lg:text-base">
                Modul FRAMES dirancang sebagai penyempurnaan modern dan aplikatif untuk mempertahankan fungsi utama aplikasi sebagai alat deteksi dini fatigue,
                penilaian risiko kelelahan, dan pemberian saran medis. Fokus pengembangannya adalah menghadirkan pemantauan berkelanjutan, integrasi operasional,
                serta dukungan keputusan yang lebih kuat bagi awak pesawat maupun petugas kesehatan penerbangan.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {framesCoreFunctions.map((item) => (
                <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm leading-6 text-sky-50/90">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {kpiCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/15 bg-slate-950/25 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">{card.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-sky-50/85">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {framesFeatures.map((feature) => (
          <article key={feature.name} className="card space-y-4 rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nama fitur</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{feature.name}</h2>
              </div>
              <Badge label={feature.tone === 'red' ? 'Prioritas Tinggi' : feature.tone === 'yellow' ? 'Prioritas Menengah' : 'Prioritas Strategis'} tone={feature.tone} />
            </div>
            <dl className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fungsi utama</dt>
                <dd className="mt-1">{feature.fungsi}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Manfaat</dt>
                <dd className="mt-1">{feature.manfaat}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cara kerja singkat</dt>
                <dd className="mt-1">{feature.caraKerja}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target pengguna</dt>
                <dd className="mt-1">{feature.target}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr,0.95fr]">
        <article className="card rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Arah Implementasi</p>
              <h2 className="mt-1 text-2xl font-semibold">Tahapan Pengembangan FRAMES</h2>
            </div>
            <Badge label="Roadmap Bertahap" tone="blue" />
          </div>
          <div className="space-y-4">
            {rolloutStages.map((stage) => (
              <div key={stage.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{stage.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{stage.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nilai Tambah</p>
              <h2 className="mt-1 text-2xl font-semibold">Dampak yang Diharapkan</h2>
            </div>
            <Badge label="Proposal Pengembangan" tone="green" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Meningkatkan keselamatan terbang melalui deteksi kelelahan yang lebih cepat dan terdokumentasi.',
              'Membantu penyesuaian roster, duty period, dan penjadwalan sortie berbasis data fatigue aktual.',
              'Memperkuat koordinasi antara awak, petugas kesehatan, safety officer, dan unsur komando.',
              'Menyediakan laporan yang mudah dipahami untuk briefing kesehatan penerbangan dan evaluasi periodik.'
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Dengan struktur ini, FRAMES tidak hanya menjadi alat skrining fatigue, tetapi juga platform pengambilan keputusan kesehatan penerbangan yang modern,
            terukur, dan siap diintegrasikan ke alur operasi awak pesawat terbang.
          </div>
        </article>
      </section>
    </div>
  );
};
