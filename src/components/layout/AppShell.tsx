import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../contexts/AppContext';

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useLocalStorageState('app-mobile-menu-open', false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.getElementById('global-search-input') as HTMLInputElement | null;
        input?.focus();
      }
      if (event.altKey && event.key === '1') navigate('/');
      if (event.altKey && event.key === '2') navigate('/logbook');
      if (event.altKey && event.key === '3') navigate('/orm');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!state.loggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="relative flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)} aria-label="Tutup menu" />
          <div className="relative z-10 h-full">
            <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Topbar onMenuToggle={() => setMobileMenuOpen(true)} />
        <div className="mx-auto w-full max-w-[1400px] p-3 sm:p-4 lg:p-5">
          <section className="mb-4 rounded-xl border border-sky-200 bg-sky-50/90 p-3 text-sm text-sky-900 shadow-sm dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-100">
            <p className="font-semibold">Mode Frontend (Tanpa Backend)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
              <li>Semua form bisa langsung diinput dan disimpan otomatis ke <span className="font-semibold">Local Storage browser</span>.</li>
              <li>Tidak memerlukan API/server database untuk create, update, atau delete data.</li>
              <li>Data tetap ada saat halaman di-refresh pada browser yang sama, dan dapat berubah jika Local Storage dibersihkan.</li>
            </ul>
          </section>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
