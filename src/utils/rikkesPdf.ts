import type { RikkesRecord } from '../types/rikkes';

const escapePdfText = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

const formatDate = (value: string) => new Date(value).toLocaleDateString('id-ID');

const buildReportLines = (record: RikkesRecord): string[] => {
  return [
    'LAPORAN PEMERIKSAAN KESEHATAN (RIKKES)',
    '',
    `Tanggal Pemeriksaan: ${formatDate(record.tanggalPemeriksaan)}`,
    `Dokter Pemeriksa: ${record.dokterPemeriksa}`,
    `Tempat Pemeriksaan: ${record.tempatPemeriksaan}`,
    '',
    'IDENTITAS PESERTA',
    `NRP: ${record.identitas.nrp}`,
    `Nama: ${record.identitas.nama}`,
    `Pangkat/Korps: ${record.identitas.pangkat} / ${record.identitas.korps}`,
    `Satuan: ${record.identitas.satuan}`,
    `Usia: ${record.identitas.umur} tahun`,
    `Golongan Darah: ${record.identitas.golDarah} ${record.identitas.rhesus}`,
    '',
    'TANDA VITAL',
    `Tinggi/Berat: ${record.tandaVital.tinggiBadan} cm / ${record.tandaVital.beratBadan} kg`,
    `BMI: ${record.tandaVital.bmi}`,
    `Tekanan Darah: ${record.tandaVital.tekananDarahSistolik}/${record.tandaVital.tekananDarahDiastolik} mmHg`,
    '',
    'HASIL RIKKES',
    `Kategori Kesehatan: ${record.kategoriKesehatan}`,
    `Status Kelaikan: ${record.status}`,
    `Masa Berlaku: ${formatDate(record.masaBerlaku)}`,
    '',
    'KESIMPULAN',
    record.kesimpulan || '-',
    '',
    'SARAN',
    record.saran || '-',
    '',
    'PEMBATASAN',
    record.pembatasan || '-'
  ];
};

export const buildRikkesPdfBlob = (record: RikkesRecord): Blob => {
  const lines = buildReportLines(record);

  const streamLines = ['BT', '/F1 11 Tf', '50 800 Td'];
  lines.forEach((line, index) => {
    if (index > 0) {
      streamLines.push('0 -18 Td');
    }
    streamLines.push(`(${escapePdfText(line)}) Tj`);
  });
  streamLines.push('ET');

  const contentStream = streamLines.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach(object => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach(offset => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

export const buildRikkesPdfFileName = (record: RikkesRecord) => {
  const safeName = record.identitas.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `rikkes-${record.identitas.nrp}-${safeName || 'personel'}.pdf`;
};
