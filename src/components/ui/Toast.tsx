import { useEffect, useState } from 'react';

export const Toast = ({ message }: { message: string }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;
  return <div className="fixed bottom-4 right-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">{message}</div>;
};
