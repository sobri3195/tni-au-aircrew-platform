import { useState } from 'react';
import { Table } from '../components/ui/Table';
import { type MasterDataKey, useMasterData } from '../hooks/useMasterData';

const permissionRows = [
  { role: 'Pilot', read: '✅', write: 'Sortie/Logbook', admin: '❌' },
  { role: 'Flight Safety Officer', read: '✅', write: 'Safety Report', admin: '❌' },
  { role: 'Ops Officer', read: '✅', write: 'Schedule/NOTAM', admin: '❌' },
  { role: 'Medical', read: '✅', write: 'Medical Status', admin: '❌' },
  { role: 'Commander/Admin', read: '✅', write: 'All Module', admin: '✅' }
];

const masterConfigs: { key: MasterDataKey; title: string; inputLabel: string }[] = [
  { key: 'aircraft', title: 'Aircraft Master', inputLabel: 'Nama aircraft' },
  { key: 'bases', title: 'Base Master', inputLabel: 'Nama base' },
  { key: 'sorties', title: 'Sortie Master', inputLabel: 'Jenis sortie' }
];

export const AdminPanelPage = () => {
  const { masterData, addItem, updateItem, deleteItem, reset } = useMasterData();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Master data aircraft/base/sortie sudah tersimpan di localStorage dan dipakai lintas modul.</p>
        </div>
        <button className="btn" onClick={reset}>Reset Master Data</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {masterConfigs.map((config) => (
          <MasterCrudCard
            key={config.key}
            items={masterData[config.key]}
            title={config.title}
            inputLabel={config.inputLabel}
            onAdd={(value) => addItem(config.key, value)}
            onUpdate={(index, value) => updateItem(config.key, index, value)}
            onDelete={(index) => deleteItem(config.key, index)}
          />
        ))}
      </div>

      <Table headers={['Role', 'Read', 'Write', 'Admin']}>
        {permissionRows.map((row) => (
          <tr key={row.role} className="border-t border-slate-200 dark:border-slate-700">
            <td className="px-3 py-2 font-medium">{row.role}</td>
            <td className="px-3 py-2">{row.read}</td>
            <td className="px-3 py-2">{row.write}</td>
            <td className="px-3 py-2">{row.admin}</td>
          </tr>
        ))}
      </Table>
    </section>
  );
};

const MasterCrudCard = ({
  title,
  inputLabel,
  items,
  onAdd,
  onUpdate,
  onDelete
}: {
  title: string;
  inputLabel: string;
  items: string[];
  onAdd: (value: string) => void;
  onUpdate: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}) => {
  const [draft, setDraft] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold">{title}</h3>

      <div className="flex gap-2">
        <input className="input" placeholder={inputLabel} value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button
          className="btn"
          onClick={() => {
            onAdd(draft);
            setDraft('');
          }}
        >
          Add
        </button>
      </div>

      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            {editingIndex === index ? (
              <div className="space-y-2">
                <input className="input" value={editingValue} onChange={(event) => setEditingValue(event.target.value)} />
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() => {
                      onUpdate(index, editingValue);
                      setEditingIndex(null);
                      setEditingValue('');
                    }}
                  >
                    Simpan
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditingValue('');
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span>{item}</span>
                <div className="flex gap-2">
                  <button
                    className="btn"
                    onClick={() => {
                      setEditingIndex(index);
                      setEditingValue(item);
                    }}
                  >
                    Edit
                  </button>
                  <button className="btn" onClick={() => onDelete(index)}>
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">CRUD: tambah, ubah, hapus tersimpan otomatis ke localStorage.</p>
    </div>
  );
};
