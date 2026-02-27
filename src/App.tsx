import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { GenericFeaturePage } from './pages/GenericFeaturePage';
import { LoginPage } from './pages/LoginPage';
import { LogbookPage } from './pages/LogbookPage';
import { MedicalReadinessPage } from './pages/MedicalReadinessPage';
import { NotamPage } from './pages/NotamPage';
import { OrmPage } from './pages/OrmPage';
import { ReportsPage } from './pages/ReportsPage';
import { SafetyReportingPage } from './pages/SafetyReportingPage';
import { SchedulePlannerPage } from './pages/SchedulePlannerPage';
import { TrainingPage } from './pages/TrainingPage';

const routes = [
  { path: '/profile', title: 'Pilot Profile & Qualification', description: 'Identitas, rating, NVG/IFR currency, emergency training, dan status Active/Limited/Grounded.' },
  { path: '/weather', title: 'Weather Brief', description: 'Data mock METAR/TAF style dan checklist reviewed.' },
  { path: '/duty-rest', title: 'Crew Duty & Rest Tracker', description: 'Pencatatan duty start/end dan rest violation checker.' },
  { path: '/incident-workspace', title: 'Incident Timeline & Investigation Workspace', description: 'Timeline kejadian, attachment mock, dan action item tracking.' },
  { path: '/documents', title: 'SOP / Document Center', description: 'Repository SOP/checklist/emergency docs, favorit, dan last read.' },
  { path: '/checklist', title: 'Checklist Builder', description: 'Builder checklist preflight/engine start/emergency dan run mode progress.' },
  { path: '/fatigue', title: 'Fatigue & Self-Assessment', description: 'Questionnaire fit/caution/no-go berbasis skor sederhana.' },
  { path: '/inventory', title: 'Equipment & GSE Inventory', description: 'Helmet/NVG/vest/oxygen/G-suit tracking serviceable history.' },
  { path: '/maintenance', title: 'Maintenance Snapshot', description: 'Daftar aircraft FMC/PMC/NMC beserta jadwal inspeksi mock.' },
  { path: '/messaging', title: 'Secure Messaging', description: 'Inbox/outbox internal localStorage dengan tag urgent/info.' }
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
          <Route path="/schedule" element={<SchedulePlannerPage />} />
          <Route path="/notam" element={<NotamPage />} />
          <Route path="/safety" element={<SafetyReportingPage />} />
          <Route path="/medical" element={<MedicalReadinessPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<GenericFeaturePage title={route.title} description={route.description} />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
