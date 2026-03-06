export type KategoriKesehatan = 'A' | 'B' | 'C' | 'D' | 'E';
export type StatusRikkes = 'Fit' | 'Fit with Restriction' | 'Temporarily Unfit' | 'Permanently Unfit';
export type GolonganDarah = 'A' | 'B' | 'AB' | 'O';
export type Rhesus = 'Positif' | 'Negatif';

export interface IdentitasPeserta {
  nrp: string;
  nama: string;
  pangkat: string;
  korps: string;
  satuan: string;
  tglLahir: string;
  umur: number;
  golDarah: GolonganDarah;
  rhesus: Rhesus;
}

export interface Anamnesis {
  keluhanUtama: string;
  riwayatPenyakitDahulu: string;
  riwayatPenyakitKeluarga: string;
  riwayatAlergi: string;
  riwayatOperasi: string;
  kebiasaanMerokok: boolean;
  jumlahRokokPerHari: number;
  kebiasaanMinumAlkohol: boolean;
  olahragaTeratur: boolean;
}

export interface TandaVital {
  tinggiBadan: number;
  beratBadan: number;
  bmi: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  nadi: number;
  respirasi: number;
  suhu: number;
  spo2: number;
}

export interface PemeriksaanFisik {
  kepala: string;
  leher: string;
  thorax: string;
  abdomen: string;
  ekstremitasAtas: string;
  ekstremitasBawah: string;
  kulit: string;
  neurologi: string;
}

export interface Laboratorium {
  hemoglobin: number;
  leukosit: number;
  hematokrit: number;
  trombosit: number;
  glukosaPuasa: number;
  glukosa2JPP: number;
  kolesterolTotal: number;
  kolesterolHDL: number;
  kolesterolLDL: number;
  trigliserida: number;
  asamUrat: number;
  ureum: number;
  kreatinin: number;
  sgot: number;
  sgpt: number;
  hbsAg: 'Negatif' | 'Positif';
  hiv: 'Negatif' | 'Positif';
  urinalisaWarna: string;
  urinalisaBeratJenis: number;
  urinalisaPH: number;
  urinalisaGlukosa: string;
  urinalisaProtein: string;
  urinalisaEritrosit: string;
  urinalisaLeukosit: string;
}

export interface Radiologi {
  thoraxPa: string;
  tulangBelakang: string;
  ekstremitas: string;
  hasilFoto: string;
}

export interface PemeriksaanMata {
  visusKananTanpaKacamata: string;
  visusKiriTanpaKacamata: string;
  visusKananDenganKacamata: string;
  visusKiriDenganKacamata: string;
  butaWarna: 'Normal' | 'Parsial' | 'Total';
  refaksiKanan: string;
  refaksiKiri: string;
  tekananBolaMataKanan: number;
  tekananBolaMataKiri: number;
  lapangPandangKanan: string;
  lapangPandangKiri: string;
  funduskopiKanan: string;
  funduskopiKiri: string;
}

export interface PemeriksaanTht {
  telingaKanan: string;
  telingaKiri: string;
  hidung: string;
  tenggorokan: string;
  tonsil: string;
  fonetik: string;
  audiometriKanan: string;
  audiometriKiri: string;
}

export interface PemeriksaanGigi {
  caries: number;
  missing: number;
  filling: number;
  statusDmf: string;
  gingivitis: boolean;
  periodontitis: boolean;
  maloklusi: string;
  sisaAkar: number;
  kalkulus: boolean;
}

export interface PemeriksaanJiwa {
  penampilan: string;
  kesadaran: string;
  mood: string;
  afek: string;
  prosesPikir: string;
  gangguanPersepsi: string;
  memori: string;
  konsentrasi: string;
  insight: string;
  hasilTestKepribadian: string;
  hasilTestIntelegensi: string;
}

export interface RikkesRecord {
  id: string;
  pilotId: string;
  tanggalPemeriksaan: string;
  dokterPemeriksa: string;
  tempatPemeriksaan: string;
  identitas: IdentitasPeserta;
  anamnesis: Anamnesis;
  tandaVital: TandaVital;
  fisik: PemeriksaanFisik;
  laboratorium: Laboratorium;
  radiologi: Radiologi;
  mata: PemeriksaanMata;
  tht: PemeriksaanTht;
  gigi: PemeriksaanGigi;
  jiwa: PemeriksaanJiwa;
  kesimpulan: string;
  saran: string;
  kategoriKesehatan: KategoriKesehatan;
  status: StatusRikkes;
  masaBerlaku: string;
  pembatasan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RikkesSummary {
  totalPemeriksaan: number;
  kategoriA: number;
  kategoriB: number;
  kategoriC: number;
  kategoriD: number;
  kategoriE: number;
  fitToFly: number;
  fitWithRestriction: number;
  unfit: number;
  expiringSoon: number;
}

export const getKategoriKesehatanLabel = (kategori: KategoriKesehatan): string => {
  const labels: Record<KategoriKesehatan, string> = {
    A: 'Kat A - Sangat Sehat',
    B: 'Kat B - Sehat dengan Catatan',
    C: 'Kat C - Cukup Sehat',
    D: 'Kat D - Tidak Sehat Sementara',
    E: 'Kat E - Tidak Sehat Menetap'
  };
  return labels[kategori];
};

export const getStatusRikkesLabel = (status: StatusRikkes): string => {
  const labels: Record<StatusRikkes, string> = {
    'Fit': 'Fit to Fly',
    'Fit with Restriction': 'Fit with Restriction',
    'Temporarily Unfit': 'Temporarily Unfit',
    'Permanently Unfit': 'Permanently Unfit'
  };
  return labels[status];
};

export const getKategoriColor = (kategori: KategoriKesehatan): string => {
  const colors: Record<KategoriKesehatan, string> = {
    A: 'bg-emerald-500',
    B: 'bg-sky-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    E: 'bg-rose-500'
  };
  return colors[kategori];
};

export const getStatusColor = (status: StatusRikkes): string => {
  const colors: Record<StatusRikkes, string> = {
    'Fit': 'bg-emerald-500',
    'Fit with Restriction': 'bg-amber-500',
    'Temporarily Unfit': 'bg-orange-500',
    'Permanently Unfit': 'bg-rose-500'
  };
  return colors[status];
};
