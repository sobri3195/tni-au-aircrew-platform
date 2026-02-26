export const Timeline = ({ points }: { points: { title: string; date: string }[] }) => (
  <ol className="space-y-3 border-l border-slate-300 pl-4 dark:border-slate-700">
    {points.map((p) => (
      <li key={`${p.title}-${p.date}`}>
        <p className="font-medium">{p.title}</p>
        <p className="text-xs text-slate-500">{new Date(p.date).toLocaleString('id-ID')}</p>
      </li>
    ))}
  </ol>
);
