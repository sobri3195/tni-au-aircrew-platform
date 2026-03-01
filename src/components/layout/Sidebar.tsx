import { NavLink } from 'react-router-dom';

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

const navGroups = [
  {
    label: 'Alur Utama',
    items: [
      ['/', '1. Dashboard'],
      ['/logbook', '2. E-Logbook'],
      ['/orm', '3. Risk Assessment ORM'],
      ['/training', '4. Training Tracker'],
      ['/schedule', '5. Schedule Planner']
    ]
  },
  {
    label: 'Monitoring',
    items: [
      ['/notam', 'NOTAM'],
      ['/safety', 'Safety Reporting'],
      ['/medical', 'Medical Readiness'],
      ['/weather', 'Weather Brief'],
      ['/duty-rest', 'Crew Duty & Rest Tracker'],
      ['/fatigue', 'Fatigue Assessment']
    ]
  },
  {
    label: 'Operasional',
    items: [
      ['/profile', 'Pilot Profile'],
      ['/incident-workspace', 'Incident Workspace'],
      ['/checklist', 'Checklist Builder'],
      ['/maintenance', 'Maintenance Snapshot'],
      ['/inventory', 'Equipment Inventory'],
      ['/documents', 'SOP / Document Center'],
      ['/messaging', 'Secure Messaging']
    ]
  },
  {
    label: 'Analitik',
    items: [
      ['/reports', 'Reports'],
      ['/admin', 'Admin Panel']
    ]
  }
];

export const Sidebar = ({ mobile = false, onNavigate }: SidebarProps) => (
  <aside
    className={`h-full overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 ${mobile ? 'w-80 max-w-[85vw]' : 'w-72'}`}
  >
    <div className="mb-6 flex items-center gap-3">
      <img src="/logo.svg" alt="TNI AU Aircrew Logo" className="h-10 w-10 rounded-lg" />
      <div>
        <h1 className="text-lg font-bold">TNI AU Aircrew</h1>
        <p className="text-xs text-slate-500">Operational Ready Platform</p>
      </div>
    </div>
    <nav className="space-y-4">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
          {group.items.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  </aside>
);
