import type { ReactNode } from 'react';

export const Modal = ({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
};
