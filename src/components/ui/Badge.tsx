export const Badge = ({ label, tone = 'slate' }: { label: string; tone?: 'green' | 'yellow' | 'red' | 'blue' | 'slate' }) => {
  const map = {
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[tone]}`}>{label}</span>;
};
