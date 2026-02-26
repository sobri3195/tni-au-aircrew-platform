import { useState } from 'react';
import type { Role } from '../types';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const roles: Role[] = ['Pilot', 'Flight Safety Officer', 'Ops Officer', 'Medical', 'Commander/Admin'];

export const LoginPage = () => {
  const [role, setRole] = useState<Role>('Pilot');
  const { dispatch } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <img src="/logo.svg" alt="TNI AU Aircrew Logo" className="h-12 w-12 rounded-lg" />
          <div>
            <h2 className="text-2xl font-bold">Mock Login - Aircrew Platform</h2>
            <p className="text-xs text-slate-400">TNI AU Aircrew Digital Operations</p>
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-400">Pilih role operasional.</p>
        <select className="input mb-4" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {roles.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button
          className="w-full rounded-lg bg-sky-700 px-4 py-2 font-semibold"
          onClick={() => {
            dispatch({ type: 'LOGIN', payload: role });
            navigate('/');
          }}
        >
          Enter Platform
        </button>
      </div>
    </div>
  );
};
