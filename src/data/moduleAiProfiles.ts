import type { FeatureModule } from './featureModules';

export type ModuleAiProfile = {
  id: string;
  name: string;
  role: string;
  focus: string;
  objective: string;
  automation: string;
  tone: 'sky' | 'emerald' | 'violet';
};

const toneStyles = ['sky', 'emerald', 'violet'] as const;

type Tone = (typeof toneStyles)[number];

const groupAiTemplates: Record<string, Array<Omit<ModuleAiProfile, 'id' | 'objective' | 'automation'>>> = {
  'Medical & Aeromedical': [
    {
      name: 'AI Flight Surgeon',
      role: 'Medical risk triage',
      focus: 'Validasi fit/unfit, waiver, restriction, dan exposure klinis.',
      tone: 'sky'
    },
    {
      name: 'AI Fatigue Sentinel',
      role: 'Human performance monitor',
      focus: 'Pantau fatigue, sleep debt, circadian drift, dan mental readiness.',
      tone: 'emerald'
    },
    {
      name: 'AI Compliance Nurse',
      role: 'Medical admin copilot',
      focus: 'Pastikan dokumen medis, vaksinasi, dan reminder expiry tetap lengkap.',
      tone: 'violet'
    }
  ],
  'Training & Currency': [
    {
      name: 'AI Syllabus Coach',
      role: 'Training progression planner',
      focus: 'Susun remediation, recurrent plan, dan prioritas syllabus.',
      tone: 'sky'
    },
    {
      name: 'AI Currency Guard',
      role: 'Expiry & currency monitor',
      focus: 'Cegah lapse untuk checkride, instrument, formation, dan simulator.',
      tone: 'emerald'
    },
    {
      name: 'AI Qualification Mapper',
      role: 'Qualification analyst',
      focus: 'Cocokkan role, aircraft type, dan bukti kompetensi.',
      tone: 'violet'
    }
  ],
  'Flight Ops & Logbook': [
    {
      name: 'AI Sortie Planner',
      role: 'Ops scheduling copilot',
      focus: 'Optimalkan crew assignment, sortie flow, dan aircraft pairing.',
      tone: 'sky'
    },
    {
      name: 'AI Debrief Analyst',
      role: 'Post-flight reviewer',
      focus: 'Ekstrak lesson learned, symptom report, dan corrective action.',
      tone: 'emerald'
    },
    {
      name: 'AI Fleet Linker',
      role: 'Aircraft-logbook synchronizer',
      focus: 'Jaga sinkronisasi tail number, maintenance flag, dan sortie remarks.',
      tone: 'violet'
    }
  ],
  'Risk & Safety (ORM)': [
    {
      name: 'AI Risk Assessor',
      role: 'ORM scoring engine',
      focus: 'Hitung risiko, severity, likelihood, dan mitigasi prioritas.',
      tone: 'sky'
    },
    {
      name: 'AI Safety Investigator',
      role: 'Incident workflow copilot',
      focus: 'Percepat review insiden, RCA, dan closure tindakan perbaikan.',
      tone: 'emerald'
    },
    {
      name: 'AI Alert Forecaster',
      role: 'Early warning predictor',
      focus: 'Deteksi tren safety dan lonjakan exposure sebelum menjadi insiden.',
      tone: 'violet'
    }
  ],
  'Command & Readiness Analytics': [
    {
      name: 'AI Readiness Strategist',
      role: 'Readiness decision support',
      focus: 'Gabungkan sinyal medical, training, dan operasi menjadi rekomendasi komando.',
      tone: 'sky'
    },
    {
      name: 'AI Mission Gatekeeper',
      role: 'Execution gate analyst',
      focus: 'Pantau dependency lintas modul, override, dan priority actions.',
      tone: 'emerald'
    },
    {
      name: 'AI Audit Sentinel',
      role: 'Governance monitor',
      focus: 'Awasi audit log, RBAC, dan integritas jejak keputusan.',
      tone: 'violet'
    }
  ]
};

const fallbackAiTemplates: Array<Omit<ModuleAiProfile, 'id' | 'objective' | 'automation'>> = [
  {
    name: 'AI Ops Copilot',
    role: 'Operational assistant',
    focus: 'Mengorkestrasi workflow dan closure item lintas tim.',
    tone: 'sky'
  },
  {
    name: 'AI Readiness Monitor',
    role: 'Readiness observer',
    focus: 'Menyorot dependency yang menahan kesiapan modul.',
    tone: 'emerald'
  },
  {
    name: 'AI Compliance Recorder',
    role: 'Compliance support',
    focus: 'Menjaga evidencing, audit trail, dan status review.',
    tone: 'violet'
  }
];

export const buildModuleAiProfiles = (module: Pick<FeatureModule, 'path' | 'title' | 'group' | 'description'>): ModuleAiProfile[] => {
  const templates = groupAiTemplates[module.group] ?? fallbackAiTemplates;

  return templates.map((template, index) => {
    const sequence = index + 1;
    const objective = `Fokus ${module.title.toLowerCase()}: ${template.focus}`;
    const automation = `Buat rekomendasi prioritas ${sequence} untuk ${module.description.toLowerCase()}`;

    return {
      id: `${module.path}-ai-${sequence}`,
      name: template.name,
      role: template.role,
      focus: template.focus,
      objective,
      automation,
      tone: (template.tone ?? toneStyles[index % toneStyles.length]) as Tone
    };
  });
};
