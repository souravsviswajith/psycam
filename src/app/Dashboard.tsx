import type { ReactNode } from 'react';
import { Icon } from './icons.tsx';
import type { SessionApi } from '../state/runtime.ts';
import type { InstrumentItem } from '../api/types.ts';
import {
  candidateId,
  initials,
  labelFor,
  latestAnswers,
  matchPercent,
  strengths,
  byMatch,
  FAMILY_ICON,
  SETTING_OPTIONS,
  STAGE_OPTIONS,
  type Profile,
} from './shared.tsx';
import { latestSet } from './Pathways.tsx';
import { QuickInsightsModule } from './QuickInsightsModule.tsx';
import { AssessmentProgressChart } from './AssessmentProgressChart.tsx';

interface DashboardProps {
  api: SessionApi;
  profile: Profile;
  onNavigate: (tab: 'dashboard' | 'profile' | 'assess' | 'pathways' | 'plan' | 'dossier' | 'syllabus') => void;
  onOpenPathway: (id: string) => void;
  onOpenItem: (index: number) => void;
  onUpdateProfile?: (profile: Profile) => void;
  onCelebrate?: () => void;
}

export function Dashboard({
  api,
  profile,
  onNavigate,
  onOpenPathway,
  onOpenItem,
  onUpdateProfile,
  onCelebrate,
}: DashboardProps): ReactNode {
  const items = api.catalog.items;
  const answers = latestAnswers(api.view);
  const answeredCount = answers.size;
  const currentSet = latestSet(api);
  const pathways = currentSet?.pathways ?? [];
  const topPathways = byMatch(pathways).slice(0, 4);
  const candidateStrengths = strengths(api.view, items);
  const evidenceList = profile.userEvidence ?? [];
  const verifiedEvidenceCount = evidenceList.filter((e) => e.verified).length;
  const planItems = profile.planItems ?? [];
  const activePlanItems = planItems.filter((i) => i.status !== 'completed').slice(0, 3);
  const confirmedCompletedCount = planItems.filter((i) => i.status === 'completed' && i.userConfirmedCompleted).length;

  const firstOpenIndex = items.findIndex((it: InstrumentItem) => !answers.has(it.itemRef));
  const resumeIndex = firstOpenIndex < 0 ? 0 : firstOpenIndex;

  return (
    <div className="c-stack-lg">
      {/* Workspace Welcome Banner */}
      <section className="c-card c-card-highlight">
        <div className="c-row c-top">
          <div style={{ flex: 1 }}>
            <div className="c-row" style={{ justifyContent: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <span className="c-tag">
                <Icon name="verified" size={14} /> Career Assessment 107 V2 · Desktop Workspace
              </span>
              <span className="c-chip c-chip-met">
                <Icon name="lock" size={12} /> Local-Only Storage
              </span>
            </div>

            <h1 className="c-h1">
              Welcome, {profile.name || 'Candidate'}
            </h1>
            <p className="c-body-sm" style={{ maxWidth: '780px' }}>
              A private-by-default workspace for career self-assessment, evidence organization, career exploration, and development planning.
              Rooted in the principle that <strong>the user decides</strong>: this system models options with explicit uncertainty rather than collapsing you to a single predictive score.
            </p>
          </div>

          <div className="c-candidate-badge">
            <div className="c-avatar c-avatar-lg">
              {initials(profile.name)}
            </div>
            <div className="c-caption" style={{ marginTop: '4px', textAlign: 'center' }}>
              <strong>{candidateId(api.view)}</strong>
              <div>{labelFor(STAGE_OPTIONS, profile.careerStage)}</div>
              <div>{labelFor(SETTING_OPTIONS, profile.setting)}</div>
            </div>
          </div>
        </div>

        {/* Quick 4-Stat Strip */}
        <div className="c-benchmarks" style={{ marginTop: '20px' }}>
          <div className="c-stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('assess')}>
            <strong>{answeredCount} / {items.length}</strong>
            <span>Assessment Items</span>
            <div className="c-caption">{answeredCount === items.length ? '100% complete' : `${items.length - answeredCount} remaining`}</div>
          </div>

          <div className="c-stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('pathways')}>
            <strong style={{ color: 'var(--secondary)' }}>{pathways.length}</strong>
            <span>Plausible Directions</span>
            <div className="c-caption">{api.view.decisions.length} decisions logged</div>
          </div>

          <div className="c-stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('profile')}>
            <strong style={{ color: 'var(--success)' }}>{evidenceList.length}</strong>
            <span>Evidence Records</span>
            <div className="c-caption">{verifiedEvidenceCount} verified credentials</div>
          </div>

          <div className="c-stat" style={{ cursor: 'pointer' }} onClick={() => onNavigate('plan')}>
            <strong style={{ color: 'var(--primary-hover)' }}>{planItems.length}</strong>
            <span>Action Milestones</span>
            <div className="c-caption">{confirmedCompletedCount} confirmed done</div>
          </div>
        </div>
      </section>

      {/* Quick Insights Module: Top 3 Most Aligned Career Pathways from Recent Answers */}
      <QuickInsightsModule
        api={api}
        profile={profile}
        onOpenPathway={onOpenPathway}
        onNavigate={onNavigate}
        onOpenItem={onOpenItem}
        onUpdateProfile={onUpdateProfile}
      />

      {/* Visual Assessment Progress Tracking Chart (Recharts) */}
      <AssessmentProgressChart
        api={api}
        onOpenItem={onOpenItem}
        onNavigate={onNavigate}
        onCelebrate={onCelebrate}
      />

      {/* Main 2-Column Desktop Grid */}
      <div className="c-grid-2">
        {/* Left Column: Top Directions & Strengths */}
        <div className="c-stack">
          {/* Top Directions */}
          <section className="c-card">
            <div className="c-row">
              <div>
                <h2 className="c-h2">Plausible Career Directions</h2>
                <p className="c-body-sm">Criterion-referenced alternatives matched to your declared profile.</p>
              </div>
              <button
                type="button"
                className="c-btn c-btn-secondary"
                onClick={() => onNavigate('pathways')}
              >
                View All ({pathways.length}) <Icon name="arrow_forward" size={16} />
              </button>
            </div>
            <div className="c-rule" />

            {pathways.length === 0 ? (
              <div className="c-empty-state">
                <Icon name="account_tree" size={32} />
                <p className="c-body-sm">Answer assessment questions to map plausible directions.</p>
                <button
                  type="button"
                  className="c-btn c-btn-primary"
                  onClick={() => onOpenItem(resumeIndex)}
                >
                  Start Assessment
                </button>
              </div>
            ) : (
              <div className="c-stack">
                {topPathways.map((pathway) => (
                  <div
                    key={pathway.id}
                    className="c-pathway-preview-card"
                    onClick={() => onOpenPathway(pathway.pathwayId)}
                  >
                    <div className="c-row">
                      <div className="c-row" style={{ gap: '10px' }}>
                        <span className="c-family-icon">
                          <Icon name={FAMILY_ICON[pathway.family] ?? 'account_tree'} size={20} />
                        </span>
                        <div>
                          <strong className="c-strong">{pathway.name}</strong>
                          <div className="c-caption">
                            Family: {pathway.family} · {pathway.supportSummary.supported} requirements met
                          </div>
                        </div>
                      </div>

                      <div className="c-row" style={{ gap: '8px' }}>
                        <span className={`c-review-badge c-review-${pathway.review.state}`}>
                          {pathway.review.state === 'unreviewed' ? 'Unreviewed' : pathway.review.state}
                        </span>
                        <span className="c-match-pill">{matchPercent(pathway)}% matched</span>
                        <Icon name="chevron_right" size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Candidate Strengths */}
          <section className="c-card">
            <h2 className="c-h2">Identified Strengths & High Affinities</h2>
            <p className="c-body-sm">Top self-reported constructs from the 107 battery.</p>
            <div className="c-rule" />

            {candidateStrengths.length === 0 ? (
              <p className="c-body-sm">Answer battery items to calculate your observed affinities.</p>
            ) : (
              <div className="c-stack">
                {candidateStrengths.map((str) => (
                  <div key={str.label} className="c-strength-row">
                    <div className="c-row" style={{ marginBottom: '4px' }}>
                      <strong className="c-strong">{str.label}</strong>
                      <span className="c-mono-sm">{str.percent}% affinity</span>
                    </div>
                    <div className="c-meter">
                      <div className="c-meter-fill" style={{ width: `${str.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Development Plan & Quick Actions */}
        <div className="c-stack">
          {/* Active Development Actions (FR-019, FR-021) */}
          <section className="c-card">
            <div className="c-row">
              <div>
                <h2 className="c-h2">Active Development Actions</h2>
                <p className="c-body-sm">Practical steps to build required capabilities.</p>
              </div>
              <button
                type="button"
                className="c-btn c-btn-secondary"
                onClick={() => onNavigate('plan')}
              >
                Plan Board ({planItems.length}) <Icon name="arrow_forward" size={16} />
              </button>
            </div>
            <div className="c-rule" />

            {activePlanItems.length === 0 ? (
              <div className="c-empty-state">
                <Icon name="assignment" size={32} />
                <p className="c-body-sm">All current plan actions are completed or none created yet.</p>
                <button
                  type="button"
                  className="c-btn c-btn-primary"
                  onClick={() => onNavigate('plan')}
                >
                  Create Plan Action
                </button>
              </div>
            ) : (
              <div className="c-stack">
                {activePlanItems.map((item) => (
                  <div key={item.id} className="c-plan-mini-item">
                    <div className="c-row">
                      <div style={{ flex: 1 }}>
                        <span className="c-badge" style={{ marginBottom: '4px' }}>
                          {item.kind.replace('-', ' ')}
                        </span>
                        <strong className="c-strong" style={{ display: 'block' }}>
                          {item.title}
                        </strong>
                        {item.description && (
                          <div className="c-caption">{item.description}</div>
                        )}
                      </div>
                      <span className={`c-chip c-chip-${item.status}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Assessment Battery Shortcut */}
          <section className="c-card">
            <div className="c-row">
              <div>
                <h2 className="c-h2">Self-Description Battery</h2>
                <p className="c-body-sm">
                  19 structured items exploring interests, working style, values, and situational constraints.
                </p>
              </div>
              <button
                type="button"
                className="c-btn c-btn-primary"
                onClick={() => onOpenItem(resumeIndex)}
              >
                {answeredCount === 0 ? 'Start Battery' : answeredCount === items.length ? 'Review All' : 'Resume Battery'}
                <Icon name="arrow_forward" size={16} />
              </button>
            </div>
            <div className="c-rule" />
            <div className="c-row" style={{ marginBottom: '6px' }}>
              <span className="c-caption">Battery Completion: {answeredCount} of {items.length} items</span>
              <span className="c-mono-sm c-strong">{Math.round((answeredCount / items.length) * 100)}%</span>
            </div>
            <div className="c-meter">
              <div className="c-meter-fill" style={{ width: `${Math.round((answeredCount / items.length) * 100)}%` }} />
            </div>
          </section>

          {/* Product Principles & Transparency Notice */}
          <section className="c-card" style={{ background: 'var(--surface-low)' }}>
            <h3 className="c-h3">
              <Icon name="insights" size={18} /> Invariant & Transparency Guarantee
            </h3>
            <p className="c-body-sm" style={{ marginTop: '6px' }}>
              • <strong>No Scalar Score Collapse:</strong> Your career potential is represented as multi-dimensional (A, E, C) | U rather than a single ranking score.
            </p>
            <p className="c-body-sm" style={{ marginTop: '4px' }}>
              • <strong>No Employment Guarantee:</strong> Findings present criterion-referenced options and trade-offs; they do not predict or guarantee hiring outcomes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
