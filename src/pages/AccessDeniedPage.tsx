import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export const AccessDeniedPage = () => {
  const { state } = useApp();
  const location = useLocation();

  return (
    <section className="card space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Akses Ditolak</p>
      <h2 className="text-xl font-bold">Role {state.role} tidak memiliki izin ke modul ini</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Modul <span className="font-semibold">{location.pathname}</span> memerlukan role berbeda. Silakan ganti role dari topbar atau kembali ke dashboard.
      </p>
      <div>
        <Link to="/" className="inline-flex rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white">
          Kembali ke Dashboard
        </Link>
      </div>
    </section>
  );
};
