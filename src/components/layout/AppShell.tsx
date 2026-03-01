import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../contexts/AppContext';

export const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.querySelector('input[placeholder^="Global Search"]') as HTMLInputElement | null;
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
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)} aria-label="Tutup menu" />
          <div className="relative z-10 h-full">
            <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Topbar onMenuToggle={() => setMobileMenuOpen(true)} />
        <div className="p-3 md:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
