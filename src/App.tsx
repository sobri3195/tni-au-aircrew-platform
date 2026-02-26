import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { GenericFeaturePage } from './pages/GenericFeaturePage';
import { LoginPage } from './pages/LoginPage';
import { LogbookPage } from './pages/LogbookPage';
import { OrmPage } from './pages/OrmPage';
import { ReportsPage } from './pages/ReportsPage';
import { TrainingPage } from './pages/TrainingPage';

const routes = [
  { path: '/profile', title: 'Pilot Profile & Qualification', description: 'Identitas, rating, NVG/IFR currency, emergency training, dan status Active/Limited/Grounded.' },
  { path: '/schedule', title: 'Schedule & Sortie Planner', description: 'Kalender mingguan mock, deteksi konflik overlap, serta manajemen sortie/training.' },
  { path: '/weather', title: 'Weather Brief', description: 'Data mock METAR/TAF style dan checklist reviewed.' },
  { path: '/notam', title: 'NOTAM & Airspace Notes', description: 'List NOTAM dengan filter area/base dan tombol acknowledge.' },
  { path: '/duty-rest', title: 'Crew Duty & Rest Tracker', description: 'Pencatatan duty start/end dan rest violation checker.' },
  { path: '/safety', title: 'Flight Safety Reporting', description: 'Laporan hazard/near-miss/incident termasuk anonymous option.' },
  { path: '/incident-workspace', title: 'Incident Timeline & Investigation Workspace', description: 'Timeline kejadian, attachment mock, dan action item tracking.' },
  { path: '/documents', title: 'SOP / Document Center', description: 'Repository SOP/checklist/emergency docs, favorit, dan last read.' },
  { path: '/checklist', title: 'Checklist Builder', description: 'Builder checklist preflight/engine start/emergency dan run mode progress.' },
  { path: '/medical', title: 'Medical Readiness', description: 'Status medical class, expiry, immunization, restriction warning.' },
  { path: '/fatigue', title: 'Fatigue & Self-Assessment', description: 'Questionnaire fit/caution/no-go berbasis skor sederhana.' },
  { path: '/inventory', title: 'Equipment & GSE Inventory', description: 'Helmet/NVG/vest/oxygen/G-suit tracking serviceable history.' },
  { path: '/maintenance', title: 'Maintenance Snapshot', description: 'Daftar aircraft FMC/PMC/NMC beserta jadwal inspeksi mock.' },
  { path: '/messaging', title: 'Secure Messaging', description: 'Inbox/outbox internal localStorage dengan tag urgent/info.' },
  { path: '/admin', title: 'Admin Panel', description: 'Master data aircraft/base/sortie/users dan permission matrix per role.' }
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/logbook" element={<LogbookPage />} />
          <Route path="/orm" element={<OrmPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<GenericFeaturePage title={route.title} description={route.description} />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
