import { Table } from '../components/ui/Table';

const aircraftMaster = ['F-16C TS-1601', 'T-50i TT-5008', 'CN-295 A-2901'];
const baseMaster = ['Lanud Iswahjudi', 'Lanud Halim', 'Lanud Sultan Hasanuddin'];
const sortieMaster = ['CAP', 'Training', 'Navigation', 'Night Ops'];

const permissionRows = [
  { role: 'Pilot', read: '✅', write: 'Sortie/Logbook', admin: '❌' },
  { role: 'Flight Safety Officer', read: '✅', write: 'Safety Report', admin: '❌' },
  { role: 'Ops Officer', read: '✅', write: 'Schedule/NOTAM', admin: '❌' },
  { role: 'Medical', read: '✅', write: 'Medical Status', admin: '❌' },
  { role: 'Commander/Admin', read: '✅', write: 'All Module', admin: '✅' }
];

export const AdminPanelPage = () => (
  <section className="space-y-4">
    <div>
      <h2 className="text-xl font-bold">Admin Panel</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">Master data aircraft/base/sortie/users dan permission matrix per role.</p>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <div className="card">
        <h3 className="mb-2 font-semibold">Aircraft Master</h3>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {aircraftMaster.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3 className="mb-2 font-semibold">Base Master</h3>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {baseMaster.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3 className="mb-2 font-semibold">Sortie Master</h3>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {sortieMaster.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
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
