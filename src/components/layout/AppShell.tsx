import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../contexts/AppContext';

export const AppShell = () => {
  const navigate = useNavigate();
  const { state } = useApp();

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

  if (!state.loggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1">
        <Topbar />
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
