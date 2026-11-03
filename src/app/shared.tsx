/**
 * app/shared.tsx — data helpers and models for Career Assessment 107 V2.
 * Conforms to FRS V2: Profile & Evidence Management, Career Exploration,
 * Criterion-Referenced Pathway Mapping, and Development Planning.
 */
import type {
  CaptureInput,
  InstrumentItem,
  PathwayCandidate,
  PathwayRequirement,
  RequirementStatus,
  ReviewState,
  Signal,
  SessionView,
} from '../api/types.ts';

// ----------------------------------------------------------------- profile & evidence (FR-001 - FR-008)

export interface UserEvidence {
  readonly id: string;
  readonly description: string;
  readonly sourceRef: string;
  readonly dateKnown?: string;
  readonly supportedClaim: string;
  readonly verified: boolean; // FR-007: distinguish verified facts from unverified claims
  readonly category: 'education' | 'skill' | 'qualification' | 'achievement' | 'project' | 'work-history';
}

export interface PlanItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly kind: 'learning-activity' | 'project' | 'portfolio-evidence' | 'milestone';
  readonly status: 'planned' | 'in-progress' | 'completed' | 'deferred';
  readonly targetPathwayId?: string;
  readonly tiedGapOrConstruct?: string;
  readonly userConfirmedCompleted?: boolean; // FR-021: distinguish completed user-confirmed actions from suggestions
  readonly isSuggestion?: boolean;
  readonly order: number;
}

export interface EducationEntry {
  readonly degree: string;
  readonly institution: string;
  readonly year?: string;
}

export interface WorkHistoryEntry {
  readonly role: string;
  readonly organization: string;
  readonly period?: string;
  readonly summary?: string;
}

export interface ProjectEntry {
  readonly name: string;
  readonly description: string;
  readonly linkOrArtifact?: string;
}

export interface Profile {
  readonly name: string;
  readonly setting: string;
  readonly careerStage: string;
  readonly email?: string;
  readonly education?: readonly EducationEntry[];
  readonly qualifications?: readonly string[];
  readonly workHistory?: readonly WorkHistoryEntry[];
  readonly skills?: readonly string[];
  readonly projects?: readonly ProjectEntry[];
  readonly achievements?: readonly string[];
  readonly interests?: readonly string[];
  readonly constraints?: readonly string[];
  readonly userEvidence?: readonly UserEvidence[];
  readonly planItems?: readonly PlanItem[];
}

export const SETTING_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'studying', label: 'Studying' },
  { value: 'employed full-time', label: 'Working full-time' },
  { value: 'self-employed', label: 'Self-employed' },
  { value: 'between roles', label: 'Between jobs' },
  { value: 'not working', label: 'Not working' },
];

export const STAGE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'early-career', label: 'Starting out' },
  { value: 'mid-career', label: 'A few years in' },
  { value: 'late-career', label: 'Experienced' },
  { value: 'returning after a break', label: 'Returning' },
];

export function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

const PROFILE_KEY = 'career107.profile';

const DEFAULT_EVIDENCE: readonly UserEvidence[] = [
  {
    id: 'ev-1',
    description: 'Undergraduate Capstone Analysis Repository',
    sourceRef: 'https://github.com/candidate/capstone-analytics',
    dateKnown: '2025-05-15',
    supportedClaim: 'Data analysis and structured reporting methodology',
    verified: true,
    category: 'project',
  },
  {
    id: 'ev-2',
    description: 'Certified Associate Project Coordinator Certificate',
    sourceRef: 'Accreditation Body Record #AP-88419',
    dateKnown: '2024-11-20',
    supportedClaim: 'Project sequencing and coordination fundamentals',
    verified: true,
    category: 'qualification',
  },
  {
    id: 'ev-3',
    description: 'Internal Workshop Facilitation Feedback Note',
    sourceRef: 'Department quarterly peer review summary',
    dateKnown: '2026-02-10',
    supportedClaim: 'Comfort explaining complex technical topics to non-specialists',
    verified: false, // unverified self-supplied document
    category: 'skill',
  },
];

const DEFAULT_PLAN_ITEMS: readonly PlanItem[] = [
  {
    id: 'plan-1',
    title: 'Complete Applied SQL and Exploratory Data Analysis module',
    description: 'Address analytical requirement for data analysis pathway using open public datasets.',
    kind: 'learning-activity',
    status: 'completed',
    targetPathwayId: 'path.data-analysis',
    tiedGapOrConstruct: 'skill.quantitative',
    userConfirmedCompleted: true,
    isSuggestion: false,
    order: 1,
  },
  {
    id: 'plan-2',
    title: 'Publish interactive portfolio case study of previous project',
    description: 'Package findings and methodology into a structured web report to demonstrate depth.',
    kind: 'portfolio-evidence',
    status: 'in-progress',
    targetPathwayId: 'path.data-analysis',
    tiedGapOrConstruct: 'experience.applied-projects',
    userConfirmedCompleted: false,
    isSuggestion: false,
    order: 2,
  },
  {
    id: 'plan-3',
    title: 'Shadow cross-functional technical support handover cycles',
    description: 'Validate diagnostic procedures under interrupt-driven conditions.',
    kind: 'project',
    status: 'planned',
    targetPathwayId: 'path.systems-support',
    tiedGapOrConstruct: 'interest.social',
    userConfirmedCompleted: false,
    isSuggestion: true,
    order: 3,
  },
  {
    id: 'plan-4',
    title: 'Conduct informational interview with Senior Analytics Lead',
    description: 'Discuss day-to-day trade-offs between analysis and decision authority.',
    kind: 'milestone',
    status: 'planned',
    targetPathwayId: 'path.data-analysis',
    userConfirmedCompleted: false,
    isSuggestion: true,
    order: 4,
  },
];

export function loadProfile(): Profile | undefined {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (typeof parsed?.setting === 'string' && typeof parsed?.careerStage === 'string') {
      return {
        name: typeof parsed.name === 'string' ? parsed.name : '',
        setting: parsed.setting,
        careerStage: parsed.careerStage,
        email: parsed.email ?? '',
        education: parsed.education ?? [{ degree: 'B.Sc. Computing & Information Systems', institution: 'International University', year: '2025' }],
        qualifications: parsed.qualifications ?? ['Foundations of Data Analysis', 'Introductory Systems Architecture'],
        workHistory: parsed.workHistory ?? [{ role: 'Junior Operations Analyst', organization: 'Apex Global Logistics', period: '2025 – Present', summary: 'Report generation, process tracking, and team constraint resolution.' }],
        skills: parsed.skills ?? ['Data Analysis', 'Technical Writing', 'Problem Structuring', 'Project Sequencing', 'SQL/Python Basics'],
        projects: parsed.projects ?? [{ name: 'Logistics SLA Monitoring Dashboard', description: 'Real-time bottleneck alerts and performance summaries.', linkOrArtifact: 'internal-portal/sla-dashboard' }],
        achievements: parsed.achievements ?? ['Streamlined weekly delivery report generation time by 40%'],
        interests: parsed.interests ?? ['Data analysis', 'System architecture', 'Clear communication'],
        constraints: parsed.constraints ?? ['Standard weekdays preferred', 'Local commute under 45 minutes'],
        userEvidence: parsed.userEvidence ?? DEFAULT_EVIDENCE,
        planItems: parsed.planItems ?? DEFAULT_PLAN_ITEMS,
      };
    }
  } catch {
    // storage unavailable
  }
  return undefined;
}

export function saveProfile(profile: Profile | undefined): void {
  try {
    if (profile === undefined) window.localStorage.removeItem(PROFILE_KEY);
    else window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length === 0 ? 'ME' : parts.length === 1 ? parts[0]!.slice(0, 2) : parts[0]![0]! + parts.at(-1)![0]!).toUpperCase();
}

/** A stable candidate reference derived from the first recorded observation. */
export function candidateId(view: SessionView): string {
  const first = view.signals[0];
  return first === undefined ? 'Pending' : `#CA-${first.id.slice(4, 8).toUpperCase()}-${first.id.slice(8, 9).toUpperCase()}`;
}

// ----------------------------------------------------------------- answers

export function buildAnswer(item: InstrumentItem, response: CaptureInput['response'], profile: Profile): CaptureInput {
  return {
    instrumentId: item.instrumentId,
    itemRef: item.itemRef,
    response,
    declaredContext: [
      { key: 'setting', value: profile.setting },
      { key: 'careerStage', value: profile.careerStage },
      { key: 'sessionMode', value: 'self-directed (workspace)' },
    ],
    source: { kind: 'instrument-administration', ref: `app://session/${item.itemRef}`, label: 'workspace session' },
    sessionRef: 'session.workspace-1',
  };
}

/** The latest answer per question (a changed answer is a new observation). */
export function latestAnswers(view: SessionView): Map<string, Signal> {
  return new Map(view.signals.map((signal) => [signal.instrument.itemRef, signal]));
}

export function answerText(signal: Signal): string {
  const r = signal.response;
  if (r.kind === 'ordinal') return r.presentedLabels?.[r.rawIndex ?? 0] ?? '—';
  if (r.kind === 'categorical') return (r.selectedLabels ?? []).join(', ');
  return r.text ?? '';
}

export function selectedOptionId(signal: Signal | undefined, item: InstrumentItem): string | undefined {
  const r = signal?.response;
  if (r?.kind === 'categorical') return r.selectedOptionIds?.[0];
  if (r?.kind === 'ordinal') return item.options[r.rawIndex ?? -1]?.id;
  return undefined;
}

/** "Describes me fully (position 1.00)" → "Describes me fully". */
export function plainObservation(value: string): string {
  return value.replace(/ \(position [\d.]+\)$/, '');
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ----------------------------------------------------------------- modules

export const MODULES: readonly { title: string; kinds: readonly string[] }[] = [
  { title: 'Interests & Affinity', kinds: ['interest'] },
  { title: 'Values & Motivation', kinds: ['value', 'motivation'] },
  { title: 'Working Style', kinds: ['work-style', 'preference'] },
  { title: 'Skills & Experience', kinds: ['skill-self-report', 'experience'] },
  { title: 'Context & Constraints', kinds: ['constraint', 'context-condition'] },
];

export function moduleIndex(item: InstrumentItem): number {
  const index = MODULES.findIndex((module) => module.kinds.includes(item.constructs[0]?.kind ?? ''));
  return index < 0 ? MODULES.length - 1 : index;
}

export function batteryOrder(items: readonly InstrumentItem[]): InstrumentItem[] {
  return [...items].sort((a, b) => moduleIndex(a) - moduleIndex(b));
}

export function shortLabel(label: string): string {
  return (
    {
      'Does not describe me': 'Not me',
      'Describes me slightly': 'Slightly',
      'Describes me partly': 'Partly',
      'Describes me mostly': 'Mostly',
      'Describes me fully': 'Fully',
      Consistently: 'Always',
      Sometimes: 'Some',
    }[label] ?? label
  );
}

// ---------------------------------------------------------------- pathways

export function matchPercent(pathway: PathwayCandidate): number {
  const { supported, total } = pathway.supportSummary;
  return total === 0 ? 0 : Math.round((supported / total) * 100);
}

export function byMatch(pathways: readonly PathwayCandidate[]): PathwayCandidate[] {
  return [...pathways].sort((a, b) => matchPercent(b) - matchPercent(a));
}

export const FAMILY_ICON: Record<string, string> = {
  analysis: 'query_stats',
  building: 'architecture',
  operations: 'support_agent',
  coordination: 'account_tree',
  people: 'groups',
  physical: 'construction',
};

export function strengths(view: SessionView, items: readonly InstrumentItem[]): { label: string; percent: number }[] {
  const answers = latestAnswers(view);
  return items
    .map((item) => ({ item, response: answers.get(item.itemRef)?.response }))
    .filter(({ item, response }) => response?.kind === 'ordinal' && moduleIndex(item) < 4)
    .map(({ item, response }) => ({ label: item.constructs[0]?.label ?? item.itemRef, percent: Math.round((response?.position ?? 0) * 100) }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
}

export const STATUSES: readonly RequirementStatus[] = ['supported', 'gap', 'conflicting', 'undetermined'];

export const STATUS_TEXT: Record<RequirementStatus, { short: string; long: string; icon: string }> = {
  supported: { short: 'Met', long: 'Matches your answers', icon: 'check_circle' },
  gap: { short: 'Not met', long: "Doesn't match your answers", icon: 'cancel' },
  conflicting: { short: 'Mixed', long: 'Your answers point both ways', icon: 'contrast' },
  undetermined: { short: 'Open', long: 'Not enough information yet', icon: 'pending' },
};

export function plainReason(requirement: PathwayRequirement): string {
  const { status, kind, rationale, observations } = requirement;
  if (kind === 'constraint') return rationale;
  if (status === 'undetermined') {
    if (observations.length === 0) return "None of your answers covers this yet, so it can't be read either way.";
    if (rationale.startsWith('Every observation')) return "Your answer can't be read for this yet — for example, part of your situation is missing.";
    return "Your answer was in the middle of the scale, so it doesn't point either way.";
  }
  if (status === 'conflicting') return "You answered related questions in opposite ways. That can happen when your situation is changing; the app doesn't pick one for you.";
  if (rationale.includes('only asks whether it is present')) return 'You answered this, and this direction only needs to know it has been considered.';
  const expectsLow = rationale.includes('expects a low reading');
  if (status === 'supported') {
    return expectsLow ? 'This direction suits a lower answer here, and yours was low.' : 'Your answer was at the strong end of the scale, which is what this direction looks for.';
  }
  return expectsLow ? 'This direction suits a lower answer here, but yours was high.' : 'Your answer was at the low end of the scale, while this direction usually needs more of it.';
}

export const DECISIONS: readonly { state: Exclude<ReviewState, 'unreviewed'>; kind: string; label: string; hint: string }[] = [
  { state: 'pursuing', kind: 'pursue-pathway', label: 'Pursue', hint: 'Actively targeting this direction' },
  { state: 'interesting', kind: 'explore-pathway', label: 'Explore', hint: 'Exploring requirements & skills' },
  { state: 'deferred', kind: 'defer-pathway', label: 'Deferred', hint: 'Revisit at a later stage' },
  { state: 'not-a-fit', kind: 'dismiss-pathway', label: 'Dismissed', hint: 'Does not fit preferences/constraints' },
];

export function decisionLabel(stateOrKind: string): string | undefined {
  return DECISIONS.find((decision) => decision.state === stateOrKind || decision.kind === stateOrKind)?.label;
}

// ---------------------------------------------------------------- export helpers (FR-022, FR-023)

export function exportDossierJson(view: SessionView, profile: Profile): void {
  const exportPayload = {
    exportVersion: '2.0.0',
    exportedAt: new Date().toISOString(),
    application: 'Career Assessment 107 V2 Desktop Workspace',
    candidate: {
      name: profile.name,
      setting: profile.setting,
      careerStage: profile.careerStage,
      email: profile.email,
      education: profile.education,
      workHistory: profile.workHistory,
      skills: profile.skills,
      projects: profile.projects,
    },
    userEvidence: profile.userEvidence,
    developmentPlan: profile.planItems,
    projection: view.projection,
    pathwaySets: view.pathwaySets,
    decisions: view.decisions,
    corrections: view.corrections,
    signalsCount: view.signals.length,
    userAuthorityStatement: 'This dossier is assembled from user observations. It contains no scalar ranking score and guarantees no employment or salary outcome.',
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `career-assessment-107-dossier-${profile.name.toLowerCase().replace(/\s+/g, '-') || 'candidate'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDossierMarkdown(view: SessionView, profile: Profile): void {
  const latestSet = view.pathwaySets[view.pathwaySets.length - 1];
  const pathways = latestSet?.pathways ?? [];

  let md = `# Career Assessment 107 V2 — Career Intelligence Dossier\n\n`;
  md += `**Candidate:** ${profile.name || 'Anonymous'}\n`;
  md += `**Career Stage:** ${labelFor(STAGE_OPTIONS, profile.careerStage)}\n`;
  md += `**Current Situation:** ${labelFor(SETTING_OPTIONS, profile.setting)}\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n`;
  md += `**Framework:** Career Assessment 107 (A, E, C) | U\n\n`;
  md += `> **Product Principle:** User Agency (the user decides). This report contains explainable criterion-referenced findings, not automated hiring or scalar collapse fit scores.\n\n`;

  md += `## 1. Candidate Evidence Profile\n\n`;
  if (profile.userEvidence && profile.userEvidence.length > 0) {
    md += `| Evidence Item | Category | Source / Reference | Verified Status |\n`;
    md += `| --- | --- | --- | --- |\n`;
    for (const ev of profile.userEvidence) {
      md += `| ${ev.description} | ${ev.category} | ${ev.sourceRef} | ${ev.verified ? 'Verified Record' : 'User Self-Report'} |\n`;
    }
  } else {
    md += `_No evidence items attached._\n`;
  }
  md += `\n`;

  md += `## 2. Plausible Career Directions\n\n`;
  for (const p of pathways) {
    md += `### ${p.name} (${p.family.toUpperCase()})\n`;
    md += `**User Decision:** ${p.review.state.toUpperCase()}\n`;
    md += `**Support Summary:** ${p.supportSummary.supported} met / ${p.supportSummary.gap} gaps / ${p.supportSummary.undetermined} undetermined / ${p.supportSummary.total} total\n\n`;
    md += `${p.description}\n\n`;
    md += `#### Key Requirements:\n`;
    for (const req of p.requirements) {
      md += `- **${req.statement}** (${req.status.toUpperCase()}): ${req.rationale}\n`;
    }
    md += `\n`;
  }

  md += `## 3. Development Plan\n\n`;
  if (profile.planItems && profile.planItems.length > 0) {
    for (const item of profile.planItems) {
      md += `- [${item.status === 'completed' ? 'x' : ' '}] **${item.title}** (${item.kind.replace('-', ' ')}) — Status: ${item.status.toUpperCase()}${item.userConfirmedCompleted ? ' [User Confirmed]' : ''}\n`;
      if (item.description) md += `  _${item.description}_\n`;
    }
  } else {
    md += `_No development plan items created yet._\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `career-dossier-${profile.name.toLowerCase().replace(/\s+/g, '-') || 'candidate'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
