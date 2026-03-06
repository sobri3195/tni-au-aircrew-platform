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
import { RikkesPage } from './pages/RikkesPage';
import { SafetyReportingPage } from './pages/SafetyReportingPage';
import { SchedulePlannerPage } from './pages/SchedulePlannerPage';
import { TrainingPage } from './pages/TrainingPage';
import { requestedFeatureModules } from './data/featureModules';

const coreFeatureRoutes = [
  { path: '/profile', title: 'Pilot Profile & Qualification', description: 'Identitas, rating, NVG/IFR currency, emergency training, dan status Active/Limited/Grounded.' },
  { path: '/weather', title: 'Weather Brief', description: 'Data mock METAR/TAF style dan checklist reviewed.' },
  { path: '/duty-rest', title: 'Crew Duty & Rest Tracker', description: 'Pencatatan duty start/end dan rest violation checker.' },
  { path: '/incident-workspace', title: 'Incident Timeline & Investigation Workspace', description: 'Timeline kejadian, attachment mock, dan action item tracking.' },
  { path: '/documents', title: 'SOP / Document Center', description: 'Repository SOP/checklist/emergency docs, favorit, dan last read.' },
  { path: '/checklist', title: 'Checklist Builder', description: 'Builder checklist preflight/engine start/emergency dan run mode progress.' },
  { path: '/fatigue', title: 'Fatigue & Self-Assessment', description: 'Questionnaire fit/caution/no-go berbasis skor sederhana.' },
  { path: '/inventory', title: 'Equipment & GSE Inventory', description: 'Helmet/NVG/vest/oxygen/G-suit tracking serviceable history.' },
  { path: '/maintenance', title: 'Maintenance Snapshot', description: 'Daftar aircraft FMC/PMC/NMC beserta jadwal inspeksi mock.' },
  { path: '/messaging', title: 'Secure Messaging', description: 'Inbox/outbox internal localStorage dengan tag urgent/info.' },
  { path: '/mission-readiness', title: 'Mission Readiness Matrix', description: 'Matriks kesiapan penerbang per tipe misi dengan status Green/Amber/Red.' },
  { path: '/combat-proficiency', title: 'Combat Proficiency Analyzer', description: 'Pantau proficiency air-to-air, air-to-ground, dan tactical decision score.' },
  { path: '/simulator-scenarios', title: 'Simulator Scenario Manager', description: 'Rencanakan skenario simulator high-threat untuk menjaga tactical sharpness.' },
  { path: '/emergency-drills', title: 'Emergency Drill Orchestrator', description: 'Kelola latihan emergency berkala dan evaluasi performa time-critical.' },
  { path: '/flight-debrief', title: 'Flight Debrief Intelligence', description: 'Debrief sortie dengan temuan utama, lesson learned, dan corrective action.' },
  { path: '/aeromedical-risk', title: 'Aeromedical Risk Monitor', description: 'Monitoring risiko aeromedis: hidrasi, G-tolerance, dan paparan fatigue kronis.' },
  { path: '/mission-knowledge', title: 'Mission Knowledge Hub', description: 'Pusat pembelajaran taktik, replay kejadian, serta referensi mission package.' },
  { path: '/leadership-board', title: 'Wingman Leadership Board', description: 'Evaluasi kepemimpinan penerbang senior untuk mentoring dan safety culture.' },
  { path: '/readiness-forecast', title: 'Readiness Forecast', description: 'Prediksi kesiapan 14-30 hari ke depan untuk perencanaan komando skuadron.' },
  { path: '/career-path', title: 'Pilot Career Path Planner', description: 'Perencanaan jenjang kualifikasi penerbang dari basic mission ke mission commander.' }
];

const routes = [...coreFeatureRoutes, ...requestedFeatureModules];


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
          <Route path="/rikkes" element={<RikkesPage />} />
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
