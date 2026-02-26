import type { ReactNode } from 'react';

export const Table = ({ headers, children }: { headers: string[]; children: ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="min-w-full text-sm">
      <thead className="bg-slate-100 dark:bg-slate-800">
        <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
