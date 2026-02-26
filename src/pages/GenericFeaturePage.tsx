import { Badge } from '../components/ui/Badge';

export const GenericFeaturePage = ({ title, description }: { title: string; description: string }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-bold">{title}</h2>
    <div className="card">
      <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <Badge label="Frontend Mock Ready" tone="blue" />
    </div>
  </section>
);
