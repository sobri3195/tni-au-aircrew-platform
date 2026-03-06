import { useMemo, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import type { RikkesRecord, KategoriKesehatan, StatusRikkes } from '../types/rikkes';
import { initialRikkesRecords, calculateRikkesSummary } from '../data/rikkesData';

const STORAGE_KEY = 'aircrew-rikkes-data-v1';

export const RikkesPage = () => {
  const [records] = useLocalStorageState<RikkesRecord[]>(STORAGE_KEY, initialRikkesRecords);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<KategoriKesehatan | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusRikkes | 'all'>('all');

  const summary = useMemo(() => calculateRikkesSummary(records), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.identitas.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.identitas.nrp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.identitas.pangkat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.identitas.satuan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesKategori = filterKategori === 'all' || record.kategoriKesehatan === filterKategori;
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      return matchesSearch && matchesKategori && matchesStatus;
    });
  }, [records, searchQuery, filterKategori, filterStatus]);

  const selectedRecord = useMemo(() => records.find(r => r.id === selectedRecordId), [records, selectedRecordId]);

  const handleView = (recordId: string) => {
    setSelectedRecordId(recordId);
    setActiveTab('detail');
  };

  const kategoriColors: Record<KategoriKesehatan, string> = {
    A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
    B: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200',
    C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
    D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
    E: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200'
  };

  const statusColors: Record<StatusRikkes, string> = {
    'Fit': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
    'Fit with Restriction': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
    'Temporarily Unfit': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
    'Permanently Unfit': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200'
  };

  if (activeTab === 'detail' && selectedRecord) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">←</button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Detail Rikkes</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedRecord.identitas.nrp} • {selectedRecord.identitas.nama}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20">
              <div className="flex flex-wrap items-center gap-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${kategoriColors[selectedRecord.kategoriKesehatan]}`}>Kat {selectedRecord.kategoriKesehatan}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[selectedRecord.status]}`}>{selectedRecord.status === 'Fit' ? 'Fit' : selectedRecord.status.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Berlaku sampai: {new Date(selectedRecord.masaBerlaku).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Identitas Peserta</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-slate-500 dark:text-slate-400">NRP</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.nrp}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Nama</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.nama}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Pangkat</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.pangkat}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Korps</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.korps}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Satuan</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.satuan}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Umur</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.umur} tahun</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Gol Darah</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.identitas.golDarah} {selectedRecord.identitas.rhesus}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Tgl Pemeriksaan</p><p className="font-medium text-slate-900 dark:text-slate-100">{new Date(selectedRecord.tanggalPemeriksaan).toLocaleDateString('id-ID')}</p></div>
                </div>
              </section>
              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Tanda Vital</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-slate-500 dark:text-slate-400">Tinggi Badan</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.tandaVital.tinggiBadan} cm</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Berat Badan</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.tandaVital.beratBadan} kg</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">BMI</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.tandaVital.bmi}</p></div>
                  <div><p className="text-slate-500 dark:text-slate-400">Tekanan Darah</p><p className="font-medium text-slate-900 dark:text-slate-100">{selectedRecord.tandaVital.tekananDarahSistolik}/{selectedRecord.tandaVital.tekananDarahDiastolik} mmHg</p></div>
                </div>
              </section>
              <section className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Kesimpulan</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{selectedRecord.kesimpulan || 'Tidak ada kesimpulan'}</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Saran</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{selectedRecord.saran || 'Tidak ada saran'}</div>
                </div>
              </section>
              {selectedRecord.pembatasan && (
                <section>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">⚠️ Pembatasan</h4>
                    <p className="text-amber-700 dark:text-amber-300 mt-1 text-sm">{selectedRecord.pembatasan}</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Modul Rikkes TNI AU</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Pemeriksaan Kesehatan Berkala Personel TNI Angkatan Udara</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pemeriksaan</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{summary.totalPemeriksaan}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-500 bg-opacity-20 text-sky-500">📄</div>
            </div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Fit to Fly</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{summary.fitToFly}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500 bg-opacity-20 text-emerald-500">✓</div>
            </div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tidak Fit</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{summary.unfit}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500 bg-opacity-20 text-rose-500">✕</div>
            </div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Segera Expired</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{summary.expiringSoon}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500 bg-opacity-20 text-amber-500">📅</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama, NRP, satuan..." className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all pl-10" />
            </div>
          </div>
          <select value={filterKategori} onChange={e => setFilterKategori(e.target.value as KategoriKesehatan | 'all')} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all">
            <option value="all">Semua Kategori</option>
            <option value="A">Kat A - Sangat Sehat</option>
            <option value="B">Kat B - Sehat dengan Catatan</option>
            <option value="C">Kat C - Cukup Sehat</option>
            <option value="D">Kat D - Tidak Sehat Sementara</option>
            <option value="E">Kat E - Tidak Sehat Menetap</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusRikkes | 'all')} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all">
            <option value="all">Semua Status</option>
            <option value="Fit">Fit to Fly</option>
            <option value="Fit with Restriction">Fit with Restriction</option>
            <option value="Temporarily Unfit">Temporarily Unfit</option>
            <option value="Permanently Unfit">Permanently Unfit</option>
          </select>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">⬇️ Export</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Personel</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kategori</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Berlaku</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredRecords.map(record => {
                      const daysUntilExpiry = Math.ceil((new Date(record.masaBerlaku).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">{record.identitas.nama.charAt(0)}</div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{record.identitas.nama}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{record.identitas.nrp} • {record.identitas.pangkat}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${kategoriColors[record.kategoriKesehatan]}`}>Kat {record.kategoriKesehatan}</span></td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[record.status]}`}>{record.status === 'Fit' ? 'Fit' : record.status.replace(/([A-Z])/g, ' $1').trim()}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span className={daysUntilExpiry < 30 ? 'text-amber-600 dark:text-amber-400 font-medium text-sm' : 'text-slate-600 dark:text-slate-400 text-sm'}>
                                {new Date(record.masaBerlaku).toLocaleDateString('id-ID')}
                                {daysUntilExpiry < 30 && <span className="ml-1 text-xs">({daysUntilExpiry} hari)</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleView(record.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-sky-600" title="Lihat detail">👁️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredRecords.length === 0 && <div className="p-8 text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">🔍</div><p className="text-slate-500 dark:text-slate-400">Tidak ada data rikkes yang sesuai</p></div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Distribusi Kategori</h3>
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D', 'E'] as KategoriKesehatan[]).map(kategori => {
                  const count = summary[`kategori${kategori}` as keyof typeof summary] as number;
                  const total = summary.totalPemeriksaan || 1;
                  const percentage = Math.round((count / total) * 100);
                  const colors: Record<KategoriKesehatan, string> = { A: 'bg-emerald-500', B: 'bg-sky-500', C: 'bg-amber-500', D: 'bg-orange-500', E: 'bg-rose-500' };
                  return (
                    <div key={kategori}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Kategori {kategori}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[kategori]} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Status Kelaikan</h3>
              <div className="space-y-3">
                {[{ label: 'Fit to Fly', value: summary.fitToFly, color: 'bg-emerald-500' }, { label: 'Fit with Restriction', value: summary.fitWithRestriction, color: 'bg-amber-500' }, { label: 'Unfit', value: summary.unfit, color: 'bg-rose-500' }].map(item => {
                  const total = summary.totalPemeriksaan || 1;
                  const percentage = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{item.value} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl p-5 text-white">
              <h3 className="font-semibold mb-2">Informasi</h3>
              <p className="text-sm text-white/90">Rikkes (Pemeriksaan Kesehatan Berkala) adalah pemeriksaan kesehatan yang wajib dilakukan oleh seluruh personel TNI AU untuk menilai kelaikan dalam melaksanakan tugas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
