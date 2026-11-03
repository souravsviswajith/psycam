/**
 * server/domain.ts — Node.js implementation of Career Assessment 107 domain engine.
 * Faithfully mirrors the Go domain model: (A, E, C) | U representations,
 * criterion-referenced pathway mapping, uncertainty profiling, and invariant checks.
 */

import crypto from 'node:crypto';
import type {
  Catalog,
  InstrumentItem,
  CapabilityContract,
  InvariantDescriptor,
  Signal,
  Representation1to3,
  RenderedRepresentation,
  PathwayCandidate,
  PathwaySet,
  SessionView,
  CaptureInput,
  ReviewState,
  UserDecisionRecord,
  CorrectionRecord,
  ProposalRecord,
  EvidenceRecord,
  UncertaintyNote,
  UncertaintyProfile,
  CareerContext,
  ContextField,
  DecisionSummary,
  RuntimeProjection,
} from '../src/api/types.ts';

export const SubjectID = 'sub_web-session';
export const SubjectLabel = 'This session (subject sub_web-session)';
export const SessionRuntime = 'career107-runtime.web';
export const SelfDescriptionInstrumentID = 'instrument.self-description';
export const selfDescriptionVersion = '0.2.0';
export const itemVersion = '1.0.0';

const likertAgreement = [
  { id: 'opt.not-like-me', label: 'Does not describe me' },
  { id: 'opt.slightly', label: 'Describes me slightly' },
  { id: 'opt.partly', label: 'Describes me partly' },
  { id: 'opt.mostly', label: 'Describes me mostly' },
  { id: 'opt.fully', label: 'Describes me fully' },
];

const frequency5 = [
  { id: 'opt.never', label: 'Never' },
  { id: 'opt.rarely', label: 'Rarely' },
  { id: 'opt.sometimes', label: 'Sometimes' },
  { id: 'opt.often', label: 'Often' },
  { id: 'opt.consistently', label: 'Consistently' },
];

const itemLimits = [
  'Self-report at a single sitting; reflects the user’s account of themselves at that moment.',
  'No validation evidence is recorded for this item in this deployment.',
];

const constructDict: Record<string, { label: string; kind: string }> = {
  'interest.analysis': { label: 'Analytical interest', kind: 'interest' },
  'interest.creation': { label: 'Generative and creative interest', kind: 'interest' },
  'interest.social': { label: 'People and social focus', kind: 'interest' },
  'interest.organisation': { label: 'Planning and coordination interest', kind: 'interest' },
  'interest.building': { label: 'Physical and practical construction', kind: 'interest' },
  'interest.explanation': { label: 'Instruction and clarification interest', kind: 'interest' },
  'value.autonomy': { label: 'Autonomy in execution', kind: 'value' },
  'value.impact': { label: 'Direct user and human consequence', kind: 'value' },
  'value.stability': { label: 'Predictability and security preference', kind: 'value' },
  'value.growth': { label: 'Learning and progressive capability', kind: 'value' },
  'style.structure-preference': { label: 'Preference for defined procedure', kind: 'work-style' },
  'style.collaboration': { label: 'Conversational and team orientation', kind: 'work-style' },
  'style.depth': { label: 'Domain specialization preference', kind: 'work-style' },
  'skill.writing': { label: 'Written technical communication', kind: 'skill-self-report' },
  'skill.quantitative': { label: 'Numerical interpretation comfort', kind: 'skill-self-report' },
  'skill.tooling': { label: 'Software tooling proficiency', kind: 'skill-self-report' },
  'skill.facilitation': { label: 'Group facilitation capability', kind: 'skill-self-report' },
  'experience.applied-projects': { label: 'Demonstrated project delivery', kind: 'experience' },
  'constraint.schedule': { label: 'Declared schedule availability', kind: 'constraint' },
  'constraint.geography': { label: 'Declared geographic mobility', kind: 'constraint' },
};

function mustConstruct(id: string) {
  const meta = constructDict[id] ?? { label: id, kind: 'general' };
  return {
    constructId: id,
    label: meta.label,
    kind: meta.kind,
    taxonomyRef: 'taxonomy.career107',
    taxonomyVersion: '0.1.0',
  };
}

function likertItem(itemRef: string, promptText: string, constructID: string): InstrumentItem {
  return {
    instrumentId: SelfDescriptionInstrumentID,
    instrumentVersion: selfDescriptionVersion,
    itemRef,
    itemVersion,
    promptText,
    responseShape: 'likert-5',
    options: likertAgreement,
    constructs: [mustConstruct(constructID)],
    validated: false,
    limitations: itemLimits,
  };
}

function frequencyItem(itemRef: string, promptText: string, constructID: string): InstrumentItem {
  return {
    instrumentId: SelfDescriptionInstrumentID,
    instrumentVersion: selfDescriptionVersion,
    itemRef,
    itemVersion,
    promptText,
    responseShape: 'frequency-5',
    options: frequency5,
    constructs: [mustConstruct(constructID)],
    validated: false,
    limitations: itemLimits,
  };
}

export const ALL_ITEMS: InstrumentItem[] = [
  likertItem('itm-selfdesc-analysis-1', 'Working through a problem until the pattern becomes clear is satisfying to me.', 'interest.analysis'),
  likertItem('itm-selfdesc-creation-1', 'I like making things that did not exist before, whether physical or digital.', 'interest.creation'),
  likertItem('itm-selfdesc-social-1', 'Work that consists mainly of other people’s questions and needs holds my attention.', 'interest.social'),
  likertItem('itm-selfdesc-organisation-1', 'I enjoy putting scattered pieces of work into a plan other people can follow.', 'interest.organisation'),
  likertItem('itm-selfdesc-building-1', 'I prefer work where I can handle tools, equipment, or physical material.', 'interest.building'),
  likertItem('itm-selfdesc-explanation-1', 'Explaining something until someone else understands it is worth the effort to me.', 'interest.explanation'),
  likertItem('itm-selfdesc-autonomy-1', 'I need to decide how my own work is done, not only what is delivered.', 'value.autonomy'),
  likertItem('itm-selfdesc-impact-1', 'I would rather see the consequences of my work on people than on charts.', 'value.impact'),
  likertItem('itm-selfdesc-stability-1', 'Predictable conditions matter to me more than the size of the opportunity.', 'value.stability'),
  likertItem('itm-selfdesc-growth-1', 'I want each year of work to leave me more capable than the last.', 'value.growth'),
  likertItem('itm-selfdesc-structure-1', 'I do better with a defined set of tasks than with an open brief.', 'style.structure-preference'),
  likertItem('itm-selfdesc-collaboration-1', 'I do my best work in conversation with other people.', 'style.collaboration'),
  likertItem('itm-selfdesc-depth-1', 'I would rather go deep in one area than stay broadly involved.', 'style.depth'),
  likertItem('itm-skill-writing-1', 'Writing is a reliable way for me to convey a complicated point.', 'skill.writing'),
  likertItem('itm-skill-quantitative-1', 'I am comfortable drawing conclusions from numbers.', 'skill.quantitative'),
  frequencyItem('itm-experience-projects-1', 'In the last two years, how often have you carried a piece of work through to a finished outcome?', 'experience.applied-projects'),
  {
    instrumentId: SelfDescriptionInstrumentID,
    instrumentVersion: selfDescriptionVersion,
    itemRef: 'itm-context-availability-1',
    itemVersion,
    promptText: 'Which working pattern actually fits your life right now?',
    responseShape: 'single-select',
    options: [
      { id: 'opt.standard-weekdays', label: 'Standard weekdays' },
      { id: 'opt.shift-rotating', label: 'Shift or rotating pattern' },
      { id: 'opt.evenings-weekends', label: 'Evenings and weekends only' },
      { id: 'opt.irregular', label: 'Irregular and unpredictable' },
      { id: 'opt.fully-flexible', label: 'Fully flexible' },
    ],
    constructs: [mustConstruct('constraint.schedule')],
    validated: false,
    limitations: ['Availability is a declared condition of the user’s situation, not a capability or preference assessment.'],
  },
  {
    instrumentId: SelfDescriptionInstrumentID,
    instrumentVersion: selfDescriptionVersion,
    itemRef: 'itm-context-mobility-1',
    itemVersion,
    promptText: 'How far can you realistically travel for work?',
    responseShape: 'single-select',
    options: [
      { id: 'opt.remote-only', label: 'Remote only' },
      { id: 'opt.local', label: 'Local commute, under 45 minutes' },
      { id: 'opt.regional', label: 'Regional, up to 90 minutes' },
      { id: 'opt.relocate-national', label: 'Willing to relocate within the country' },
      { id: 'opt.relocate-international', label: 'Open to international relocation' },
    ],
    constructs: [mustConstruct('constraint.geography')],
    validated: false,
    limitations: ['Travelled distance is recorded as a mobility band; residence is not recorded or inferred.'],
  },
  {
    instrumentId: SelfDescriptionInstrumentID,
    instrumentVersion: selfDescriptionVersion,
    itemRef: 'itm-narrative-work-1',
    itemVersion,
    promptText: 'Describe one piece of work you would gladly do again, and say what made it worth doing.',
    responseShape: 'open-text',
    options: [],
    constructs: [mustConstruct('experience.applied-projects')],
    validated: false,
    limitations: [
      'Free-text responses are open to multiple readings; any extraction from them is a proposal, not an observation.',
      ...itemLimits,
    ],
  },
];

export const CAPABILITY_CONTRACTS: CapabilityContract[] = [
  {
    id: 'career.assessment.decompose-1to3',
    requiredScopes: ['representation.decompose', 'records.write'],
    requiresModel: false,
    transformationRef: 'transformation.decompose-1to3@1.0.0',
    userBoundary: 'Decomposition never evaluates the observation: it produces (A, E, C) and uncertainty, and no conclusion about the person.',
  },
  {
    id: 'career.assessment.map-pathways',
    requiredScopes: ['pathway.map', 'records.write'],
    requiresModel: false,
    transformationRef: 'transformation.map-pathways@1.0.0',
    userBoundary: 'Mapping produces alternative pathway information only. It never ranks, never selects, and never states a recommendation.',
  },
  {
    id: 'career.assessment.propose-questions',
    requiredScopes: ['proposal.generate'],
    requiresModel: true,
    userBoundary: 'Proposed questions are shown to the user for review. They do not become assessments, they do not carry evidence, and the user decides whether to answer them.',
  },
  {
    id: 'career.assessment.explain-representation',
    requiredScopes: ['representation.explain'],
    requiresModel: true,
    userBoundary: 'Explanation restates the representation. It may not introduce new assessment claims or a career conclusion.',
  },
];

export const CONTRACT_VERSIONS = [
  { name: 'domain', version: '0.1.0' },
  { name: 'representation', version: '1.3.0' },
  { name: 'uncertainty', version: '1.0.0' },
  { name: 'pathway', version: '1.0.0' },
  { name: 'runtime', version: '0.1.0' },
];

export const INVARIANT_DESCRIPTORS: InvariantDescriptor[] = [
  { id: 'INV.IDENTITY.CARRIED', statement: 'A.id = E.id = C.id = SignalId: identity is carried through the transformation, never re-minted.', scope: 'representation', mandatory: true },
  { id: 'INV.EVIDENCE.PRIMARY', statement: 'Every observation has exactly one primary evidence record, and every derived record has lineage.', scope: 'signal', mandatory: true },
  { id: 'INV.EVIDENCE.PROMOTED-CLAIM', statement: 'A promoted claim carries a non-null evidence reference; an unsupported claim is refused.', scope: 'signal', mandatory: true },
  { id: 'INV.UNCERTAINTY.PRESERVED', statement: 'Uncertainty is preserved through transformations: output notes are a superset of input notes.', scope: 'transformation', mandatory: true },
  { id: 'INV.NO-SCALAR-CAREER-QUANTITY', statement: 'No representation, record, or pathway collapses (A, E, C, U) into a scalar career quantity.', scope: 'representation', mandatory: true },
  { id: 'INV.PATHWAY.SUPPORT', statement: 'Every pathway candidate references the representations and transformations that support it.', scope: 'pathway', mandatory: true },
  { id: 'INV.PATHWAY.NO-RANK', statement: 'Pathway sets carry no total ordering, no hidden score, and no single "best career".', scope: 'pathway', mandatory: true },
  { id: 'INV.PATHWAY.USER-AUTHORITY', statement: 'Pathway review state is set by the user (0); the system records but never assigns a decision.', scope: 'pathway', mandatory: true },
  { id: 'INV.VERSION.NON-DESTRUCTIVE', statement: 'Historical representations are versioned, never silently mutated.', scope: 'records', mandatory: true },
  { id: 'INV.MODEL.AUDITABLE', statement: 'Model-dependent transformations record provider, model, model version, instruction version, input ref, output ref, uncertainty, and transformation version.', scope: 'transformation', mandatory: true },
  { id: 'INV.INPUT.SIZE-LIMIT', statement: 'Assessment input is bounded and treated as data; no assessment input is executed.', scope: 'signal', mandatory: true },
  { id: 'INV.UI.NOT-TRUTH', statement: 'The UI projects domain state; it does not define it.', scope: 'ui', mandatory: false },
];

export const UNCERTAINTY_CODES = [
  'U-SELF-REPORT-BIAS',
  'U-INSTRUMENT-UNVALIDATED',
  'U-METHOD-LIMITED',
  'U-CONTEXT-UNDECLARED',
  'U-STALE-OBSERVATION',
  'U-RESPONSE-AMBIGUOUS',
  'U-RESPONSE-MISSING',
  'U-TRANSFORMATION-LOSS',
  'U-CONTEXT-CONFLICT',
];

export const FORBIDDEN_SCORE_KEYS = [
  'careerscore',
  'careerpoints',
  'fitscore',
  'matchscore',
  'matchpercent',
  'overallscore',
  'compatibilityscore',
  'suitabilityscore',
  'aptitudescore',
  'potentialscore',
  'readinessscore',
  'weightedscore',
  'compositescore',
  'rank',
  'ranking',
  'bestcareer',
  'topcareer',
  'recommendedcareer',
  'careerrecommendation',
  'fitpercentage',
];

export const DEFAULT_MAPPING_POLICY = {
  id: 'policy.pathway-mapping.criterion-referenced.v1',
  version: '1.0.0',
  highBand: 0.66,
  lowBand: 0.34,
  blockingCodes: ['U-RESPONSE-MISSING', 'U-RESPONSE-AMBIGUOUS'],
  requiredContextKeys: ['setting', 'careerStage'],
  blockingLevel: 'moderate',
  statement: 'Each requirement is read against the user’s own observations using fixed criterion bands. A band reading is a criterion-referenced statement about one observation, not a measurement of fit, not a probability, and not comparable across pathways as a score.',
};

export const USER_AUTHORITY_STATEMENT =
  'This is pathway information assembled from your own observations. It is not a recommendation and it does not make your decision: you decide which direction, if any, to pursue.';

export const NO_SCALAR_COLLAPSE_STATEMENT =
  '1 observation does not imply 1 career conclusion: representations are (A, E, C) with cross-cutting U.';

// ---------------------------------------------------------------- Templates
export interface PathwayTemplate {
  readonly pathwayId: string;
  readonly name: string;
  readonly family: string;
  readonly description: string;
  readonly requirements: readonly {
    readonly requirementId: string;
    readonly constructId: string;
    readonly constructKind: string;
    readonly statement: string;
    readonly kind: 'alignment' | 'constraint' | 'experience';
    readonly direction?: 'high' | 'low' | 'any';
    readonly constraintAllowedOptions?: readonly string[];
    readonly constraintOptionOrder?: readonly string[];
    readonly constraintMinRank?: number;
  }[];
  readonly entryRoutes: readonly string[];
  readonly tradeoffs: readonly { readonly statement: string; readonly costsWhat: string }[];
  readonly openQuestions: readonly string[];
  readonly sourceRef: string;
  readonly restrictedUse: readonly string[];
}

const templateSource = 'project-template:career107.pathway-catalogue@0.1.0';
const mobilityOrder = ['opt.remote-only', 'opt.local', 'opt.regional', 'opt.relocate-national', 'opt.relocate-international'];
const allAvailability = ['opt.standard-weekdays', 'opt.shift-rotating', 'opt.evenings-weekends', 'opt.irregular', 'opt.fully-flexible'];

export const PATHWAY_CATALOGUE: readonly PathwayTemplate[] = [
  {
    pathwayId: 'path.data-analysis',
    name: 'Data analysis and reporting',
    family: 'analysis',
    description: 'Turning collected information into readings other people can act on: cleaning, examining, and reporting data in an organisational setting.',
    requirements: [
      { requirementId: 'req.data-analysis.interest', constructId: 'interest.analysis', constructKind: 'interest', statement: 'Reported interest in examining information for patterns.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.data-analysis.quantitative', constructId: 'skill.quantitative', constructKind: 'skill-self-report', statement: 'Self-reported comfort drawing conclusions from numbers.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.data-analysis.structure', constructId: 'style.structure-preference', constructKind: 'work-style', statement: 'Tolerance for defined, repeatable analytical procedure.', kind: 'alignment', direction: 'any' },
      { requirementId: 'req.data-analysis.availability', constructId: 'constraint.schedule', constructKind: 'constraint', statement: 'Availability consistent with scheduled reporting cycles.', kind: 'constraint', constraintAllowedOptions: ['opt.standard-weekdays', 'opt.fully-flexible', 'opt.evenings-weekends'] },
    ],
    entryRoutes: [
      'Internal move from a role that already produces data (operations, support, finance administration).',
      'Structured short course in data handling, followed by a portfolio of analyses on your own or public datasets.',
      'Assistant or junior analyst posting that accepts adjacent experience.',
    ],
    tradeoffs: [
      { statement: 'Analytical work is often adjacent to decisions rather than making them.', costsWhat: 'Visible authority over outcomes.' },
      { statement: 'Reporting deadlines recur on a fixed cycle.', costsWhat: 'Spontaneity in how the week is shaped.' },
    ],
    openQuestions: [
      'Would you rather define the questions or answer the questions someone else defined?',
      'How do you feel about cleaning data as most of the work?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['The template describes a direction, not an opening: it says nothing about current vacancies, pay, or regional demand.'],
  },
  {
    pathwayId: 'path.software-engineering',
    name: 'Software engineering',
    family: 'building',
    description: 'Designing and maintaining software systems, usually in a team, with continuing maintenance responsibilities.',
    requirements: [
      { requirementId: 'req.software.creation', constructId: 'interest.creation', constructKind: 'interest', statement: 'Reported interest in producing artifacts that did not exist before.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.software.depth', constructId: 'style.depth', constructKind: 'work-style', statement: 'Willingness to go deep in one technical area.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.software.tooling', constructId: 'skill.tooling', constructKind: 'skill-self-report', statement: 'Self-reported capability with software tools.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.software.collaboration', constructId: 'style.collaboration', constructKind: 'work-style', statement: 'Work is normally reviewed and negotiated with other people.', kind: 'alignment', direction: 'any' },
    ],
    entryRoutes: [
      'Self-directed build record plus a structured curriculum in fundamentals.',
      'Apprenticeship, conversion programme, or entry-level engineering role open to adjacent experience.',
      'Adjacent move from support, testing, or operations work into a team that already knows you.',
    ],
    tradeoffs: [
      { statement: 'Maintenance of existing systems occupies much of the work.', costsWhat: 'Time spent on new construction.' },
      { statement: 'Technical depth is rewarded slowly and unevenly early on.', costsWhat: 'Immediate recognition.' },
    ],
    openQuestions: [
      'Do you want to own systems over years, or build and hand over?',
      'How do you respond to work that is mostly reading existing code?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Self-reported tooling capability is unverified: a coding exercise is the only way to establish it, and this system does not administer one.'],
  },
  {
    pathwayId: 'path.systems-support',
    name: 'IT systems and support',
    family: 'operations',
    description: 'Keeping technical systems working for the people who depend on them, with a strong diagnostic and service component.',
    requirements: [
      { requirementId: 'req.support.social', constructId: 'interest.social', constructKind: 'interest', statement: 'Reported interest in work centred on other people’s immediate needs.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.support.analysis', constructId: 'interest.analysis', constructKind: 'interest', statement: 'Reported interest in diagnosing causes rather than symptoms.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.support.explanation', constructId: 'interest.explanation', constructKind: 'interest', statement: 'Reported interest in explaining technical matters to non-specialists.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.support.availability', constructId: 'constraint.schedule', constructKind: 'constraint', statement: 'Availability compatible with service coverage patterns.', kind: 'constraint', constraintAllowedOptions: allAvailability },
    ],
    entryRoutes: [
      'Service desk or first-line support role with structured escalation paths.',
      'Certification route in a specific platform you already use.',
      'Internal transfer from a non-technical role in an organisation with a support function.',
    ],
    tradeoffs: [
      { statement: 'Work is interrupt-driven and prioritised by other people.', costsWhat: 'Control over the shape of the day.' },
      { statement: 'Service targets are explicit and measured.', costsWhat: 'Freedom from external metrics.' },
    ],
    openQuestions: [
      'How do you feel about being interrupted mid-task several times an hour?',
      'Do you want to fix the symptom quickly or find the cause slowly?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Template covers service-oriented support; it does not cover engineering-grade infrastructure work.'],
  },
  {
    pathwayId: 'path.product-coordination',
    name: 'Product and project coordination',
    family: 'coordination',
    description: 'Coordinating what gets built and in which order, typically between users, technical teams, and commercial constraints.',
    requirements: [
      { requirementId: 'req.product.organisation', constructId: 'interest.organisation', constructKind: 'interest', statement: 'Reported interest in sequencing and coordinating work.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.product.collaboration', constructId: 'style.collaboration', constructKind: 'work-style', statement: 'Work happens through conversation and negotiation.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.product.facilitation', constructId: 'skill.facilitation', constructKind: 'skill-self-report', statement: 'Self-reported capability guiding groups toward a decision.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.product.impact', constructId: 'value.impact', constructKind: 'value', statement: 'Importance placed on visible consequence for users.', kind: 'alignment', direction: 'high' },
    ],
    entryRoutes: [
      'Associate product or project coordination role inside an existing delivery team.',
      'Move from delivery, support, or analysis work where you already coordinate informally.',
      'Structured programme with a placement in a coordinating role.',
    ],
    tradeoffs: [
      { statement: 'Accountability is often broader than direct authority.', costsWhat: 'The ability to decide alone.' },
      { statement: 'Attention is divided across several workstreams at once.', costsWhat: 'Long uninterrupted depth.' },
    ],
    openQuestions: [
      'How do you respond when you are accountable for work you cannot direct?',
      'Would you rather hold the plan or hold the craft?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Coordination requirements vary widely by organisation; the template states a common shape, not a standard.'],
  },
  {
    pathwayId: 'path.research-evaluation',
    name: 'Research and evaluation',
    family: 'analysis',
    description: 'Designing studies or evaluations, collecting evidence, and reporting what the evidence can and cannot support.',
    requirements: [
      { requirementId: 'req.research.analysis', constructId: 'interest.analysis', constructKind: 'interest', statement: 'Reported interest in examining evidence for patterns.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.research.writing', constructId: 'skill.writing', constructKind: 'skill-self-report', statement: 'Self-reported capability conveying a complicated point in writing.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.research.depth', constructId: 'style.depth', constructKind: 'work-style', statement: 'Sustained engagement with one question over months.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.research.applied', constructId: 'experience.applied-projects', constructKind: 'experience', statement: 'Track record of carrying an enquiry through to a written outcome.', kind: 'experience', direction: 'high' },
    ],
    entryRoutes: [
      'Research assistant or evaluation officer role within an organisation or funded project.',
      'Postgraduate route in a relevant method discipline.',
      'Move from data analysis into a team that designs its own studies.',
    ],
    tradeoffs: [
      { statement: 'Findings frequently cannot support the conclusion the commissioner wants.', costsWhat: 'The comfort of a clean answer.' },
      { statement: 'Work is often fixed-term and funding-dependent.', costsWhat: 'Continuity.' },
    ],
    openQuestions: [
      'How do you feel about publishing a result that says "we cannot tell"?',
      'Do you want to design the study or execute a design someone else made?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Formal research routes commonly require credentials this system does not assess or verify.'],
  },
  {
    pathwayId: 'path.teaching-training',
    name: 'Teaching and training',
    family: 'people',
    description: 'Designing and delivering instruction, and assessing whether understanding was actually transferred.',
    requirements: [
      { requirementId: 'req.teaching.explanation', constructId: 'interest.explanation', constructKind: 'interest', statement: 'Reported interest in explaining until someone understands.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.teaching.social', constructId: 'interest.social', constructKind: 'interest', statement: 'Reported interest in work centred on other people.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.teaching.facilitation', constructId: 'skill.facilitation', constructKind: 'skill-self-report', statement: 'Self-reported capability holding a group’s attention and participation.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.teaching.availability', constructId: 'constraint.schedule', constructKind: 'constraint', statement: 'Availability compatible with fixed session timetables.', kind: 'constraint', constraintAllowedOptions: ['opt.standard-weekdays', 'opt.shift-rotating', 'opt.evenings-weekends', 'opt.fully-flexible'] },
    ],
    entryRoutes: [
      'Instructional or training role in an organisation that already delivers training internally.',
      'Qualified teaching route with a placement component.',
      'Freelance or platform-based instruction built from existing subject expertise.',
    ],
    tradeoffs: [
      { statement: 'Delivery is scheduled and repeated.', costsWhat: 'Variety in the working week.' },
      { statement: 'Outcomes depend on other people’s effort.', costsWhat: 'A direct link between your work and the result.' },
    ],
    openQuestions: [
      'Do you want to work with children, adults, or professionals?',
      'How do you feel about repeating the same material many times per year?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Regulated teaching contexts impose credential requirements that this system neither checks nor represents.'],
  },
  {
    pathwayId: 'path.operations-coordination',
    name: 'Operations and logistics coordination',
    family: 'operations',
    description: 'Keeping a physical or service operation running: scheduling, sequencing, and resolving constraints as they appear.',
    requirements: [
      { requirementId: 'req.ops.organisation', constructId: 'interest.organisation', constructKind: 'interest', statement: 'Reported interest in planning and sequencing.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.ops.structure', constructId: 'style.structure-preference', constructKind: 'work-style', statement: 'Comfort with defined procedures and measurable service levels.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.ops.availability', constructId: 'constraint.schedule', constructKind: 'constraint', statement: 'Availability compatible with shift or rotating coverage.', kind: 'constraint', constraintAllowedOptions: allAvailability },
      { requirementId: 'req.ops.mobility', constructId: 'constraint.geography', constructKind: 'constraint', statement: 'Able to attend a physical site.', kind: 'constraint', constraintOptionOrder: mobilityOrder, constraintMinRank: 1 },
    ],
    entryRoutes: [
      'Coordinator or scheduler role in a depot, clinic, warehouse, or service centre.',
      'Move from front-line operational work into planning.',
      'Team-leader route inside an operation you already know.',
    ],
    tradeoffs: [
      { statement: 'Escalations arrive at the least convenient moment.', costsWhat: 'Predictability of the working day.' },
      { statement: 'Success is often invisible when nothing goes wrong.', costsWhat: 'Recognition.' },
    ],
    openQuestions: [
      'Do you want to optimise a running operation or design a new one?',
      'How do you handle a constraint that cannot be met?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Physical-site requirements vary by employer; the template states a common pattern only.'],
  },
  {
    pathwayId: 'path.creative-production',
    name: 'Creative production',
    family: 'building',
    description: 'Producing designed or media artifacts to a brief, usually against deadlines and with review cycles.',
    requirements: [
      { requirementId: 'req.creative.creation', constructId: 'interest.creation', constructKind: 'interest', statement: 'Reported interest in producing artifacts.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.creative.autonomy', constructId: 'value.autonomy', constructKind: 'value', statement: 'Importance of directing how the work is done.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.creative.resilience', constructId: 'style.structure-preference', constructKind: 'work-style', statement: 'Capacity to work against a brief that is not yours.', kind: 'alignment', direction: 'low' },
      { requirementId: 'req.creative.depth', constructId: 'style.depth', constructKind: 'work-style', statement: 'Specialisation in one medium or discipline.', kind: 'alignment', direction: 'any' },
    ],
    entryRoutes: [
      'Portfolio-led entry: a body of work that demonstrates range and reliability.',
      'Assistant or junior role inside a studio, agency, or production team.',
      'Commission-by-commission freelance route alongside other income.',
    ],
    tradeoffs: [
      { statement: 'Income is often irregular, particularly early.', costsWhat: 'Financial predictability.' },
      { statement: 'Client feedback can override your judgment on the work.', costsWhat: 'Authorial control.' },
    ],
    openQuestions: [
      'Can you separate your judgment of the work from your judgment of yourself?',
      'How much of your output are you willing to produce to someone else’s brief?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Portfolio quality is the decisive factor in this direction and this system does not evaluate portfolios.'],
  },
  {
    pathwayId: 'path.trades-maintenance',
    name: 'Trades and maintenance',
    family: 'physical',
    description: 'Inspection, repair, and installation work on physical systems, frequently at customer sites.',
    requirements: [
      { requirementId: 'req.trades.building', constructId: 'interest.building', constructKind: 'interest', statement: 'Reported interest in working with tools, equipment, or material.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.trades.experience', constructId: 'experience.applied-projects', constructKind: 'experience', statement: 'Track record of finishing practical work.', kind: 'experience', direction: 'high' },
      { requirementId: 'req.trades.mobility', constructId: 'constraint.geography', constructKind: 'constraint', statement: 'Able to travel to sites.', kind: 'constraint', constraintOptionOrder: mobilityOrder, constraintMinRank: 1 },
      { requirementId: 'req.trades.availability', constructId: 'constraint.schedule', constructKind: 'constraint', statement: 'Availability compatible with early starts and call-out work.', kind: 'constraint', constraintAllowedOptions: allAvailability },
    ],
    entryRoutes: [
      'Apprenticeship with a licensed practitioner.',
      'Technician role with structured on-the-job training.',
      'Government or sector skills programme with a certification endpoint.',
    ],
    tradeoffs: [
      { statement: 'Physical demands accumulate over a career.', costsWhat: 'Long-term physical capacity.' },
      { statement: 'Certification and licensing gates progress.', costsWhat: 'Time before independent practice.' },
    ],
    openQuestions: [
      'Do you want to work in customers’ homes and businesses?',
      'How do you feel about certification requirements before you can work independently?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Licensing requirements are jurisdiction-specific and are not represented here.'],
  },
  {
    pathwayId: 'path.customer-facing-services',
    name: 'Customer-facing services',
    family: 'people',
    description: 'Front-line work where the primary output is how another person was handled: service, sales support, care-adjacent reception and advice roles.',
    requirements: [
      { requirementId: 'req.front.social', constructId: 'interest.social', constructKind: 'interest', statement: 'Reported interest in work centred on other people.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.front.explanation', constructId: 'interest.explanation', constructKind: 'interest', statement: 'Reported willingness to explain and clarify repeatedly.', kind: 'alignment', direction: 'high' },
      { requirementId: 'req.front.stability', constructId: 'value.stability', constructKind: 'value', statement: 'Importance of predictable conditions and schedule.', kind: 'alignment', direction: 'any' },
      { requirementId: 'req.front.experience', constructId: 'experience.applied-projects', constructKind: 'experience', statement: 'Evidence of finishing work that other people depended on.', kind: 'experience', direction: 'any' },
    ],
    entryRoutes: [
      'Direct entry to a front-line role with structured training.',
      'Move from a back-office function into a customer-facing team.',
      'Supervisor route after demonstrated reliability in a front-line role.',
    ],
    tradeoffs: [
      { statement: 'Emotional labour is a real part of the work.', costsWhat: 'Composure.' },
      { statement: 'Performance is visible and measured continuously.', costsWhat: 'Privacy in how you work.' },
    ],
    openQuestions: [
      'How do you recover after a difficult interaction?',
      'Do you want the customer relationship or the case behind it?',
    ],
    sourceRef: templateSource,
    restrictedUse: ['Templates do not represent pay, hours, or employment quality; those must be checked with employers.'],
  },
];

function mintId(prefix: string, seed: unknown): string {
  const hash = crypto.createHash('sha256').update(JSON.stringify(seed)).digest('hex').slice(0, 16);
  return `${prefix}_${hash}`;
}

export class SessionEngine {
  private signals: Signal[] = [];
  private representations: Representation1to3[] = [];
  private pathwaySets: PathwaySet[] = [];
  private decisions: UserDecisionRecord[] = [];
  private corrections: CorrectionRecord[] = [];
  private proposals: ProposalRecord[] = [];
  private reviews: Map<string, ReviewState> = new Map();

  getCatalog(): Catalog {
    return {
      items: ALL_ITEMS,
      capabilityContracts: CAPABILITY_CONTRACTS,
      contractVersions: CONTRACT_VERSIONS,
      invariantDescriptors: INVARIANT_DESCRIPTORS,
      uncertaintyCodes: UNCERTAINTY_CODES,
      forbiddenScoreKeys: FORBIDDEN_SCORE_KEYS,
      vocabularyId: 'career107-vocabulary',
      userAuthorityStatement: USER_AUTHORITY_STATEMENT,
      noScalarCollapseStatement: NO_SCALAR_COLLAPSE_STATEMENT,
      subjectId: SubjectID,
      subjectLabel: SubjectLabel,
      runtimeId: SessionRuntime,
    };
  }

  getView(): SessionView {
    const rendered: Record<string, RenderedRepresentation> = {};
    for (const r of this.representations) {
      rendered[r.id] = this.renderRepresentation(r);
    }
    const decisionSummaries: Record<string, DecisionSummary> = {};
    for (const set of this.pathwaySets) {
      decisionSummaries[set.id] = this.summarizeDecisions(set);
    }

    const projection: RuntimeProjection = {
      subjectId: SubjectID,
      signalCount: this.signals.length,
      representationCount: this.representations.length,
      pathwaySetCount: this.pathwaySets.length,
      transformationCount: this.signals.length + this.pathwaySets.length,
      executionCount: this.signals.length + this.pathwaySets.length,
      decisionCount: this.decisions.length,
      proposalCount: this.proposals.length,
      uncertaintyNotes: this.representations.reduce((acc, r) => acc + r.U.notes.length, 0),
      contractVersions: {
        domain: '0.1.0',
        representation: '1.3.0',
        uncertainty: '1.0.0',
        pathway: '1.0.0',
        runtime: '0.1.0',
      },
      lastActivityAt: new Date().toISOString(),
    };

    return {
      projection,
      signals: this.signals,
      representations: this.representations,
      rendered,
      pathwaySets: this.pathwaySets,
      decisionSummaries,
      decisions: this.decisions,
      corrections: this.corrections,
      proposals: this.proposals,
      persisted: true,
    };
  }

  capture(input: CaptureInput): { signal: Signal; rejections: string[] } {
    const item = ALL_ITEMS.find((it) => it.itemRef === input.itemRef);
    if (!item) {
      return { signal: undefined as unknown as Signal, rejections: [`S0.ITEM.UNKNOWN: no instrument item is registered for ${input.itemRef}`] };
    }

    const now = new Date().toISOString();
    let position: number | undefined;
    let presentedLabels: string[] | undefined;
    let selectedOptionIds: string[] | undefined;
    let selectedLabels: string[] | undefined;
    let responseText: string | undefined;

    const resp = input.response;
    if (resp.kind === 'option') {
      const optIndex = item.options.findIndex((opt) => opt.id === resp.optionId);
      const opt = item.options[optIndex];
      if (item.responseShape === 'likert-5' || item.responseShape === 'frequency-5') {
        position = optIndex >= 0 ? optIndex / (item.options.length - 1) : 0;
        presentedLabels = [opt?.label ?? resp.optionId];
      }
      selectedOptionIds = [resp.optionId];
      selectedLabels = [opt?.label ?? resp.optionId];
    } else {
      responseText = resp.text;
    }

    const signalId = mintId('sig', {
      subjectId: SubjectID,
      itemRef: item.itemRef,
      response: input.response,
      now,
    });

    const rawContext = input.declaredContext ?? [];
    const contextFields: ContextField[] = rawContext.map((c) => ({
      key: c.key,
      value: c.value,
      assertedBy: { kind: 'user', id: 'user.0', label: 'User 0' },
    }));

    const context: CareerContext = {
      id: signalId,
      kind: 'declared',
      fields: contextFields,
    };

    const source = input.source ?? {
      kind: 'direct-response',
      ref: 'web-session',
      label: 'Candidate Direct Input',
    };

    const evidenceRecord: EvidenceRecord = {
      id: signalId,
      signalId,
      status: 'primary',
      provenance: {
        sourceRef: source.ref,
        sourceKind: source.kind,
        assertedBy: { kind: 'user', id: 'user.0', label: 'User 0' },
        capturedBy: { kind: 'system', id: 'career107.runtime', label: 'Career Assessment 107 Runtime' },
        lineage: [],
      },
      method: {
        ref: `method.${item.responseShape}.v1`,
        kind: item.responseShape === 'open-text' ? 'free-text-response' : 'self-report-item',
        version: '1.0.0',
        description: `Administration of ${item.itemRef} with ${item.responseShape} shape.`,
        limitations: [...item.limitations],
      },
      temporal: {
        observedAt: now,
        recordedAt: now,
        sessionRef: input.sessionRef ?? 'session.app',
      },
      quality: {
        directness: 'direct',
        recency: 'current',
        completeness: 'complete',
        reliability: 'single-sitting-self-report',
        validity: item.validated ? 'validated' : 'unvalidated',
        sampleSize: 1,
        notes: 'Single self-report observation; no corroborating evidence is referenced yet.',
      },
    };

    const uncertaintyNotes: UncertaintyNote[] = [
      {
        id: mintId('unc', { signalId, code: 'U-SELF-REPORT-BIAS' }),
        code: 'U-SELF-REPORT-BIAS',
        source: 'method',
        kind: 'epistemic',
        level: 'moderate',
        detail: 'Self-report at a single sitting: subject to momentary self-perception and social desirability.',
        affects: ['assessment'],
        notedBy: { kind: 'system', id: 'career107.runtime' },
      },
      {
        id: mintId('unc', { signalId, code: 'U-INSTRUMENT-UNVALIDATED' }),
        code: 'U-INSTRUMENT-UNVALIDATED',
        source: 'instrument',
        kind: 'measurement',
        level: 'moderate',
        detail: 'The instrument has no recorded construct validity evidence in this deployment.',
        affects: ['assessment', 'constructs'],
        notedBy: { kind: 'system', id: 'career107.runtime' },
      },
      {
        id: mintId('unc', { signalId, code: 'U-METHOD-LIMITED' }),
        code: 'U-METHOD-LIMITED',
        source: 'method',
        kind: 'procedural',
        level: 'low',
        detail: 'Single sitting; no corroborating longitudinal observations.',
        affects: ['evidence'],
        notedBy: { kind: 'system', id: 'career107.runtime' },
      },
    ];

    const uncertainty: UncertaintyProfile = {
      profileVersion: '1.0.0',
      coverage: 'assessed',
      notes: uncertaintyNotes,
    };

    const signal: Signal = {
      id: signalId,
      subjectId: SubjectID,
      instrument: {
        instrumentId: item.instrumentId,
        instrumentVersion: item.instrumentVersion,
        itemRef: item.itemRef,
        itemVersion: item.itemVersion,
        promptText: item.promptText,
        responseShape: item.responseShape,
        validated: item.validated,
      },
      response: {
        kind: input.response.kind === 'text' ? 'text' : item.responseShape === 'single-select' ? 'categorical' : 'ordinal',
        shape: item.responseShape,
        policy: {
          id: 'policy.self-description.v1',
          version: '1.0.0',
          direction: 'ascending',
          statement: 'Response values reflect declared self-description.',
        },
        position,
        presentedLabels,
        selectedOptionIds,
        selectedLabels,
        text: responseText,
        charCount: responseText ? responseText.length : undefined,
      },
      capturedAt: now,
      context,
      evidence: [evidenceRecord],
      uncertainty,
    };

    this.signals.push(signal);
    return { signal, rejections: [] };
  }

  decompose(signalId: string): { representation: Representation1to3; rejections: string[] } {
    const signal = this.signals.find((s) => s.id === signalId);
    if (!signal) {
      return { representation: undefined as unknown as Representation1to3, rejections: [`S1.SIGNAL.NOT-FOUND: no captured signal ${signalId}`] };
    }

    const item = ALL_ITEMS.find((it) => it.itemRef === signal.instrument.itemRef);
    const constructs = item ? item.constructs : [];

    const now = new Date().toISOString();
    const representationId = mintId('r13', { signalId, now });

    const settingField = signal.context.fields.find((f) => f.key === 'setting');
    const settingVal = settingField ? String(settingField.value) : 'unspecified';

    const representation: Representation1to3 = {
      id: representationId,
      schemaVersion: '1.3.0',
      signalId: signal.id,
      subjectId: signal.subjectId,
      A: {
        id: signal.id,
        instrument: signal.instrument,
        constructs,
        response: signal.response,
        observedAt: signal.capturedAt,
        setting: settingVal,
      },
      E: {
        id: signal.id,
        primaryEvidenceId: signal.evidence[0]?.id ?? signal.id,
        bundle: signal.evidence,
      },
      C: signal.context,
      U: signal.uncertainty,
      createdAt: now,
      createdBy: { kind: 'system', id: 'career107.runtime', label: 'Career Assessment 107 Runtime' },
      transformationRef: 'transformation.decompose-1to3@1.0.0',
    };

    // Replace previous representation for this item if one exists
    const prevIndex = this.representations.findIndex((r) => r.A.instrument.itemRef === signal.instrument.itemRef);
    if (prevIndex >= 0) {
      this.representations[prevIndex] = representation;
    } else {
      this.representations.push(representation);
    }

    return { representation, rejections: [] };
  }

  mapPathways(): { pathwaySet: PathwaySet; rejections: string[] } {
    if (this.representations.length === 0) {
      return {
        pathwaySet: undefined as unknown as PathwaySet,
        rejections: ['S2.PATHWAY.NO-REPRESENTATIONS: pathway mapping requires at least one validated representation (§S1 → S2)'],
      };
    }

    // Collect latest representation per construct
    const obsByConstruct: Record<string, { rep: Representation1to3; position?: number; optionIds?: readonly string[]; displayValue: string }[]> = {};
    const assessedConstructs = new Set<string>();

    for (const r of this.representations) {
      for (const c of r.A.constructs) {
        assessedConstructs.add(c.constructId);
        if (!obsByConstruct[c.constructId]) obsByConstruct[c.constructId] = [];

        let displayValue = '';
        if (r.A.response.kind === 'ordinal' && r.A.response.position !== undefined) {
          displayValue = `${r.A.response.presentedLabels?.[0] ?? ''} (position ${(r.A.response.position * 100).toFixed(0)}%)`;
        } else if (r.A.response.kind === 'categorical') {
          displayValue = (r.A.response.selectedLabels ?? []).join(', ');
        } else {
          displayValue = 'free-text narrative observation';
        }

        obsByConstruct[c.constructId]!.push({
          rep: r,
          position: r.A.response.position,
          optionIds: r.A.response.selectedOptionIds,
          displayValue,
        });
      }
    }

    const now = new Date().toISOString();
    const policy = DEFAULT_MAPPING_POLICY;

    const candidates: PathwayCandidate[] = PATHWAY_CATALOGUE.map((tmpl) => {
      const requirements = tmpl.requirements.map((reqTmpl) => {
        const obs = obsByConstruct[reqTmpl.constructId] ?? [];
        let status: 'supported' | 'conflicting' | 'gap' | 'undetermined' = 'undetermined';
        let rationale = 'No observation in your record bears on this requirement yet.';
        const observationsList: { value: string; evidenceRefs: string[] }[] = [];
        const evidenceRefs: string[] = [];

        if (obs.length > 0) {
          for (const o of obs) {
            observationsList.push({
              value: o.displayValue,
              evidenceRefs: [o.rep.E.primaryEvidenceId],
            });
            evidenceRefs.push(o.rep.E.primaryEvidenceId);
          }

          if (reqTmpl.kind === 'constraint') {
            const selected = obs.flatMap((o) => o.optionIds ?? []);
            if (reqTmpl.constraintAllowedOptions) {
              const satisfied = selected.some((opt) => reqTmpl.constraintAllowedOptions!.includes(opt));
              if (satisfied) {
                status = 'supported';
                rationale = 'Your declared availability is compatible with the working pattern this direction normally uses.';
              } else {
                status = 'gap';
                rationale = 'Your declared availability is not compatible with the working pattern this direction normally uses.';
              }
            } else if (reqTmpl.constraintOptionOrder && reqTmpl.constraintMinRank !== undefined) {
              let maxRank = -1;
              for (const opt of selected) {
                const rank = reqTmpl.constraintOptionOrder.indexOf(opt);
                if (rank > maxRank) maxRank = rank;
              }
              if (maxRank >= reqTmpl.constraintMinRank) {
                status = 'supported';
                rationale = `Your declared mobility covers rank ${reqTmpl.constraintMinRank} or above in the template's ordering.`;
              } else {
                status = 'gap';
                rationale = `Your declared mobility does not reach rank ${reqTmpl.constraintMinRank} in the template's ordering.`;
              }
            }
          } else {
            // Alignment or Experience
            const positions = obs.map((o) => o.position).filter((p): p is number => p !== undefined);
            if (positions.length === 0) {
              status = 'undetermined';
              rationale = 'Observations recorded are narrative or categorical and do not produce an ordinal band.';
            } else {
              const high = positions.filter((p) => p >= policy.highBand).length;
              const low = positions.filter((p) => p <= policy.lowBand).length;
              const middle = positions.filter((p) => p > policy.lowBand && p < policy.highBand).length;

              if (high > 0 && low > 0) {
                status = 'conflicting';
                rationale = `Observations disagree: ${high} reading(s) in high band and ${low} in low band.`;
              } else if (reqTmpl.direction === 'any') {
                status = 'supported';
                rationale = 'An observation exists for this requirement and the template only asks whether it is present.';
              } else if (reqTmpl.direction === 'high') {
                if (high > 0) {
                  status = 'supported';
                  rationale = `Reading(s) at or above the high band (≥${policy.highBand}) under policy ${policy.id}.`;
                } else if (low > 0) {
                  status = 'gap';
                  rationale = `Reading(s) at or below the low band (≤${policy.lowBand}) under policy ${policy.id}.`;
                } else {
                  status = 'undetermined';
                  rationale = `Reading(s) fall in middle band (${policy.lowBand}–${policy.highBand}) (${middle} reading(s)).`;
                }
              } else if (reqTmpl.direction === 'low') {
                if (low > 0) {
                  status = 'supported';
                  rationale = `Template expects low reading, and reading(s) are at or below low band (≤${policy.lowBand}).`;
                } else if (high > 0) {
                  status = 'gap';
                  rationale = `Template expects low reading, but reading(s) are in high band (≥${policy.highBand}).`;
                } else {
                  status = 'undetermined';
                  rationale = `Reading(s) fall in middle band (${policy.lowBand}–${policy.highBand}).`;
                }
              }
            }
          }
        }

        return {
          requirementId: reqTmpl.requirementId,
          constructId: reqTmpl.constructId,
          statement: reqTmpl.statement,
          kind: reqTmpl.kind,
          status,
          observations: observationsList,
          evidenceRefs,
          rationale,
        };
      });

      const supportSummary = {
        supported: requirements.filter((r) => r.status === 'supported').length,
        conflicting: requirements.filter((r) => r.status === 'conflicting').length,
        gap: requirements.filter((r) => r.status === 'gap').length,
        undetermined: requirements.filter((r) => r.status === 'undetermined').length,
        total: requirements.length,
      };

      const existingReview = this.reviews.get(tmpl.pathwayId);
      const review = existingReview
        ? { state: existingReview, decidedBy: { kind: 'user' as const, id: 'user.0', label: 'User 0' }, decidedAt: now }
        : { state: 'unreviewed' as ReviewState, decidedBy: { kind: 'user' as const, id: 'user.0', label: 'User 0' } };

      const pathwayCandidateId = mintId('pth', { pathwayId: tmpl.pathwayId, now });

      const pathwayUncertainties: UncertaintyNote[] = [
        {
          id: mintId('unc', { pathwayId: tmpl.pathwayId, code: 'U-TRANSFORMATION-LOSS' }),
          code: 'U-TRANSFORMATION-LOSS',
          source: 'mapping',
          kind: 'methodological',
          level: 'low',
          detail: 'Mapping applies declared criterion bands over observations: continuous variations are grouped into bands.',
          affects: ['pathway.requirements'],
          notedBy: { kind: 'system', id: 'career107.runtime' },
        },
      ];

      return {
        id: pathwayCandidateId,
        pathwayId: tmpl.pathwayId,
        name: tmpl.name,
        family: tmpl.family,
        description: tmpl.description,
        requirements,
        supportSummary,
        entryRoutes: tmpl.entryRoutes,
        tradeoffs: tmpl.tradeoffs,
        openQuestions: tmpl.openQuestions,
        uncertainty: pathwayUncertainties,
        supportingRepresentationRefs: this.representations.map((r) => r.id),
        supportingTransformationRefs: ['transformation.decompose-1to3@1.0.0', 'transformation.map-pathways@1.0.0'],
        evidenceRefs: this.representations.map((r) => r.E.primaryEvidenceId),
        sourceRef: tmpl.sourceRef,
        review,
      };
    });

    const allConstructIds = Object.keys(constructDict);
    const unassessed = allConstructIds.filter((cid) => !assessedConstructs.has(cid));

    const pathwaySetId = mintId('pths', { subjectId: SubjectID, now });
    const pathwaySet: PathwaySet = {
      id: pathwaySetId,
      schemaVersion: '1.0.0',
      createdAt: now,
      pathways: candidates,
      coverage: {
        assessedConstructs: Array.from(assessedConstructs).sort(),
        unassessedConstructs: unassessed.sort(),
        observationCount: this.representations.length,
        representationCount: this.representations.length,
      },
      mappingRef: 'transformation.map-pathways@1.0.0',
      mappingPolicyRef: `${policy.id}@${policy.version}`,
      restrictedUse: [
        'Readings come from an instrument with no recorded validation evidence: treat requirement statuses as hypotheses to test, not as measurements of ability or suitability.',
        'Templates carry no labour-market data: check vacancies, pay, and local demand independently.',
      ],
    };

    this.pathwaySets.push(pathwaySet);
    return { pathwaySet, rejections: [] };
  }

  setReview(pathwayId: string, state: Exclude<ReviewState, 'unreviewed'>, rationale?: string): { rejections: string[] } {
    const now = new Date().toISOString();

    // Update in latest pathway set
    const latest = this.pathwaySets[this.pathwaySets.length - 1];
    if (latest) {
      const idx = latest.pathways.findIndex((p) => p.pathwayId === pathwayId || p.id === pathwayId);
      if (idx >= 0) {
        const target = latest.pathways[idx]!;
        const canonicalId = target.pathwayId;
        this.reviews.set(canonicalId, state);

        const decision: UserDecisionRecord = {
          id: mintId('dec', { pathwayId: canonicalId, state, now }),
          decisionKind: state === 'pursuing' ? 'pursue-pathway' : state === 'not-a-fit' ? 'dismiss-pathway' : 'explore-pathway',
          targetRef: canonicalId,
          decidedAt: now,
        };
        this.decisions.push(decision);

        const updatedPathways = [...latest.pathways];
        updatedPathways[idx] = {
          ...target,
          review: {
            state,
            decidedBy: { kind: 'user', id: 'user.0', label: 'User 0' },
            decidedAt: now,
            rationale,
          },
        };
        (latest as unknown as { pathways: PathwayCandidate[] }).pathways = updatedPathways;
        return { rejections: [] };
      }
    }

    this.reviews.set(pathwayId, state);
    return { rejections: [] };
  }

  correct(representationId: string, correctedSummary: string): { rejections: string[] } {
    const rep = this.representations.find((r) => r.id === representationId);
    if (!rep) return { rejections: [`S1.REPRESENTATION.NOT-FOUND: no representation ${representationId}`] };

    const correction: CorrectionRecord = {
      id: mintId('cor', { representationId, correctedSummary, now: new Date().toISOString() }),
      targetRef: representationId,
      dimension: 'C',
      previousValueSummary: rep.C.fields.map((f) => `${f.key}=${f.value}`).join('; '),
      correctedValueSummary: correctedSummary,
      reason: 'corrected by user in the application',
    };
    this.corrections.push(correction);
    return { rejections: [] };
  }

  propose(representationId: string): { rejections: string[] } {
    const rep = this.representations.find((r) => r.id === representationId);
    if (!rep) return { rejections: [`S1.REPRESENTATION.NOT-FOUND: no representation ${representationId}`] };

    const now = new Date().toISOString();
    const proposal: ProposalRecord = {
      id: mintId('prop', { representationId, now }),
      proposalKind: 'candidate-question',
      modelMetadata: {
        provider: 'stub.local',
        model: 'stub-model',
        modelVersion: '0.0.1-stub',
        instructionVersion: 'instruction.propose-questions.v1@1.0.0',
        uncertainty: 'Placeholder provider: proposal text is a contract demonstration, not a model judgement.',
      },
      summary:
        'Proposed follow-up questions (model-generated, unverified): 1) Which observation in this record would you most want to check again in six months? 2) Which context field, if changed, would alter this interpretation?',
      evidenceRefs: [],
      uncertainty: [
        {
          id: mintId('unc', { representationId, code: 'U-MODEL-UNVERIFIED' }),
          code: 'U-MODEL-UNVERIFIED',
          source: 'model',
          kind: 'interpretive',
          level: 'moderate',
          detail: 'Model proposals are unverified interpretations and must not be treated as assessment observations.',
          affects: ['proposals'],
          notedBy: { kind: 'system', id: 'career107.runtime' },
        },
      ],
      status: 'pending-review',
    };
    this.proposals.push(proposal);
    return { rejections: [] };
  }

  reset(): void {
    this.signals = [];
    this.representations = [];
    this.pathwaySets = [];
    this.decisions = [];
    this.corrections = [];
    this.proposals = [];
    this.reviews.clear();
  }

  private renderRepresentation(r: Representation1to3): RenderedRepresentation {
    const labels = r.A.constructs.map((c) => c.label);
    const constructsStr = r.A.constructs.map((c) => `${c.constructId} (${c.kind})`).join(', ');
    const primary = r.E.bundle[0];

    return {
      headline: `${labels.join(', ')} — single observation`,
      subhead: `Signal ${r.signalId} · representation ${r.id} · ${r.transformationRef}`,
      sections: [
        {
          key: 'A',
          title: 'A — Assessment (what was observed)',
          rows: [
            { label: 'Instrument', value: `${r.A.instrument.instrumentId}@${r.A.instrument.instrumentVersion}` },
            { label: 'Item', value: `${r.A.instrument.itemRef}@${r.A.instrument.itemVersion}` },
            { label: 'Prompt', value: r.A.instrument.promptText },
            { label: 'Response', value: r.A.response.kind === 'ordinal' ? `${r.A.response.presentedLabels?.[0] ?? ''} (position ${((r.A.response.position ?? 0) * 100).toFixed(0)}%)` : (r.A.response.selectedLabels ?? []).join(', ') || r.A.response.text || 'recorded' },
            { label: 'Constructs', value: constructsStr },
            { label: 'Observed at', value: r.A.observedAt },
            { label: 'Setting', value: r.A.setting },
          ],
        },
        {
          key: 'E',
          title: 'E — Evidence (why it exists, what supports it)',
          rows: [
            { label: 'Primary evidence', value: primary ? primary.id : 'unresolved' },
            { label: 'Source', value: primary ? `${primary.provenance.sourceRef} (${primary.provenance.sourceKind})` : 'unresolved' },
            { label: 'Asserted by', value: primary ? `${primary.provenance.assertedBy.kind}:${primary.provenance.assertedBy.id}` : 'unresolved' },
            { label: 'Method', value: primary ? `${primary.method.ref}@${primary.method.version} — ${primary.method.description}` : 'unresolved' },
            { label: 'Temporal', value: primary ? `observed ${primary.temporal.observedAt}; recorded ${primary.temporal.recordedAt}` : 'unresolved' },
            { label: 'Quality', value: primary ? `${primary.quality.directness}/${primary.quality.completeness}/${primary.quality.validity}/${primary.quality.reliability}/n=${primary.quality.sampleSize}` : 'unresolved' },
            { label: 'Method limitations', value: primary && primary.method.limitations.length > 0 ? primary.method.limitations.join(' · ') : 'none recorded' },
          ],
        },
        {
          key: 'C',
          title: 'C — Career context (where this may legitimately be relevant)',
          rows: r.C.fields.map((f) => ({
            label: f.key,
            value: Array.isArray(f.value) ? f.value.join(', ') : String(f.value),
            provenance: `${f.assertedBy.kind}:${f.assertedBy.id}`,
          })),
        },
        {
          key: 'U',
          title: 'U — Uncertainty (cross-cutting over A, E, C)',
          rows: [
            { label: 'Coverage', value: r.U.coverage },
            ...r.U.notes.map((n) => ({
              label: n.code,
              value: `${n.level} — ${n.detail}`,
              detail: n.mitigation ? `mitigation: ${n.mitigation}` : undefined,
              provenance: `${n.notedBy.kind}:${n.notedBy.id}`,
            })),
          ],
        },
      ],
    };
  }

  private summarizeDecisions(set: PathwaySet): DecisionSummary {
    let unreviewed = 0;
    let explored = 0;
    let declined = 0;
    let pursuing = 0;

    for (const p of set.pathways) {
      switch (p.review.state) {
        case 'unreviewed':
          unreviewed++;
          break;
        case 'interesting':
        case 'deferred':
          explored++;
          break;
        case 'not-a-fit':
          declined++;
          break;
        case 'pursuing':
          pursuing++;
          break;
      }
    }

    return {
      total: set.pathways.length,
      unreviewed,
      explored,
      declined,
      pursuing,
    };
  }
}
