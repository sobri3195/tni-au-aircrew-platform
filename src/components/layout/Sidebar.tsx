import { NavLink } from 'react-router-dom';
import { requestedFeatureModules } from '../../data/featureModules';

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

type NavItem = {
  to: string;
  label: string;
  icon: string;
};


const requestedNavGroups = Object.entries(
  requestedFeatureModules.reduce<Record<string, NavItem[]>>((acc, module) => {
    const groupItems = acc[module.group] ?? [];
    groupItems.push({
      to: module.path,
      label: module.navLabel ?? module.title,
      icon: module.icon
    });
    acc[module.group] = groupItems;
    return acc;
  }, {})
).map(([label, items]) => ({ label, items }));

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Alur Utama',
    items: [
      { to: '/', label: 'Dashboard', icon: '🏠' },
      { to: '/logbook', label: 'E-Logbook', icon: '📘' },
      { to: '/orm', label: 'Risk Assessment ORM', icon: '⚠️' },
      { to: '/training', label: 'Training Tracker', icon: '🎯' },
      { to: '/schedule', label: 'Schedule Planner', icon: '🗓️' }
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { to: '/notam', label: 'NOTAM', icon: '📡' },
      { to: '/safety', label: 'Safety Reporting', icon: '🛡️' },
      { to: '/medical', label: 'Medical Readiness', icon: '🩺' },
      { to: '/weather', label: 'Weather Brief', icon: '🌦️' },
      { to: '/duty-rest', label: 'Crew Duty & Rest', icon: '⏱️' },
      { to: '/fatigue', label: 'Fatigue Assessment', icon: '😴' }
    ]
  },
  {
    label: 'Operasional',
    items: [
      { to: '/profile', label: 'Pilot Profile', icon: '🧑‍✈️' },
      { to: '/incident-workspace', label: 'Incident Workspace', icon: '🧭' },
      { to: '/checklist', label: 'Checklist Builder', icon: '✅' },
      { to: '/maintenance', label: 'Maintenance Snapshot', icon: '🛠️' },
      { to: '/inventory', label: 'Equipment Inventory', icon: '🎒' },
      { to: '/documents', label: 'Document Center', icon: '📄' },
      { to: '/messaging', label: 'Secure Messaging', icon: '💬' }
    ]
  },
  {
    label: 'Penyempurnaan Penerbang',
    items: [
      { to: '/mission-readiness', label: 'Mission Readiness Matrix', icon: '🟢' },
      { to: '/combat-proficiency', label: 'Combat Proficiency', icon: '✈️' },
      { to: '/simulator-scenarios', label: 'Simulator Scenario', icon: '🕹️' },
      { to: '/emergency-drills', label: 'Emergency Drill', icon: '🚨' },
      { to: '/flight-debrief', label: 'Flight Debrief', icon: '🧠' },
      { to: '/aeromedical-risk', label: 'Aeromedical Risk', icon: '🧪' },
      { to: '/mission-knowledge', label: 'Mission Knowledge', icon: '📚' },
      { to: '/leadership-board', label: 'Leadership Board', icon: '🤝' },
      { to: '/readiness-forecast', label: 'Readiness Forecast', icon: '📈' },
      { to: '/career-path', label: 'Career Path Planner', icon: '🧭' }
    ]
  },
  {
    label: 'Analitik',
    items: [
      { to: '/reports', label: 'Reports', icon: '📊' },
      { to: '/admin', label: 'Admin Panel', icon: '🧰' }
    ]
  },
  ...requestedNavGroups
];

export const Sidebar = ({ mobile = false, onNavigate }: SidebarProps) => (
  <aside
    className={`h-full overflow-y-auto border-r border-slate-200/80 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 ${mobile ? 'w-80 max-w-[85vw]' : 'w-72'}`}
  >
    <div className="mb-6 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="TNI AU Aircrew Logo" className="h-10 w-10 rounded-lg" />
        <div>
          <h1 className="text-lg font-bold">TNI AU Aircrew</h1>
          <p className="text-xs text-slate-500">Operational Ready Platform</p>
        </div>
      </div>
    </div>
    <nav className="space-y-4">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-sky-700 text-white shadow shadow-sky-900/20'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  </aside>
);
