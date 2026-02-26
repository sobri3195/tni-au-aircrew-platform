import { NavLink } from 'react-router-dom';

const navItems = [
  ['/', 'Dashboard'],
  ['/logbook', 'E-Logbook'],
  ['/orm', 'Risk Assessment ORM'],
  ['/training', 'Training Tracker'],
  ['/schedule', 'Schedule'],
  ['/notam', 'NOTAM'],
  ['/safety', 'Safety Reporting'],
  ['/medical', 'Medical'],
  ['/reports', 'Reports'],
  ['/admin', 'Admin Panel']
];

export const Sidebar = () => (
  <aside className="w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <h1 className="mb-6 text-lg font-bold">TNI AU Aircrew</h1>
    <nav className="space-y-2">
      {navItems.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  </aside>
);
