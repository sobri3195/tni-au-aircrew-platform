import { Badge } from '../components/ui/Badge';
import { useApp } from '../contexts/AppContext';
import { daysUntil } from '../utils/date';

const medicalClassByStatus = {
  Active: 'Class I',
  Limited: 'Class II',
  Grounded: 'Class III'
} as const;

export const MedicalReadinessPage = () => {
  const { state } = useApp();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Medical Readiness</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Status medical class, expiry, immunization, restriction warning.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {state.profiles.map((profile, index) => {
          const medicalExpiry = new Date(Date.now() + (45 - index * 40) * 24 * 60 * 60 * 1000).toISOString();
          const immunizationExpiry = new Date(Date.now() + (120 - index * 100) * 24 * 60 * 60 * 1000).toISOString();
          const medicalDays = daysUntil(medicalExpiry);
          const immDays = daysUntil(immunizationExpiry);
          const hasRestriction = profile.status !== 'Active';

          return (
            <div key={profile.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{profile.name}</h3>
                <Badge label={medicalClassByStatus[profile.status]} tone="blue" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Medical expiry: {new Date(medicalExpiry).toLocaleDateString('id-ID')}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Immunization expiry: {new Date(immunizationExpiry).toLocaleDateString('id-ID')}</p>
              <div className="flex gap-2">
                <Badge label={medicalDays < 30 ? 'Medical Expiring' : 'Medical OK'} tone={medicalDays < 30 ? 'yellow' : 'green'} />
                <Badge label={immDays < 30 ? 'Immunization Due' : 'Immunization OK'} tone={immDays < 30 ? 'yellow' : 'green'} />
                {hasRestriction && <Badge label="Restriction Warning" tone="red" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
