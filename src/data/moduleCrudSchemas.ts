export type CrudFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea';

export type ModuleCrudField = {
  key: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  options?: string[];
};

export type ModuleCrudSchema = {
  entityName: string;
  fields: ModuleCrudField[];
  defaultStatus?: string;
  statuses?: string[];
};

const commonStatuses = ['Draft', 'Open', 'In Review', 'Closed'];

export const moduleCrudSchemas: Record<string, ModuleCrudSchema> = {
  '/medical-profile': {
    entityName: 'Medical Profile',
    statuses: ['Fit', 'Limited', 'Unfit'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'medicalClass', label: 'Medical Class', type: 'select', options: ['Class I', 'Class II', 'Class III'], required: true },
      { key: 'waiverStatus', label: 'Waiver Status', type: 'select', options: ['None', 'Active', 'Expired'] },
      { key: 'lastExamDate', label: 'Last Exam Date', type: 'date', required: true }
    ]
  },
  '/medical-validity': {
    entityName: 'Medical Validity',
    statuses: ['Valid', 'Watch 30 Days', 'Expired'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'medicalCertificateNo', label: 'Certificate No', type: 'text', required: true },
      { key: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { key: 'fitState', label: 'Fit State', type: 'select', options: ['Fit', 'Temporary Unfit', 'Unfit'] }
    ]
  },
  '/medication-restriction': {
    entityName: 'Medication Restriction',
    statuses: ['Monitoring', 'Grounded', 'Cleared'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'medication', label: 'Medication', type: 'text', required: true },
      { key: 'sedationRisk', label: 'Sedation Risk', type: 'select', options: ['Low', 'Moderate', 'High'], required: true },
      { key: 'restrictionNote', label: 'Restriction Note', type: 'textarea' }
    ]
  },
  '/vaccination-monitoring': {
    entityName: 'Vaccination Window',
    statuses: ['Observed', 'Restricted', 'Released'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'vaccineType', label: 'Vaccine Type', type: 'text', required: true },
      { key: 'vaccinationDate', label: 'Vaccination Date', type: 'date', required: true },
      { key: 'symptoms', label: 'Post-vaccine Symptoms', type: 'textarea' }
    ]
  },
  '/fatigue-sleep-monitoring': {
    entityName: 'Fatigue Monitoring',
    statuses: ['Normal', 'Watch', 'Critical'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'sleepHours', label: 'Sleep Hours', type: 'number', required: true },
      { key: 'dutyHours', label: 'Duty Hours', type: 'number' },
      { key: 'fatigueScore', label: 'Fatigue Score (1-10)', type: 'number', required: true }
    ]
  },
  '/mental-readiness': {
    entityName: 'Mental Readiness Check-in',
    statuses: ['Stable', 'Needs Follow-up', 'Escalated'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'checkInDate', label: 'Check-in Date', type: 'date', required: true },
      { key: 'moodIndex', label: 'Mood Index (1-10)', type: 'number', required: true },
      { key: 'notes', label: 'Confidential Notes', type: 'textarea' }
    ]
  },
  '/physical-fitness': {
    entityName: 'Physical Fitness Record',
    statuses: ['Pass', 'Watch', 'Remedial'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'bmi', label: 'BMI', type: 'number', required: true },
      { key: 'bloodPressure', label: 'Blood Pressure', type: 'text', required: true },
      { key: 'vo2Result', label: 'VO2 / Lari Result', type: 'text' }
    ]
  },
  '/occupational-health': {
    entityName: 'Occupational Exposure',
    statuses: ['Normal', 'Observed', 'Action Required'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'exposureType', label: 'Exposure Type', type: 'select', options: ['Noise', 'Chemical', 'Heat', 'Radiation'], required: true },
      { key: 'exposureLevel', label: 'Exposure Level', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
      { key: 'mitigationPlan', label: 'Mitigation Plan', type: 'textarea' }
    ]
  },
  '/training-detail': {
    entityName: 'Training Item',
    statuses: ['Planned', 'In Progress', 'Completed', 'Overdue'],
    fields: [
      { key: 'aircrew', label: 'Aircrew', type: 'text', required: true },
      { key: 'syllabus', label: 'Syllabus', type: 'text', required: true },
      { key: 'simHours', label: 'Jam Simulator', type: 'number' },
      { key: 'checkrideDate', label: 'Tanggal Checkride', type: 'date' }
    ]
  },
  '/training-expiry-forecast': {
    entityName: 'Forecast',
    statuses: ['90 Days', '60 Days', '30 Days', 'Expired'],
    fields: [
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'trainingType', label: 'Training Type', type: 'text', required: true },
      { key: 'expiryDate', label: 'Tanggal Expiry', type: 'date', required: true },
      { key: 'priority', label: 'Prioritas', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
    ]
  },
  '/currency-status': {
    entityName: 'Currency Record',
    statuses: ['Current', 'Watch', 'Expired'],
    fields: [
      { key: 'pilot', label: 'Pilot', type: 'text', required: true },
      { key: 'currencyType', label: 'Currency', type: 'select', options: ['Night', 'Instrument', 'Formation', 'Low Level'], required: true },
      { key: 'lastFlight', label: 'Last Flight', type: 'date' },
      { key: 'nextDue', label: 'Next Due', type: 'date' }
    ]
  },
  '/qualification-matrix': {
    entityName: 'Qualification',
    statuses: ['Qualified', 'Limited', 'Not Qualified'],
    fields: [
      { key: 'pilot', label: 'Pilot', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text', required: true },
      { key: 'aircraft', label: 'Aircraft Type', type: 'text', required: true },
      { key: 'validUntil', label: 'Valid Until', type: 'date' }
    ]
  },
  '/learning-record': {
    entityName: 'Learning Evidence',
    statuses: ['Uploaded', 'Verified', 'Rejected'],
    fields: [
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'certificate', label: 'Sertifikat', type: 'text', required: true },
      { key: 'issuer', label: 'Issuer', type: 'text' },
      { key: 'docLink', label: 'Dokumen URL', type: 'text' }
    ]
  },
  '/elogbook-integrated': {
    entityName: 'Sortie Log',
    statuses: ['Draft', 'Submitted', 'Validated'],
    fields: [
      { key: 'sortieNo', label: 'Sortie', type: 'text', required: true },
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'flightHours', label: 'Jam Terbang', type: 'number' },
      { key: 'remark', label: 'Remark', type: 'textarea' }
    ]
  },
  '/sortie-planning': {
    entityName: 'Sortie Plan',
    statuses: ['Planned', 'Conflict', 'Approved'],
    fields: [
      { key: 'mission', label: 'Mission', type: 'text', required: true },
      { key: 'date', label: 'Tanggal', type: 'date', required: true },
      { key: 'crewAssign', label: 'Crew Assignment', type: 'textarea' },
      { key: 'fitCheck', label: 'Fit Check', type: 'select', options: ['Pass', 'Pending', 'Fail'] }
    ]
  },
  '/postflight-medical-debrief': {
    entityName: 'Debrief',
    statuses: ['Open', 'Reviewed', 'Closed'],
    fields: [
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'symptoms', label: 'Symptoms', type: 'textarea' },
      { key: 'fatigue', label: 'Fatigue Rating (1-10)', type: 'number' },
      { key: 'action', label: 'Follow-up Action', type: 'textarea' }
    ]
  },
  '/physio-event-reporting': {
    entityName: 'Physio Event',
    statuses: ['Submitted', 'Investigating', 'Closed'],
    fields: [
      { key: 'eventType', label: 'Event Type', type: 'select', options: ['G-LOC', 'Hypoxia', 'Barotrauma', 'Lainnya'], required: true },
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'detail', label: 'Detail', type: 'textarea' }
    ]
  },
  '/aircraft-availability-link': {
    entityName: 'Aircraft Status',
    statuses: ['FMC', 'PMC', 'NMC'],
    fields: [
      { key: 'tailNo', label: 'Tail Number', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['FMC', 'PMC', 'NMC'], required: true },
      { key: 'maintenanceFlag', label: 'Maintenance Flag', type: 'select', options: ['None', 'Minor', 'Critical'] },
      { key: 'note', label: 'Catatan', type: 'textarea' }
    ]
  },
  '/orm-builder': {
    entityName: 'ORM Assessment',
    statuses: ['Draft', 'Submitted', 'Approved'],
    fields: [
      { key: 'template', label: 'Template', type: 'text', required: true },
      { key: 'riskItem', label: 'Risk Item', type: 'textarea', required: true },
      { key: 'score', label: 'Score', type: 'number', required: true },
      { key: 'mitigation', label: 'Mitigation', type: 'textarea' }
    ]
  },
  '/risk-register': {
    entityName: 'Risk Register Item',
    statuses: ['Open', 'Mitigating', 'Closed'],
    fields: [
      { key: 'risk', label: 'Risk', type: 'textarea', required: true },
      { key: 'pic', label: 'PIC', type: 'text', required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'evidence', label: 'Evidence URL', type: 'text' }
    ]
  },
  '/incident-workflow': {
    entityName: 'Incident',
    statuses: ['Submitted', 'Review', 'Closed'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Minor', 'Major', 'Critical'], required: true },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea' }
    ]
  },
  '/safety-trend-analytics': {
    entityName: 'Trend Entry',
    statuses: ['Normal', 'Watch', 'Alert'],
    fields: [
      { key: 'period', label: 'Period', type: 'text', required: true },
      { key: 'sorties', label: 'Sorties', type: 'number' },
      { key: 'incidents', label: 'Incidents', type: 'number' },
      { key: 'heatmapZone', label: 'Heatmap Zone', type: 'text' }
    ]
  },
  '/early-warning-alerts': {
    entityName: 'Early Warning',
    statuses: ['Open', 'Acknowledged', 'Resolved'],
    fields: [
      { key: 'alertType', label: 'Alert Type', type: 'select', options: ['Training Expiry', 'Medical Expiry', 'High Risk'], required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'threshold', label: 'Threshold', type: 'text' },
      { key: 'action', label: 'Action', type: 'textarea' }
    ]
  },
  '/unified-readiness-score': {
    entityName: 'Readiness Score',
    statuses: ['Green', 'Amber', 'Red'],
    fields: [
      { key: 'unit', label: 'Unit', type: 'text', required: true },
      { key: 'medicalWeight', label: 'Medical Weight %', type: 'number' },
      { key: 'trainingWeight', label: 'Training Weight %', type: 'number' },
      { key: 'opsRiskWeight', label: 'Ops Risk Weight %', type: 'number' }
    ]
  },
  '/mission-state-rules': {
    entityName: 'Mission Rule',
    statuses: ['Active', 'Override', 'Disabled'],
    fields: [
      { key: 'ruleName', label: 'Rule Name', type: 'text', required: true },
      { key: 'autoState', label: 'Auto State', type: 'select', options: ['RED', 'AMBER', 'GREEN'], required: true },
      { key: 'manualOverrideBy', label: 'Manual Override By', type: 'text' },
      { key: 'reason', label: 'Reason', type: 'textarea' }
    ]
  },
  '/readiness-drilldown': {
    entityName: 'Readiness Drilldown',
    statuses: ['Green', 'Amber', 'Red'],
    fields: [
      { key: 'unit', label: 'Unit', type: 'text', required: true },
      { key: 'squadron', label: 'Squadron', type: 'text', required: true },
      { key: 'individual', label: 'Individual', type: 'text' },
      { key: 'score', label: 'Score', type: 'number' }
    ]
  },
  '/priority-actions': {
    entityName: 'Priority Action',
    statuses: ['Queued', 'In Progress', 'Done', 'Over SLA'],
    fields: [
      { key: 'task', label: 'Task', type: 'textarea', required: true },
      { key: 'owner', label: 'Owner', type: 'text', required: true },
      { key: 'slaDate', label: 'SLA Date', type: 'date' },
      { key: 'reason', label: 'Reason', type: 'textarea' }
    ]
  },
  '/export-laporan': {
    entityName: 'Export Job',
    fields: [
      { key: 'reportName', label: 'Report Name', type: 'text', required: true },
      { key: 'format', label: 'Format', type: 'select', options: ['PDF', 'Excel'] },
      { key: 'signer', label: 'Penanda Tangan', type: 'text' },
      { key: 'scope', label: 'Scope', type: 'text' }
    ]
  },
  '/audit-log-viewer': {
    entityName: 'Audit Record',
    fields: [
      { key: 'actor', label: 'Actor', type: 'text', required: true },
      { key: 'action', label: 'Action', type: 'text', required: true },
      { key: 'timestamp', label: 'Timestamp', type: 'date' },
      { key: 'reason', label: 'Reason', type: 'textarea' }
    ]
  },
  '/rbac': {
    entityName: 'Access Rule',
    statuses: ['Active', 'Pending', 'Disabled'],
    fields: [
      { key: 'role', label: 'Role', type: 'select', options: ['Dokter', 'Pilot', 'Ops', 'Komandan'], required: true },
      { key: 'module', label: 'Module', type: 'text', required: true },
      { key: 'permission', label: 'Permission', type: 'select', options: ['Read', 'Write', 'Approve', 'Admin'] },
      { key: 'justification', label: 'Justification', type: 'textarea' }
    ]
  },
  '/offline-sync': {
    entityName: 'Sync Queue',
    statuses: ['Cached', 'Syncing', 'Conflict', 'Synced'],
    fields: [
      { key: 'entity', label: 'Entity', type: 'text', required: true },
      { key: 'lastUpdated', label: 'Last Updated', type: 'date' },
      { key: 'conflictStatus', label: 'Conflict Status', type: 'select', options: ['None', 'Local Wins', 'Remote Wins', 'Manual Merge'] },
      { key: 'resolution', label: 'Resolution', type: 'textarea' }
    ]
  },
  '/notam-monitor': {
    entityName: 'NOTAM Item',
    fields: [
      { key: 'notamNo', label: 'NOTAM No', type: 'text', required: true },
      { key: 'area', label: 'Area', type: 'text' },
      { key: 'validUntil', label: 'Valid Until', type: 'date' },
      { key: 'hazard', label: 'Hazard', type: 'textarea' }
    ]
  },
  '/weather-brief-integration': {
    entityName: 'Weather Brief',
    fields: [
      { key: 'station', label: 'Station', type: 'text', required: true },
      { key: 'metar', label: 'METAR', type: 'text' },
      { key: 'taf', label: 'TAF', type: 'text' },
      { key: 'impact', label: 'Mission Impact', type: 'textarea' }
    ]
  },
  '/crew-duty-rest-monitor': {
    entityName: 'Duty-Rest Record',
    statuses: ['Compliant', 'Watch', 'Violation'],
    fields: [
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'dutyHours', label: 'Duty Hours', type: 'number' },
      { key: 'restHours', label: 'Rest Hours', type: 'number' },
      { key: 'monitorNote', label: 'Monitoring Note', type: 'textarea' }
    ]
  },
  '/mission-intake-hub': {
    entityName: 'Mission Demand',
    statuses: ['Draft', 'Qualified', 'Rejected'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'objective', label: 'Objective', type: 'textarea', required: true },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Routine', 'Important', 'Urgent', 'Critical'], required: true },
      { key: 'targetEtd', label: 'Target ETD', type: 'date' }
    ]
  },
  '/crew-readiness-allocator': {
    entityName: 'Crew Allocation',
    statuses: ['Candidate', 'Conflict', 'Assigned'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'crewName', label: 'Crew Name', type: 'text', required: true },
      { key: 'readinessScore', label: 'Readiness Score', type: 'number' },
      { key: 'blockingFactor', label: 'Blocking Factor', type: 'textarea' }
    ]
  },
  '/mission-package-linker': {
    entityName: 'Mission Package',
    statuses: ['Collecting', 'Ready for Gate', 'Approved'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'briefRef', label: 'Brief Reference', type: 'text', required: true },
      { key: 'aircraftPlan', label: 'Aircraft Plan', type: 'textarea' },
      { key: 'crewManifest', label: 'Crew Manifest', type: 'textarea' }
    ]
  },
  '/integrated-go-no-go-gate': {
    entityName: 'Go/No-Go Decision',
    statuses: ['Pending Inputs', 'Go', 'No-Go', 'Override'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'ormScore', label: 'ORM Score', type: 'number' },
      { key: 'weatherState', label: 'Weather State', type: 'select', options: ['Green', 'Amber', 'Red'] },
      { key: 'decisionNote', label: 'Decision Note', type: 'textarea' }
    ]
  },
  '/mission-execution-watch': {
    entityName: 'Execution Event',
    statuses: ['Observed', 'Escalated', 'Closed'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'eventTime', label: 'Event Time', type: 'date' },
      { key: 'eventType', label: 'Event Type', type: 'select', options: ['Comms', 'Weather Shift', 'Aircraft', 'Medical', 'Safety'], required: true },
      { key: 'impact', label: 'Impact', type: 'textarea' }
    ]
  },
  '/contingency-branch-manager': {
    entityName: 'Contingency Branch',
    statuses: ['Prepared', 'Activated', 'Resolved'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'trigger', label: 'Trigger', type: 'textarea', required: true },
      { key: 'branchPlan', label: 'Branch Plan', type: 'textarea', required: true },
      { key: 'owner', label: 'Owner', type: 'text' }
    ]
  },
  '/post-mission-recovery-loop': {
    entityName: 'Recovery Action',
    statuses: ['Logged', 'In Recovery', 'Recovered'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'fatigueIndex', label: 'Fatigue Index', type: 'number' },
      { key: 'recoveryPlan', label: 'Recovery Plan', type: 'textarea' }
    ]
  },
  '/lessons-learned-fusion': {
    entityName: 'Lesson Item',
    statuses: ['Draft', 'Validated', 'Published'],
    fields: [
      { key: 'missionCode', label: 'Mission Code', type: 'text', required: true },
      { key: 'source', label: 'Source', type: 'select', options: ['Debrief', 'Incident', 'Training', 'ORM'], required: true },
      { key: 'lesson', label: 'Lesson', type: 'textarea', required: true },
      { key: 'recommendedChange', label: 'Recommended Change', type: 'textarea' }
    ]
  },
  '/adaptive-training-feedback': {
    entityName: 'Training Feedback',
    statuses: ['Suggested', 'Assigned', 'Completed'],
    fields: [
      { key: 'lessonRef', label: 'Lesson Reference', type: 'text', required: true },
      { key: 'crew', label: 'Crew', type: 'text', required: true },
      { key: 'trainingType', label: 'Training Type', type: 'text', required: true },
      { key: 'targetDate', label: 'Target Date', type: 'date' }
    ]
  },
  '/command-readiness-what-if': {
    entityName: 'What-If Scenario',
    statuses: ['Draft', 'Simulated', 'Adopted'],
    fields: [
      { key: 'scenarioName', label: 'Scenario Name', type: 'text', required: true },
      { key: 'missionCode', label: 'Mission Code', type: 'text' },
      { key: 'changeInput', label: 'Change Input', type: 'textarea', required: true },
      { key: 'predictedState', label: 'Predicted State', type: 'select', options: ['GREEN', 'AMBER', 'RED'] }
    ]
  }
};

export const getModuleCrudSchema = (path: string): ModuleCrudSchema =>
  moduleCrudSchemas[path] ?? {
    entityName: 'Workflow Record',
    statuses: commonStatuses,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ],
    defaultStatus: 'Open'
  };
